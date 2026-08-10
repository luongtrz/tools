import { useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { literal, useI18n } from "@/i18n";
import {
  FileDropZone,
  type DroppedFile,
} from "@/components/ToolSupport";
import {
  ToolNotice,
  ToolPage,
  ToolPanel,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toolStyles } from "@/components/toolStyles";
import { downloadBlob } from "@/lib/download";
import {
  renderPdfPagePreviews,
  renderPdfPages,
  type PdfPagePreview,
} from "@/lib/pdfRender";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif",
].join(",");

type ImageFormat = "png" | "jpeg";
type PdfImagePageSize = "a4" | "letter" | "image";
type PdfImageMargin = "none" | "small" | "standard";

interface ImageEntry {
  id: string;
  name: string;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

function outputStem(fileName: string, fallback: string): string {
  const stem = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-");
  return stem || fallback;
}

function extensionForFormat(format: ImageFormat): string {
  return format === "png" ? "png" : "jpg";
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",", 2);
  const mime = header.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const binary = atob(encoded || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface RasterizedImage extends ImageDimensions {
  bytes: Uint8Array;
  format: "png" | "jpeg";
}

async function imageDimensions(blob: Blob): Promise<ImageDimensions> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image could not be decoded"));
    };
    image.src = url;
  });
}

async function rasterizeImage(blob: Blob): Promise<RasterizedImage> {
  const dimensions = await imageDimensions(blob);
  if (blob.type === "image/png" || blob.type === "image/jpeg") {
    return {
      bytes: new Uint8Array(await blob.arrayBuffer()),
      format: blob.type === "image/jpeg" ? "jpeg" : "png",
      ...dimensions,
    };
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("This browser cannot convert this image format");
  }
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas is unavailable");
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("Image conversion failed"));
    }, "image/png");
  });
  return {
    bytes: new Uint8Array(await pngBlob.arrayBuffer()),
    format: "png",
    width: canvas.width,
    height: canvas.height,
  };
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function PageSelectCard({
  preview,
  selected,
  onToggle,
  pageLabel,
}: {
  preview: PdfPagePreview;
  selected: boolean;
  onToggle: () => void;
  pageLabel: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-lg border bg-card transition",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
      )}
    >
      <button
        type="button"
        className={cn(
          "relative flex min-h-[180px] w-full items-center justify-center",
          "bg-muted/30 p-2 text-left transition hover:bg-primary/5",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-inset focus-visible:ring-ring",
        )}
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={pageLabel}
      >
        {preview.src ? (
          <img
            src={preview.src}
            alt={pageLabel}
            className="max-h-64 w-full object-contain shadow-sm"
          />
        ) : (
          <span className="px-3 text-center text-xs text-muted-foreground">
            {pageLabel}
          </span>
        )}
        {selected && (
          <span
            className={cn(
              "absolute right-3 top-3 grid size-6 place-items-center",
              "rounded-full bg-primary text-xs font-bold",
              "text-primary-foreground shadow-sm",
            )}
          >
            ✓
          </span>
        )}
      </button>
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={pageLabel}
        />
        <span className="min-w-0 truncate text-xs font-medium text-foreground">
          {pageLabel}
        </span>
      </div>
    </div>
  );
}

export function PdfToImageTool() {
  const { t } = useI18n();
  const [file, setFile] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [scale, setScale] = useState("1.5");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loadId = useRef(0);
  const selectedSet = useMemo(() => new Set(selectedPages), [selectedPages]);

  async function loadPdf(next: DroppedFile | null): Promise<void> {
    const requestId = ++loadId.current;
    setFile(null);
    setFileName("");
    setPreviews([]);
    setSelectedPages([]);
    setProgress({ current: 0, total: 0 });
    setError("");
    if (!next) return;
    setLoading(true);
    try {
      const blob = await next.blob();
      const rendered = await renderPdfPagePreviews(
        new Uint8Array(await blob.arrayBuffer()),
        (_pageNumber, current, total) => setProgress({ current, total }),
      );
      if (requestId !== loadId.current) return;
      setFile(blob);
      setFileName(next.name);
      setPreviews(rendered);
      setSelectedPages(rendered.map((page) => page.pageNumber));
    } catch {
      if (requestId === loadId.current) setError(t("pdfLoadFailed"));
    } finally {
      if (requestId === loadId.current) setLoading(false);
    }
  }

  function togglePage(pageNumber: number): void {
    setSelectedPages((current) =>
      current.includes(pageNumber)
        ? current.filter((page) => page !== pageNumber)
        : [...current, pageNumber].sort((a, b) => a - b),
    );
  }

  async function downloadImages(): Promise<void> {
    if (!file || !selectedPages.length) return;
    setBusy(true);
    setError("");
    try {
      const rendered = await renderPdfPages(new Uint8Array(await file.arrayBuffer()), {
        scale: Number(scale),
        format,
        quality: 0.92,
        pageNumbers: selectedPages,
      });
      const valid = rendered.filter(
        (page): page is PdfPagePreview & { src: string } => Boolean(page.src),
      );
      if (valid.length !== selectedPages.length) {
        throw new Error("Some pages could not be rendered");
      }
      const extension = extensionForFormat(format);
      const stem = outputStem(fileName, "document");
      if (valid.length === 1) {
        downloadBlob(
          `${stem}-p${String(valid[0].pageNumber).padStart(3, "0")}.${extension}`,
          dataUrlToBlob(valid[0].src),
        );
      } else {
        const zip = new JSZip();
        valid.forEach((page) => {
          zip.file(
            `${stem}-p${String(page.pageNumber).padStart(3, "0")}.${extension}`,
            dataUrlToBlob(page.src),
          );
        });
        downloadBlob(`${stem}-images.zip`, await zip.generateAsync({ type: "blob" }));
      }
    } catch {
      setError(t("imageExportFailed"));
    } finally {
      setBusy(false);
    }
  }

  function reset(): void {
    ++loadId.current;
    setFile(null);
    setFileName("");
    setPreviews([]);
    setSelectedPages([]);
    setProgress({ current: 0, total: 0 });
    setError("");
  }

  return (
    <ToolPage slug="pdf-to-image">
      <ToolPanel
        title="Choose a PDF"
        description="Render every PDF page as a separate PNG or JPG image."
        actions={<OutputActions onReset={reset} onClear={reset} />}
      >
        <FileDropZone
          accept="application/pdf,.pdf"
          label={t("dropPdfToImage")}
          description={t("dropPdfToImageDescription")}
          onFiles={async (files) => loadPdf(files[0] || null)}
        />
        {fileName && (
          <p className={toolStyles.selectedFile}>
            {fileName} · {previews.length} {t("pages")}
          </p>
        )}
        {loading && (
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            {t("renderingPagePreviews", progress)}
          </p>
        )}
        {previews.length > 0 && (
          <section className="mt-5 overflow-hidden rounded-lg border border-border bg-muted/20">
            <div
              className={cn(
                "flex flex-col gap-3 border-b border-border p-4",
                "sm:flex-row sm:items-start sm:justify-between",
              )}
            >
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  {t("selectImagePages")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("selectedImagesCount", {
                    selected: selectedPages.length,
                    total: previews.length,
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedPages(
                      previews.map((page) => page.pageNumber),
                    )
                  }
                >
                  {t("selectAllPages")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedPages([])}>
                  {t("clearPageSelection")}
                </Button>
              </div>
            </div>
            <div
              className={cn(
                "grid grid-cols-2 gap-3 p-4 sm:grid-cols-3",
                "md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
              )}
            >
              {previews.map((preview) => (
                <PageSelectCard
                  key={preview.pageNumber}
                  preview={preview}
                  selected={selectedSet.has(preview.pageNumber)}
                  onToggle={() => togglePage(preview.pageNumber)}
                  pageLabel={t("pageLabel", { page: preview.pageNumber })}
                />
              ))}
            </div>
          </section>
        )}
        {error && (
          <ToolNotice variant="error" className="mt-4">
            {error}
          </ToolNotice>
        )}
      </ToolPanel>

      {previews.length > 0 && (
        <ToolPanel
          title="Image output"
          description={
            "Choose the output format and resolution, then download one image per selected page."
          }
          actions={
            <Button
              onClick={() => void downloadImages()}
              busy={busy}
              disabled={!selectedPages.length || loading}
            >
              {busy
                ? t("processing")
                : t("downloadImages", { count: selectedPages.length })}
            </Button>
          }
        >
          <div className={toolStyles.inlineFields}>
            <label className={toolStyles.label}>
              {t("imageFormat")}
              <select
                className={toolStyles.select}
                value={format}
                onChange={(event) =>
                  setFormat(event.target.value as ImageFormat)
                }
              >
                <option value="png">PNG · {t("pngLossless")}</option>
                <option value="jpeg">JPG · {t("jpegSmaller")}</option>
              </select>
            </label>
            <label className={toolStyles.label}>
              {t("imageResolution")}
              <select
                className={toolStyles.select}
                value={scale}
                onChange={(event) => setScale(event.target.value)}
              >
                <option value="1">100% · 72 DPI</option>
                <option value="1.5">150% · 108 DPI</option>
                <option value="2">200% · 144 DPI</option>
              </select>
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("multipleImagesZipHint")}
          </p>
        </ToolPanel>
      )}
    </ToolPage>
  );
}

function ImageListItem({
  item,
  index,
  total,
  onMove,
  onRemove,
}: {
  item: ImageEntry;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  return (
    <li className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3">
      <img
        src={item.previewUrl}
        alt={item.name}
        className="size-16 shrink-0 rounded-md border border-border bg-muted object-contain"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {index + 1}. {item.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.width} × {item.height} px
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        <Button
          size="icon"
          variant="outline"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label={t("moveImageUp")}
        >
          ↑
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          aria-label={t("moveImageDown")}
        >
          ↓
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onRemove}
          aria-label={t("removeImage")}
        >
          ×
        </Button>
      </div>
    </li>
  );
}

function pdfPageDimensions(
  pageSize: PdfImagePageSize,
  imageWidth: number,
  imageHeight: number,
): { width: number; height: number } {
  if (pageSize === "image") {
    const pointsPerPixel = 72 / 96;
    const rawWidth = imageWidth * pointsPerPixel;
    const rawHeight = imageHeight * pointsPerPixel;
    const scale = Math.min(1, 1440 / Math.max(rawWidth, rawHeight));
    return { width: rawWidth * scale, height: rawHeight * scale };
  }
  const portrait =
    pageSize === "a4"
      ? { width: 595.28, height: 841.89 }
      : { width: 612, height: 792 };
  return imageWidth > imageHeight
    ? { width: portrait.height, height: portrait.width }
    : portrait;
}

function marginPoints(margin: PdfImageMargin): number {
  return margin === "none" ? 0 : margin === "small" ? 18 : 36;
}

export function ImagesToPdfTool() {
  const { language, t } = useI18n();
  const [items, setItems] = useState<ImageEntry[]>([]);
  const [pageSize, setPageSize] = useState<PdfImagePageSize>("a4");
  const [margin, setMargin] = useState<PdfImageMargin>("small");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  async function addImages(files: DroppedFile[]): Promise<void> {
    setError("");
    const next: ImageEntry[] = [];
    for (const file of files) {
      try {
        const blob = await file.blob();
        const dimensions = await imageDimensions(blob);
        next.push({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          name: file.name,
          blob,
          previewUrl: URL.createObjectURL(blob),
          ...dimensions,
        });
      } catch {
        setError(t("imageLoadFailed"));
      }
    }
    if (next.length) setItems((current) => [...current, ...next]);
  }

  function clearImages(): void {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
    setError("");
  }

  function removeImage(index: number): void {
    const item = items[index];
    if (item) URL.revokeObjectURL(item.previewUrl);
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function createPdf(): Promise<void> {
    if (!items.length) return;
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      pdf.setTitle("Images to PDF");
      const padding = marginPoints(margin);
      for (const item of items) {
        const raster = await rasterizeImage(item.blob);
        const image =
          raster.format === "jpeg"
            ? await pdf.embedJpg(raster.bytes)
            : await pdf.embedPng(raster.bytes);
        const pageDimensions = pdfPageDimensions(
          pageSize,
          raster.width,
          raster.height,
        );
        const page = pdf.addPage([pageDimensions.width, pageDimensions.height]);
        const maxWidth = Math.max(1, pageDimensions.width - padding * 2);
        const maxHeight = Math.max(1, pageDimensions.height - padding * 2);
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        page.drawImage(image, {
          x: (pageDimensions.width - width) / 2,
          y: (pageDimensions.height - height) / 2,
          width,
          height,
        });
      }
      const pdfBytes = await pdf.save();
      const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
      new Uint8Array(pdfBuffer).set(pdfBytes);
      downloadBlob(
        `${outputStem(items[0]?.name || "images", "images")}-to-pdf.pdf`,
        new Blob([pdfBuffer], { type: "application/pdf" }),
      );
    } catch {
      setError(t("imageExportFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolPage slug="images-to-pdf">
      <ToolPanel
        title="Add images"
        description={
          "Each image becomes one PDF page. Add multiple files, then arrange them before exporting."
        }
        actions={
          <OutputActions onReset={clearImages} onClear={clearImages} />
        }
      >
        <FileDropZone
          accept={IMAGE_ACCEPT}
          multiple
          label={t("dropImages")}
          description={t("dropImagesDescription")}
          onFiles={async (files) => addImages(files)}
        />
        {items.length > 0 && (
          <ol className="mt-5 grid gap-2">
            {items.map((item, index) => (
              <ImageListItem
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                onMove={(from, to) => setItems((current) => moveItem(current, from, to))}
                onRemove={() => removeImage(index)}
              />
            ))}
          </ol>
        )}
        {items.length === 0 && !error && (
          <p className="mt-4 text-xs text-muted-foreground">{t("noImagesSelected")}</p>
        )}
        {error && (
          <ToolNotice variant="error" className="mt-4">
            {error}
          </ToolNotice>
        )}
      </ToolPanel>

      {items.length > 0 && (
        <ToolPanel
          title="PDF output"
          description={
            "Choose a page size and margin. Images are scaled proportionally and never stretched."
          }
          actions={
            <Button onClick={() => void createPdf()} busy={busy}>
              {busy ? t("processing") : t("createPdf")}
            </Button>
          }
        >
          <div className={toolStyles.inlineFields}>
            <label className={toolStyles.label}>
              {t("pdfPageSize")}
              <select
                className={toolStyles.select}
                value={pageSize}
                onChange={(event) =>
                  setPageSize(event.target.value as PdfImagePageSize)
                }
              >
                <option value="a4">
                  {literal("A4 · auto orientation", language)}
                </option>
                <option value="letter">
                  {literal("Letter · auto orientation", language)}
                </option>
                <option value="image">{t("fitImagePage")}</option>
              </select>
            </label>
            <label className={toolStyles.label}>
              {t("pdfMargin")}
              <select
                className={toolStyles.select}
                value={margin}
                onChange={(event) =>
                  setMargin(event.target.value as PdfImageMargin)
                }
              >
                <option value="none">{t("noMargin")}</option>
                <option value="small">{t("smallMargin")}</option>
                <option value="standard">{t("standardMargin")}</option>
              </select>
            </label>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("imagesToPdfHint")}
          </p>
        </ToolPanel>
      )}
    </ToolPage>
  );
}

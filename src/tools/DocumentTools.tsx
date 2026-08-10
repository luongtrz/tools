import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { literal, useI18n } from "@/i18n";
import { SAMPLE_MARKDOWN } from "@/constants/sampleMarkdown";
import { renderMarkdown } from "@/lib/markdown";
import { markdownToDocxBlob } from "@/lib/docx";
import { downloadBlob, downloadFile } from "@/lib/download";
import {
  ToolLabel,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import { FileDropZone } from "@/components/ToolSupport";
import { toolStyles } from "@/components/toolStyles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

function FilePicker({
  multiple = false,
  onFiles,
}: {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}) {
  const { language } = useI18n();
  function acceptPdfFiles(files: File[]): void {
    onFiles(
      files.filter(
        (file) => file.type === "application/pdf" || /\.pdf$/i.test(file.name),
      ),
    );
  }
  return (
    <label
      className={toolStyles.filePicker}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        acceptPdfFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <span>{literal(multiple ? "Choose PDF files" : "Choose PDF file", language)}</span>
      <input
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        onChange={(event) => {
          acceptPdfFiles(Array.from(event.target.files || []));
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

function pdfBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

function outputStem(fileName: string, fallback: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-") || fallback;
}

function safeDocumentName(value: string, fallback: string): string {
  return (
    value
      .trim()
      .replace(/\.(?:docx?|pptx)$/i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-") || fallback
  );
}

function plainSlideText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/`{1,3}/g, "")
    .replace(/[*~]/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/, "")
    .trim();
}

function wordDocumentHtml(markdown: string, title: string): string {
  const content = markdown.trim() ? renderMarkdown(markdown) : "";
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 760px;
        margin: 40px auto;
        overflow-wrap: anywhere;
      }
      h1, h2, h3 { color: #172235; }
      code {
        background: #f1f3f5;
        padding: 2px 4px;
        font-family: "Courier New", monospace;
      }
      pre {
        background: #f4f6f8;
        border: 1px solid #dbe3ed;
        border-radius: 6px;
        padding: 12px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-wrap: break-word;
        word-break: break-word;
        font-family: "Courier New", monospace;
      }
      pre code {
        background: transparent;
        padding: 0;
        white-space: inherit;
      }
    </style>
  </head>
  <body>${content}</body>
</html>`;
}

export function Md2WordTool() {
  const { t } = useI18n();
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [name, setName] = useState("document");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const safeName = () => safeDocumentName(name, "document");
  const isEmpty = !markdown.trim();
  function exportWord(): void {
    if (isEmpty) {
      setError(t("emptyMarkdown"));
      return;
    }
    try {
      setError("");
      const html = wordDocumentHtml(markdown, safeName());
      downloadFile(`${safeName()}.doc`, html, "application/msword;charset=utf-8");
    } catch {
      setError(t("exportFailed"));
    }
  }
  async function exportDocx(): Promise<void> {
    if (isEmpty) {
      setError(t("emptyMarkdown"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      downloadBlob(
        `${safeName()}.docx`,
        await markdownToDocxBlob(markdown, safeName()),
      );
    } catch {
      setError(t("exportFailed"));
    } finally {
      setBusy(false);
    }
  }
  async function importFile(text: string, fileName: string): Promise<void> {
    setMarkdown(text);
    const base = fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
    if (base) setName(base);
    setError("");
    setWarning(null);
  }
  return (
    <ToolPage slug="md2word">
      <div className={toolStyles.splitLayout}>
        <ToolPanel
          title="Markdown input"
          description="Paste or write the content you want to export."
          actions={
            <OutputActions
              onReset={() => {
                setMarkdown(SAMPLE_MARKDOWN);
                setName("document");
                setError("");
                setWarning(null);
              }}
              onClear={() => setMarkdown("")}
            />
          }
        >
          <ToolTextArea
            value={markdown}
            onChange={setMarkdown}
            ariaLabel="Markdown input"
          />
          <FileDropZone
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="mt-3"
            label="Drop a .md or .txt file"
            description="or click to browse"
            onFiles={async (files) => {
              const file = files[0];
              if (file) await importFile(await file.text(), file.name);
            }}
          />
          {warning && <p className="mt-2 text-xs text-amber-600">{warning}</p>}
        </ToolPanel>
        <ToolPanel
          title="Word preview"
          description="Export a legacy .doc file or a standard .docx document."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportWord}
                disabled={isEmpty}
              >
                Download .doc
              </Button>
              <Button onClick={() => void exportDocx()} busy={busy} disabled={isEmpty}>
                {busy ? t("processing") : "Download .docx"}
              </Button>
            </div>
          }
        >
          {markdown.trim() ? (
            <article
              className={toolStyles.documentPreview}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
            />
          ) : (
            <ToolNotice>{t("emptyMarkdown")}</ToolNotice>
          )}
        </ToolPanel>
      </div>
      <ToolPanel
        title="File name"
        actions={
          <Button variant="ghost" size="sm" onClick={() => setName("document")}>
            {t("reset")}
          </Button>
        }
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="document"
          className="h-9 font-mono"
        />
        {error && <ToolNotice variant="error" className="mt-3">{error}</ToolNotice>}
      </ToolPanel>
    </ToolPage>
  );
}

const SLIDE_OVERFLOW_CHARS = 700;

export function Md2PptxTool() {
  const { t } = useI18n();
  const initialMarkdown = `# Project brief\n\nA focused presentation from Markdown.\n\n---\n\n## Next steps\n\n- Choose a clear story\n- Keep each slide focused`;
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [name, setName] = useState("presentation");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [aspect, setAspect] = useState<"16:9" | "4:3">("16:9");
  const slides = useMemo(
    () => markdown.split(/\n\s*---+\s*\n/g).map((slide) => slide.trim()).filter(Boolean),
    [markdown],
  );
  const overflow = useMemo(
    () => slides.map((slide) => slide.length > SLIDE_OVERFLOW_CHARS),
    [slides],
  );
  async function exportPptx(): Promise<void> {
    if (!slides.length) {
      setError(t("exportFailed"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const pptx = new PptxGenJS();
      pptx.layout = aspect === "16:9" ? "LAYOUT_WIDE" : "LAYOUT_STANDARD";
      pptx.author = "toolmd";
      pptx.subject = "Markdown presentation";
      slides.forEach((content, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: "F7F8FA" };
        const lines = content.split("\n").filter((line) => line.trim());
        const titleLine = lines.find((line) => /^#{1,3}\s/.test(line));
        const title = titleLine
          ? plainSlideText(titleLine.replace(/^#{1,3}\s+/, ""))
          : `Slide ${index + 1}`;
        const body = lines
          .filter((line) => line !== titleLine)
          .map((line) => {
            const bullet = line.match(/^[-*+]\s+(.+)$/);
            return plainSlideText(bullet ? `• ${bullet[1]}` : line);
          })
          .join("\n");
        const w = aspect === "16:9" ? 12 : 10;
        slide.addText(title, {
          x: 0.7,
          y: 0.7,
          w,
          h: 0.8,
          fontFace: "Aptos Display",
          fontSize: 30,
          bold: true,
          color: "172235",
          margin: 0,
        });
        slide.addText(body, {
          x: 0.85,
          y: 1.8,
          w: w - 0.3,
          h: aspect === "16:9" ? 4.6 : 5.2,
          fontFace: "Aptos",
          fontSize: 18,
          color: "556274",
          breakLine: false,
          valign: "top",
          margin: 0.05,
          fit: "shrink",
        });
        slide.addText(`${index + 1} / ${slides.length}`, {
          x: aspect === "16:9" ? 11.3 : 9.3,
          y: aspect === "16:9" ? 7 : 7,
          w: 1.1,
          h: 0.25,
          fontSize: 9,
          color: "AAB3C0",
          align: "right",
          margin: 0,
        });
      });
      await pptx.writeFile({
        fileName: `${safeDocumentName(name, "presentation")}.pptx`,
      });
    } catch {
      setError(t("exportFailed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolPage slug="md2pptx">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ToolPanel
          title="Markdown slides"
          description="Separate slides with a line containing three dashes."
          actions={
            <OutputActions
              onReset={() => {
                setMarkdown(initialMarkdown);
                setName("presentation");
                setError("");
                setAspect("16:9");
              }}
              onClear={() => setMarkdown("")}
            />
          }
        >
          <ToolTextArea
            value={markdown}
            onChange={setMarkdown}
            ariaLabel="Markdown slides input"
            rows={18}
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Aspect ratio">
              <Select
                value={aspect}
                onValueChange={(v: string) => setAspect(v as "16:9" | "4:3")}
              >
                <SelectTrigger className="h-9 w-full font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                  <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Filename">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="presentation"
                className="h-9 font-mono"
              />
            </Field>
          </div>
          <FileDropZone
            accept=".md,.markdown,.txt,text/markdown"
            className="mt-3"
            label="Drop a .md file"
            description="or click to browse"
            onFiles={async (files) => {
              const file = files[0];
              if (!file) return;
              setMarkdown(await file.text());
              const base = file.name
                .replace(/\.[^.]+$/, "")
                .replace(/[^a-zA-Z0-9_-]/g, "-");
              if (base) setName(base);
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{t("slidesCount", { count: slides.length })}</span>
            {overflow.some(Boolean) && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                {overflow.filter(Boolean).length} slide(s) over {SLIDE_OVERFLOW_CHARS} chars
              </span>
            )}
            <Button onClick={() => void exportPptx()} busy={busy} disabled={!slides.length} className="ml-auto">
              {busy ? t("processing") : "Download .pptx"}
            </Button>
          </div>
          {error && <ToolNotice variant="error" className="mt-3">{error}</ToolNotice>}
        </ToolPanel>
        <ToolPanel title={`Slide previews (${slides.length})`}>
          {slides.length ? (
            <ol className="grid gap-3">
              {slides.map((slide, index) => {
                const lines = slide.split("\n").filter((line) => line.trim());
                const titleLine = lines.find((line) => /^#{1,3}\s/.test(line));
                const title = titleLine
                  ? plainSlideText(titleLine.replace(/^#{1,3}\s+/, ""))
                  : `Slide ${index + 1}`;
                const body = lines
                  .filter((line) => line !== titleLine)
                  .map((line) => plainSlideText(line))
                  .join(" • ");
                return (
                  <li
                    key={index}
                    className={cn(
                      "rounded-md border border-border bg-card p-3 text-xs",
                      overflow[index] &&
                        "border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase text-muted-foreground">
                      <span>Slide {index + 1}</span>
                      <span>{slide.length} chars</span>
                    </div>
                    <p className="mt-1 font-display text-sm font-semibold text-foreground">
                      {title}
                    </p>
                    {body && (
                      <p className="mt-1 line-clamp-3 text-muted-foreground">
                        {body}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <ToolNotice>{t("emptyMarkdown")}</ToolNotice>
          )}
        </ToolPanel>
      </div>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        {t("pptxTip")}
      </p>
    </ToolPage>
  );
}

export function MergePdfTool() {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [pageCounts, setPageCounts] = useState<Map<File, number>>(
    () => new Map(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("merged.pdf");

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  function appendFiles(next: File[]): void {
    if (!next.length) return;
    setDownloadUrl(null);
    setFiles((current) => {
      const seen = new Set(current.map((file) => `${file.name}-${file.size}`));
      const merged = current.slice();
      for (const file of next) {
        const key = `${file.name}-${file.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(file);
        }
      }
      return merged;
    });
    void Promise.all(
      next.map(async (file) => {
        try {
          const { PDFDocument } = await import("pdf-lib");
          const doc = await PDFDocument.load(await file.arrayBuffer(), {
            ignoreEncryption: true,
          });
          setPageCounts((counts) => {
            const next = new Map(counts);
            next.set(file, doc.getPageCount());
            return next;
          });
        } catch {
          setPageCounts((counts) => {
            const next = new Map(counts);
            next.set(file, 0);
            return next;
          });
        }
      }),
    );
  }

  function move(index: number, delta: number): void {
    setFiles((current) => {
      const next = current.slice();
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(index: number): void {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  async function merge(): Promise<void> {
    if (files.length < 2) {
      setError("Add at least two PDF files to merge.");
      return;
    }
    setBusy(true);
    setError("");
    setDownloadUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const output = await PDFDocument.create();
      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer(), {
          ignoreEncryption: true,
        });
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }
      const blob = pdfBlob(await output.save());
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName("merged.pdf");
    } catch {
      setError(t("pdfLoadFailed"));
    } finally {
      setBusy(false);
    }
  }

  const totalPages = files.reduce(
    (sum, file) => sum + (pageCounts.get(file) ?? 0),
    0,
  );

  return (
    <ToolPage slug="merge-pdf">
      <ToolPanel
        title="PDF files"
        description="Files stay in your browser and are never uploaded."
        actions={
          <OutputActions
            onReset={() => {
              setFiles([]);
              setPageCounts(new Map());
              setError("");
              setDownloadUrl(null);
            }}
            onClear={() => {
              setFiles([]);
              setPageCounts(new Map());
              setDownloadUrl(null);
            }}
          />
        }
      >
        <FilePicker
          multiple
          onFiles={(next) => {
            appendFiles(next);
            setError("");
          }}
        />
        {files.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {t("filesSelected", { count: files.length })} ·{" "}
              {totalPages} page{totalPages === 1 ? "" : "s"}
            </span>
          </div>
        )}
        <div className={toolStyles.fileList}>
          {files.map((file, index) => (
            <div
              className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2 text-sm text-foreground"
              key={`${file.name}-${index}`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 font-mono text-xs text-primary">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)} ·{" "}
                  {pageCounts.get(file)
                    ? `${pageCounts.get(file)} page${pageCounts.get(file) === 1 ? "" : "s"}`
                    : "Reading…"}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move up"
                onClick={() => move(index, -1)}
                disabled={index === 0}
              >
                ↑
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Move down"
                onClick={() => move(index, 1)}
                disabled={index === files.length - 1}
              >
                ↓
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Remove"
                onClick={() => remove(index)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={() => void merge()} disabled={files.length < 2} busy={busy}>
            {busy
              ? t("processing")
              : files.length < 2
                ? "Add at least two files"
                : t("mergePdfs", { count: files.length })}
          </Button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadName}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
            >
              Download merged.pdf
            </a>
          )}
        </div>
        {error && (
          <div className="mt-3">
            <ToolNotice variant="error">{error}</ToolNotice>
          </div>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

function parseRanges(value: string, total: number): {
  pages: number[];
  error?: string;
} {
  const pages = new Set<number>();
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return { pages: [] };
  for (const part of parts) {
    if (!/^\d+(?:\s*-\s*\d+)?$/.test(part)) {
      return { pages: [], error: `Invalid range: "${part}"` };
    }
    const [startRaw, endRaw] = part.split("-").map((item) => Number(item.trim()));
    const start = startRaw;
    const end = endRaw ?? startRaw;
    if (start < 1 || end < 1 || start > total || end > total) {
      return {
        pages: [],
        error: `Range ${start}-${end} is outside 1–${total}`,
      };
    }
    for (
      let page = Math.min(start, end);
      page <= Math.max(start, end);
      page += 1
    ) {
      pages.add(page);
    }
  }
  return { pages: Array.from(pages).sort((a, b) => a - b) };
}

type SplitPreset = "custom" | "all" | "odd" | "even" | "first" | "last";

interface PdfPagePreview {
  pageNumber: number;
  src: string | null;
}

type PreviewState = "idle" | "loading" | "ready" | "error";

function pageRangeFromPages(pages: number[]): string {
  const sorted = Array.from(new Set(pages)).sort((a, b) => a - b);
  if (!sorted.length) return "";
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (const page of sorted.slice(1)) {
    if (page === end + 1) {
      end = page;
      continue;
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    start = page;
    end = page;
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(", ");
}

async function renderPdfPagePreviews(
  bytes: Uint8Array,
  onProgress: (pageNumber: number) => void,
): Promise<PdfPagePreview[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const previews: PdfPagePreview[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      try {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1, 220 / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is unavailable");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        previews.push({
          pageNumber,
          src: canvas.toDataURL("image/jpeg", 0.82),
        });
      } catch {
        previews.push({ pageNumber, src: null });
      }
      onProgress(pageNumber);
    }
  } finally {
    await pdf.cleanup();
  }
  return previews;
}

function PdfPageGrid({
  previews,
  selectedPages,
  onToggle,
}: {
  previews: PdfPagePreview[];
  selectedPages: Set<number>;
  onToggle: (pageNumber: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {previews.map((preview) => {
        const selected = selectedPages.has(preview.pageNumber);
        const checkboxId = `split-pdf-page-${preview.pageNumber}`;
        return (
          <div
            className={cn(
              "min-w-0 overflow-hidden rounded-lg border bg-card transition",
              selected
                ? "border-primary ring-2 ring-primary/20"
                : "border-border",
            )}
            key={preview.pageNumber}
          >
            <button
              type="button"
              className="relative flex min-h-[180px] w-full items-center justify-center bg-muted/30 p-2 text-left transition hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              onClick={() => onToggle(preview.pageNumber)}
              aria-pressed={selected}
              aria-label={t("pagePreview", { page: preview.pageNumber })}
            >
              {preview.src ? (
                <img
                  src={preview.src}
                  alt={t("pagePreview", { page: preview.pageNumber })}
                  className="max-h-64 w-full object-contain shadow-sm"
                />
              ) : (
                <span className="px-3 text-center text-xs text-muted-foreground">
                  {t("pagePreviewUnavailable")}
                </span>
              )}
              {selected && (
                <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                  ✓
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 border-t border-border px-3 py-2">
              <Checkbox
                id={checkboxId}
                checked={selected}
                onCheckedChange={() => onToggle(preview.pageNumber)}
                aria-label={t("pagePreview", { page: preview.pageNumber })}
              />
              <label
                htmlFor={checkboxId}
                className="min-w-0 cursor-pointer truncate text-xs font-medium text-foreground"
              >
                {t("pageLabel", { page: preview.pageNumber })}
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SplitPdfTool() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [ranges, setRanges] = useState("1");
  const [preset, setPreset] = useState<SplitPreset>("custom");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pagePreviews, setPagePreviews] = useState<PdfPagePreview[]>([]);
  const [previewState, setPreviewState] = useState<PreviewState>("idle");
  const [previewProgress, setPreviewProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [splitEach, setSplitEach] = useState(false);
  const loadId = useRef(0);
  const selectedPageSet = useMemo(() => new Set(selectedPages), [selectedPages]);

  async function loadFile(next: File | null): Promise<void> {
    const requestId = ++loadId.current;
    setFile(next);
    setError("");
    setTotalPages(0);
    setSelectedPages([]);
    setPagePreviews([]);
    setPreviewState("idle");
    setPreviewProgress(0);
    if (!next) return;
    try {
      const bytes = new Uint8Array(await next.arrayBuffer());
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
      });
      const pageCount = doc.getPageCount();
      if (requestId !== loadId.current) return;
      const allPages = Array.from({ length: pageCount }, (_, index) => index + 1);
      setTotalPages(pageCount);
      setSelectedPages(allPages);
      setRanges(pageRangeFromPages(allPages));
      setPreset("all");
      setPreviewState("loading");
      setPreviewProgress(0);
      const previews = await renderPdfPagePreviews(bytes, setPreviewProgress);
      if (requestId !== loadId.current) return;
      setPagePreviews(previews);
      setPreviewState("ready");
    } catch {
      if (requestId !== loadId.current) return;
      setPreviewState("error");
      setError(t("pdfLoadFailed"));
    }
  }

  function updateSelection(pages: number[], nextPreset: SplitPreset = "custom"): void {
    const normalized = Array.from(new Set(pages))
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
    setSelectedPages(normalized);
    setRanges(pageRangeFromPages(normalized));
    setPreset(nextPreset);
  }

  function applyPreset(value: SplitPreset): void {
    if (!totalPages) return;
    if (value === "all") {
      updateSelection(
        Array.from({ length: totalPages }, (_, index) => index + 1),
        value,
      );
    } else if (value === "odd") {
      updateSelection(
        Array.from({ length: totalPages }, (_, index) => index + 1).filter(
          (page) => page % 2 === 1,
        ),
        value,
      );
    } else if (value === "even") {
      updateSelection(
        Array.from({ length: totalPages }, (_, index) => index + 1).filter(
          (page) => page % 2 === 0,
        ),
        value,
      );
    } else if (value === "first") {
      updateSelection([1], value);
    } else if (value === "last") {
      updateSelection([totalPages], value);
    }
  }

  function togglePage(pageNumber: number): void {
    updateSelection(
      selectedPageSet.has(pageNumber)
        ? selectedPages.filter((page) => page !== pageNumber)
        : [...selectedPages, pageNumber],
    );
  }

  const rangeResult = useMemo(
    () => parseRanges(ranges, totalPages),
    [ranges, totalPages],
  );

  async function split(): Promise<void> {
    if (!file) return;
    if (rangeResult.error || !selectedPages.length) {
      setError(rangeResult.error || t("invalidRange"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      if (splitEach) {
        for (const page of selectedPages) {
          const output = await PDFDocument.create();
          const [copied] = await output.copyPages(source, [page - 1]);
          output.addPage(copied);
          downloadBlob(
            `${outputStem(file.name, "document")}-p${String(page).padStart(3, "0")}.pdf`,
            pdfBlob(await output.save()),
          );
        }
      } else {
        const output = await PDFDocument.create();
        const copied = await output.copyPages(
          source,
          selectedPages.map((page) => page - 1),
        );
        copied.forEach((page) => output.addPage(page));
        downloadBlob(
          `${outputStem(file.name, "document")}-split.pdf`,
          pdfBlob(await output.save()),
        );
      }
    } catch {
      setError(t("pdfLoadFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolPage slug="split-pdf">
      <ToolPanel
        title="Choose a PDF"
        description="Use page numbers like 1, 3-5, 8. Pages are kept in numeric order."
        actions={
          <OutputActions
            onReset={() => {
              void loadFile(null);
              setRanges("1");
              setPreset("custom");
              setSplitEach(false);
            }}
            onClear={() => void loadFile(null)}
          />
        }
      >
        <FilePicker
          onFiles={(next) => {
            void loadFile(next[0] || null);
          }}
        />
        {file ? (
          <p className={toolStyles.selectedFile}>
            {file.name} ·{" "}
            {totalPages
              ? `${totalPages} page${totalPages === 1 ? "" : "s"}`
              : "Reading…"}
          </p>
        ) : (
          <p className={toolStyles.selectedFile}>
            <ToolLabel>No file selected</ToolLabel>
          </p>
        )}
        {totalPages > 0 && (
          <section className="mt-6 overflow-hidden rounded-lg border border-border bg-muted/20" aria-label={t("selectPages")}>
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  {t("selectPages")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("selectedPagesCount", {
                    selected: selectedPages.length,
                    total: totalPages,
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => applyPreset("all")}>
                  {t("selectAllPages")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateSelection([])}>
                  {t("clearPageSelection")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateSelection(
                      Array.from({ length: totalPages }, (_, index) => index + 1).filter(
                        (page) => !selectedPageSet.has(page),
                      ),
                    )
                  }
                >
                  {t("invertPageSelection")}
                </Button>
              </div>
            </div>
            {previewState === "loading" && (
              <div className="border-b border-border px-4 py-3 text-xs text-muted-foreground" role="status">
                {t("renderingPagePreviews", {
                  current: previewProgress,
                  total: totalPages,
                })}
              </div>
            )}
            {previewState === "error" && (
              <div className="p-4">
                <ToolNotice variant="error">{t("pagePreviewUnavailable")}</ToolNotice>
              </div>
            )}
            {pagePreviews.length > 0 && (
              <PdfPageGrid
                previews={pagePreviews}
                selectedPages={selectedPageSet}
                onToggle={togglePage}
              />
            )}
          </section>
        )}
        {totalPages > 0 && (
          <details className="mt-4 rounded-md border border-border bg-muted/20 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              {t("advancedPageRange")}
            </summary>
            <div className="mt-4">
              <label className={toolStyles.label}>
                {t("pageRange")}
                <Input
                  value={ranges}
                  onChange={(event) => {
                    const value = event.target.value;
                    setRanges(value);
                    setPreset("custom");
                    const result = parseRanges(value, totalPages);
                    if (!result.error) setSelectedPages(result.pages);
                  }}
                  placeholder={t("pageRangePlaceholder")}
                  className="h-9 font-mono"
                />
              </label>
              {rangeResult.error && (
                <p className="text-xs text-destructive">{rangeResult.error}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant={preset === "odd" ? "default" : "outline"} onClick={() => applyPreset("odd")}>
                  {t("oddPages")}
                </Button>
                <Button size="sm" variant={preset === "even" ? "default" : "outline"} onClick={() => applyPreset("even")}>
                  {t("evenPages")}
                </Button>
                <Button size="sm" variant={preset === "first" ? "default" : "outline"} onClick={() => applyPreset("first")}>
                  {t("firstPage")}
                </Button>
                <Button size="sm" variant={preset === "last" ? "default" : "outline"} onClick={() => applyPreset("last")}>
                  {t("lastPage")}
                </Button>
              </div>
            </div>
          </details>
        )}
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={splitEach}
            onCheckedChange={(value) => setSplitEach(Boolean(value))}
          />
          {t("saveEachSelectedPage")}
        </label>
        <div className="mt-3">
          <Button
            onClick={() => void split()}
            busy={busy}
            disabled={!file || !selectedPages.length || previewState === "loading"}
          >
            {busy ? t("processing") : t("splitSelectedPages", { count: selectedPages.length })}
          </Button>
        </div>
        {error && (
          <div className="mt-3">
            <ToolNotice variant="error">{error}</ToolNotice>
          </div>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

export function CompressPdfTool() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stripMetadata, setStripMetadata] = useState(true);
  const [sizeResult, setSizeResult] = useState<{
    before: number;
    after: number;
    blob: Blob;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  async function compress(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError("");
    setSizeResult(null);
    setDownloadUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await file.arrayBuffer(), {
        ignoreEncryption: true,
      });
      if (stripMetadata) {
        source.setTitle("");
        source.setAuthor("");
        source.setSubject("");
        source.setKeywords([]);
        source.setProducer("");
        source.setCreator("");
      }
      const bytes = await source.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      const result = {
        before: file.size,
        after: bytes.byteLength,
        blob: pdfBlob(bytes),
      };
      setSizeResult(result);
      setDownloadUrl(URL.createObjectURL(result.blob));
    } catch {
      setError(t("pdfLoadFailed"));
    } finally {
      setBusy(false);
    }
  }

  const savings =
    sizeResult && sizeResult.before
      ? Math.round(((sizeResult.before - sizeResult.after) / sizeResult.before) * 1000) / 10
      : null;

  return (
    <ToolPage slug="compress-pdf">
      <ToolPanel
        title="Compress a PDF"
        description="This browser-side pass removes redundant PDF structure. Image-heavy PDFs may need a dedicated image optimizer for bigger savings."
        actions={
          <OutputActions
            onReset={() => {
              setFile(null);
              setSizeResult(null);
              setDownloadUrl(null);
              setError("");
            }}
            onClear={() => {
              setFile(null);
              setSizeResult(null);
              setDownloadUrl(null);
            }}
          />
        }
      >
        <FilePicker
          onFiles={(next) => {
            setFile(next[0] || null);
            setSizeResult(null);
            setError("");
          }}
        />
        {file ? (
          <p className={toolStyles.selectedFile}>
            {file.name} · {formatBytes(file.size)}
          </p>
        ) : (
          <p className={toolStyles.selectedFile}>
            <ToolLabel>No file selected</ToolLabel>
          </p>
        )}
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={stripMetadata}
            onCheckedChange={(value) => setStripMetadata(Boolean(value))}
          />
          Strip document metadata (title, author, producer…)
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={() => void compress()} busy={busy} disabled={!file}>
            {busy ? t("processing") : t("optimizePdf")}
          </Button>
          {sizeResult && downloadUrl && (
            <a
              href={downloadUrl}
              download={`${outputStem(file?.name ?? "document", "document")}-optimized.pdf`}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
            >
              Download optimized PDF
            </a>
          )}
        </div>
        {sizeResult && (
          <div className="mt-3">
            <ToolNotice
              variant={
                sizeResult.after < sizeResult.before ? "success" : "info"
              }
            >
              {t("pdfSizeResult", {
                before: formatBytes(sizeResult.before),
                after: formatBytes(sizeResult.after),
              })}
              {savings !== null && (
                <span className="ml-2 font-mono">
                  ({savings > 0 ? "−" : "+"}
                  {Math.abs(savings).toFixed(1)}%)
                </span>
              )}
            </ToolNotice>
          </div>
        )}
        {error && (
          <div className="mt-3">
            <ToolNotice variant="error">{error}</ToolNotice>
          </div>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const { language } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {literal(label, language)}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{literal(hint, language)}</p>}
    </div>
  );
}

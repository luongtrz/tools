import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n";
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
import { toolStyles } from "@/components/toolStyles";
import { downloadBlob } from "@/lib/download";
import {
  renderPdfPagePreviews,
  renderPdfPages,
  type PdfPagePreview,
} from "@/lib/pdfRender";
import { pdfPagesToDocxBlob } from "@/lib/pdfToDocx";
import {
  convertPdfToEditableDocx,
  hasSemanticPdfToWordEndpoint,
} from "@/lib/pdfToWordService";

type PdfDocxImageFormat = "png" | "jpeg";
type PdfToWordMode = "semantic" | "visual";

const semanticConversionAvailable = hasSemanticPdfToWordEndpoint();

function outputStem(fileName: string): string {
  return (
    fileName
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-") || "document"
  );
}

function PreviewCard({
  preview,
  pageLabel,
  unavailableLabel,
}: {
  preview: PdfPagePreview;
  pageLabel: string;
  unavailableLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex min-h-40 items-center justify-center bg-muted/30 p-2">
        {preview.src ? (
          <img
            src={preview.src}
            alt={pageLabel}
            className="max-h-56 w-full object-contain shadow-sm"
          />
        ) : (
          <span className="px-3 text-center text-xs text-muted-foreground">
            {unavailableLabel}
          </span>
        )}
      </div>
      <p className="border-t border-border px-3 py-2 text-xs font-medium text-foreground">
        {pageLabel}
      </p>
    </div>
  );
}

export function PdfToWordTool() {
  const { t } = useI18n();
  const [file, setFile] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [previews, setPreviews] = useState<PdfPagePreview[]>([]);
  const [format, setFormat] = useState<PdfDocxImageFormat>("png");
  const [scale, setScale] = useState("2");
  const [mode, setMode] = useState<PdfToWordMode>(
    semanticConversionAvailable ? "semantic" : "visual",
  );
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const visiblePreviews = useMemo(() => previews.slice(0, 8), [previews]);

  async function loadPdf(next: DroppedFile | null): Promise<void> {
    const currentRequest = ++requestId.current;
    setFile(null);
    setFileName("");
    setPreviews([]);
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
      if (currentRequest !== requestId.current) return;
      setFile(blob);
      setFileName(next.name);
      setPreviews(rendered);
    } catch {
      if (currentRequest === requestId.current) {
        setError(t("pdfLoadFailed"));
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  async function exportDocx(): Promise<void> {
    if (!file || !previews.length) return;
    setBusy(true);
    setError("");
    setProgress({ current: 0, total: previews.length });
    try {
      if (mode === "semantic") {
        const docx = await convertPdfToEditableDocx(file, fileName);
        downloadBlob(`${outputStem(fileName)}.docx`, docx);
        setProgress({ current: 1, total: 1 });
        return;
      }

      const rendered = await renderPdfPages(
        new Uint8Array(await file.arrayBuffer()),
        {
          scale: Number(scale),
          format,
          quality: 0.96,
          onProgress: (_pageNumber, current, total) =>
            setProgress({ current, total }),
        },
      );
      const failedPages = rendered
        .filter((page) => !page.src)
        .map((page) => page.pageNumber);
      if (failedPages.length) {
        setError(t("pdfToWordRenderFailed", { pages: failedPages.join(", ") }));
        return;
      }
      const docx = await pdfPagesToDocxBlob(rendered, {
        renderScale: Number(scale),
        title: fileName,
      });
      downloadBlob(`${outputStem(fileName)}.docx`, docx);
    } catch (conversionError) {
      if (mode === "semantic" && conversionError instanceof Error) {
        setError(`${t("pdfToWordSemanticExportFailed")} ${conversionError.message}`);
      } else {
        setError(t("pdfToWordExportFailed"));
      }
    } finally {
      setBusy(false);
    }
  }

  function reset(): void {
    ++requestId.current;
    setFile(null);
    setFileName("");
    setPreviews([]);
    setProgress({ current: 0, total: 0 });
    setError("");
  }

  return (
    <ToolPage slug="pdf-to-word">
      <ToolPanel
        title={t("pdfToWordChoosePdf")}
        description={t("pdfToWordToolDescription")}
        actions={<OutputActions onReset={reset} onClear={reset} />}
      >
        <FileDropZone
          accept="application/pdf,.pdf"
          label={t("dropPdfToWord")}
          description={t("dropPdfToWordDescription")}
          onFiles={async (files) => loadPdf(files[0] || null)}
        />
        {fileName && (
          <p className={toolStyles.selectedFile}>
            {fileName} · {previews.length} {t("pages")}
          </p>
        )}
        {loading && (
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            {t("renderingPdfToWord", progress)}
          </p>
        )}
        {visiblePreviews.length > 0 && (
          <section className="mt-5 rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">
                  {t("pdfToWordPreview")}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {previews.length > visiblePreviews.length
                    ? t("pdfToWordPreviewCount", {
                        visible: visiblePreviews.length,
                        total: previews.length,
                      })
                    : t("selectedImagesCount", {
                        selected: previews.length,
                        total: previews.length,
                      })}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visiblePreviews.map((preview) => (
                <PreviewCard
                  key={preview.pageNumber}
                  preview={preview}
                  pageLabel={t("pageLabel", { page: preview.pageNumber })}
                  unavailableLabel={t("pagePreviewUnavailable")}
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

      {file && (
        <ToolPanel
          title={t("pdfToWordWordOutput")}
          description={
            mode === "semantic"
              ? t("pdfToWordSemanticDescription")
              : t("pdfToWordVisualDescription")
          }
          actions={
            <Button
              onClick={() => void exportDocx()}
              busy={busy}
              disabled={loading || !previews.length}
            >
              {busy
                ? mode === "semantic"
                  ? t("creatingEditableDocx")
                  : t("creatingDocx")
                : mode === "semantic"
                  ? t("pdfToWordEditableDownload")
                  : t("pdfToWordDownload")}
            </Button>
          }
        >
          {semanticConversionAvailable ? (
            <>
              <ToolNotice variant={mode === "semantic" ? "success" : "warning"}>
                <p>
                  {mode === "semantic"
                    ? t("pdfToWordSemanticNotice")
                    : t("pdfToWordFidelityNotice")}
                </p>
                <p className="mt-2">
                  {mode === "semantic"
                    ? t("pdfToWordChemistryNotice")
                    : t("pdfToWordEditabilityNotice")}
                </p>
              </ToolNotice>
              <label className={`${toolStyles.label} mt-4 block max-w-sm`}>
                {t("pdfToWordMode")}
                <select
                  className={toolStyles.select}
                  value={mode}
                  onChange={(event) =>
                    setMode(event.target.value as PdfToWordMode)
                  }
                >
                  <option value="semantic">{t("pdfToWordSemanticMode")}</option>
                  <option value="visual">{t("pdfToWordVisualMode")}</option>
                </select>
              </label>
            </>
          ) : (
            <ToolNotice variant="warning">
              <p>{t("pdfToWordServiceUnavailable")}</p>
              <p className="mt-2">{t("pdfToWordFidelityNotice")}</p>
              <p className="mt-2">{t("pdfToWordEditabilityNotice")}</p>
            </ToolNotice>
          )}
          {mode === "visual" && (
            <div className={`${toolStyles.inlineFields} mt-4`}>
              <label className={toolStyles.label}>
                {t("pdfToWordFormat")}
                <select
                  className={toolStyles.select}
                  value={format}
                  onChange={(event) =>
                    setFormat(event.target.value as PdfDocxImageFormat)
                  }
                >
                  <option value="png">{t("pdfToWordPng")}</option>
                  <option value="jpeg">{t("pdfToWordJpeg")}</option>
                </select>
              </label>
              <label className={toolStyles.label}>
                {t("pdfToWordResolution")}
                <select
                  className={toolStyles.select}
                  value={scale}
                  onChange={(event) => setScale(event.target.value)}
                >
                  <option value="1">100% · 72 DPI</option>
                  <option value="1.5">150% · 108 DPI</option>
                  <option value="2">200% · 144 DPI</option>
                  <option value="3">300% · 216 DPI</option>
                </select>
              </label>
            </div>
          )}
          {busy && (
            <p className="mt-3 text-xs text-muted-foreground" role="status">
              {mode === "semantic"
                ? t("creatingEditableDocx")
                : t("renderingPdfToWord", progress)}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {mode === "semantic"
              ? t("pdfToWordSemanticHint")
              : t("pdfToWordHint")}
          </p>
        </ToolPanel>
      )}
    </ToolPage>
  );
}

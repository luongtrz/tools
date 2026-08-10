import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export interface PdfPagePreview {
  pageNumber: number;
  src: string | null;
  width: number;
  height: number;
}

export type PdfRenderProgress = (
  pageNumber: number,
  completed: number,
  total: number,
) => void;

export interface PdfRenderOptions {
  maxWidth?: number;
  scale?: number;
  format?: "png" | "jpeg";
  quality?: number;
  pageNumbers?: number[];
  onProgress?: PdfRenderProgress;
}

export async function renderPdfPages(
  bytes: Uint8Array,
  options: PdfRenderOptions = {},
): Promise<PdfPagePreview[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const pageNumbers = options.pageNumbers?.length
    ? Array.from(new Set(options.pageNumbers)).sort((a, b) => a - b)
    : Array.from({ length: pdf.numPages }, (_, index) => index + 1);
  const previews: PdfPagePreview[] = [];
  try {
    for (const pageNumber of pageNumbers) {
      let preview: PdfPagePreview = {
        pageNumber,
        src: null,
        width: 0,
        height: 0,
      };
      try {
        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale =
          options.scale ??
          Math.min(1, (options.maxWidth ?? 220) / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Canvas is unavailable");
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const format = options.format ?? "jpeg";
        preview = {
          pageNumber,
          src:
            format === "png"
              ? canvas.toDataURL("image/png")
              : canvas.toDataURL("image/jpeg", options.quality ?? 0.82),
          width: canvas.width,
          height: canvas.height,
        };
      } catch {
        // Keep the page in the result so the UI can explain that its preview failed.
      }
      previews.push(preview);
      options.onProgress?.(pageNumber, previews.length, pageNumbers.length);
    }
  } finally {
    await pdf.cleanup();
  }
  return previews;
}

export function renderPdfPagePreviews(
  bytes: Uint8Array,
  onProgress?: PdfRenderProgress,
): Promise<PdfPagePreview[]> {
  return renderPdfPages(bytes, {
    maxWidth: 220,
    format: "jpeg",
    quality: 0.82,
    onProgress,
  });
}

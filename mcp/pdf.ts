import { escapeHtml, renderMarkdown } from "../src/lib/markdown";

export type PdfFormat = "a4" | "a5" | "letter" | "legal";
export const MAX_MARKDOWN_BYTES = 45_000_000;

const MAX_BROWSER_HTML_BYTES = 49_000_000;

export interface PdfRenderInput {
  markdown: string;
  filename?: string;
  format?: PdfFormat;
  landscape?: boolean;
  margins?: "10" | "18" | "25";
}

export interface PdfRenderOutput {
  filename: string;
  mimeType: "application/pdf";
  bytes: number;
  base64: string;
}

export interface PdfRenderBinaryOutput {
  filename: string;
  mimeType: "application/pdf";
  bytes: number;
  data: Uint8Array;
}

export function markdownDocumentHtml(
  markdown: string,
  title: string,
  margins = "18",
): string {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      @page { margin: ${margins}mm; }
      :root { color-scheme: light; font-family: Arial, "Noto Sans", sans-serif; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { color: #263449; font-size: 11pt; line-height: 1.7; overflow-wrap: anywhere; }
      h1, h2, h3, h4, h5, h6 { color: #101b2d; line-height: 1.2; margin: 1.35em 0 0.55em; page-break-after: avoid; }
      h1 { border-bottom: 2px solid #f2633d; font-size: 25pt; letter-spacing: -0.02em; padding-bottom: 0.3em; }
      h2 { border-bottom: 1px solid #dbe3ed; font-size: 18pt; padding-bottom: 0.2em; }
      h3 { color: #334155; font-size: 14pt; }
      h4 { font-size: 12pt; }
      h5, h6 { font-size: 11pt; }
      p, ul, ol, blockquote, pre, table { margin: 0 0 1em; }
      ul, ol { padding-left: 1.6em; }
      li + li { margin-top: 0.25em; }
      blockquote { background: #f8fafc; border-left: 3px solid #f2633d; color: #475569; padding: 0.7em 1em; }
      hr { border: 0; border-top: 1px solid #cbd5e1; margin: 1.6em 0; }
      code { background: #fff1ed; border-radius: 4px; color: #b34835; font-family: "SFMono-Regular", Consolas, monospace; font-size: 0.88em; padding: 0.12em 0.35em; }
      pre { background: #172235; border: 1px solid #0f172a; border-radius: 7px; color: #f8fafc; padding: 1em 1.1em; white-space: pre-wrap; }
      pre code { background: transparent; color: inherit; padding: 0; }
      table { border-collapse: collapse; font-size: 10.5pt; width: 100%; }
      thead { display: table-header-group; }
      tr { break-inside: avoid; page-break-inside: avoid; }
      th, td { border: 1px solid #cbd5e1; padding: 0.5em 0.65em; text-align: left; vertical-align: top; }
      th { background: #f1f5f9; color: #172235; font-weight: 700; }
      a { color: #b34835; }
      img { display: block; margin: 0.8em 0; max-height: 8in; max-width: 100%; }
      .contains-task-list { list-style: none; padding-left: 0; }
      .task-list-item { list-style: none; }
      .task-list-item-checkbox { margin: 0 0.45em 0 0; vertical-align: -0.08em; }
      .empty-state { color: #64748b; font-style: italic; }
    </style>
  </head>
  <body>${renderMarkdown(markdown)}</body>
</html>`;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function normalizePdfFilename(filename: string | undefined): string {
  const cleaned = (filename || "toolmd-document")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "toolmd-document";
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

async function renderPdfBytes(
  browser: BrowserRun,
  input: PdfRenderInput,
): Promise<PdfRenderBinaryOutput> {
  const markdownBytes = new TextEncoder().encode(input.markdown).byteLength;
  if (markdownBytes > MAX_MARKDOWN_BYTES) {
    throw new Error("Markdown source must be 45 MB or smaller.");
  }

  const filename = normalizePdfFilename(input.filename);
  const margins = input.margins || "18";
  const html = markdownDocumentHtml(input.markdown, filename.replace(/\.pdf$/i, ""), margins);
  if (new TextEncoder().encode(html).byteLength > MAX_BROWSER_HTML_BYTES) {
    throw new Error("The rendered HTML is too large for the PDF service. Reduce the Markdown size.");
  }
  const response = await browser.quickAction("pdf", {
    html,
    emulateMediaType: "print",
    setJavaScriptEnabled: false,
    rejectResourceTypes: ["image", "media", "font", "script", "xhr", "fetch", "websocket"],
    pdfOptions: {
      format: input.format || "a4",
      landscape: input.landscape || false,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: `${margins}mm`, right: `${margins}mm`, bottom: `${margins}mm`, left: `${margins}mm` },
    },
  });

  if (!response.ok) {
    let message = `Cloudflare Browser Run returned HTTP ${response.status}.`;
    try {
      const body = await response.json() as { errors?: Array<{ message?: string }> };
      message = body.errors?.[0]?.message || message;
    } catch {
      // Keep the HTTP status when the service does not return JSON.
    }
    throw new Error(message);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  return {
    filename,
    mimeType: "application/pdf",
    bytes: bytes.byteLength,
    data: bytes,
  };
}

export async function renderMarkdownToPdf(
  browser: BrowserRun,
  input: PdfRenderInput,
): Promise<PdfRenderOutput> {
  const rendered = await renderPdfBytes(browser, input);
  return {
    filename: rendered.filename,
    mimeType: rendered.mimeType,
    bytes: rendered.bytes,
    base64: toBase64(rendered.data),
  };
}

export async function renderMarkdownToPdfBinary(
  browser: BrowserRun,
  input: PdfRenderInput,
): Promise<PdfRenderBinaryOutput> {
  return renderPdfBytes(browser, input);
}

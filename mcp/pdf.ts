import { escapeHtml, renderMarkdown } from "../src/lib/markdown";

export type PdfFormat = "a4" | "letter" | "legal";
export const MAX_MARKDOWN_BYTES = 30_000_000;

const MAX_BROWSER_HTML_BYTES = 45_000_000;

export interface PdfRenderInput {
  markdown: string;
  filename?: string;
  format?: PdfFormat;
  landscape?: boolean;
}

export interface PdfRenderOutput {
  filename: string;
  mimeType: "application/pdf";
  bytes: number;
  base64: string;
}

export function markdownDocumentHtml(markdown: string, title: string): string {
  return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      @page { margin: 18mm; }
      :root { color-scheme: light; font-family: Arial, "Noto Sans", sans-serif; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { color: #1e293b; font-size: 11pt; line-height: 1.65; overflow-wrap: anywhere; }
      h1, h2, h3 { color: #0f172a; line-height: 1.2; margin: 1.35em 0 0.55em; page-break-after: avoid; }
      h1 { border-bottom: 1px solid #cbd5e1; font-size: 24pt; padding-bottom: 0.25em; }
      h2 { border-bottom: 1px solid #e2e8f0; font-size: 17pt; padding-bottom: 0.18em; }
      h3 { font-size: 13pt; }
      p, ul, ol, blockquote, pre { margin: 0 0 0.9em; }
      ul, ol { padding-left: 1.6em; }
      li + li { margin-top: 0.2em; }
      blockquote { border-left: 3px solid #94a3b8; color: #475569; padding-left: 1em; }
      hr { border: 0; border-top: 1px solid #cbd5e1; margin: 1.5em 0; }
      code { background: #f1f5f9; border-radius: 3px; font-family: "SFMono-Regular", Consolas, monospace; font-size: 0.9em; padding: 0.12em 0.3em; }
      pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 0.9em 1em; white-space: pre-wrap; }
      pre code { background: transparent; padding: 0; }
      a { color: #0369a1; }
      img { display: block; max-width: 100%; }
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

function normalizeFilename(filename: string | undefined): string {
  const cleaned = (filename || "toolmd-document")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "toolmd-document";
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

export async function renderMarkdownToPdf(
  browser: BrowserRun,
  input: PdfRenderInput,
): Promise<PdfRenderOutput> {
  const filename = normalizeFilename(input.filename);
  const html = markdownDocumentHtml(input.markdown, filename.replace(/\.pdf$/i, ""));
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
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
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
    base64: toBase64(bytes),
  };
}

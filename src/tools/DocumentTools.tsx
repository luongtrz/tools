import { useMemo, useState } from "react";
import { literal, useI18n } from "../i18n";
import { SAMPLE_MARKDOWN } from "../constants/sampleMarkdown";
import { renderMarkdown } from "../lib/markdown";
import { markdownToDocxBlob } from "../lib/docx";
import { downloadBlob, downloadFile } from "../lib/download";
import {
  ToolButton,
  ToolLabel,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

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
  const safeName = () => safeDocumentName(name, "document");
  function exportWord(): void {
    try {
      setError("");
      const html = wordDocumentHtml(markdown, safeName());
      downloadFile(`${safeName()}.doc`, html, "application/msword;charset=utf-8");
    } catch {
      setError(t("exportFailed"));
    }
  }
  async function exportDocx(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      downloadBlob(`${safeName()}.docx`, await markdownToDocxBlob(markdown, safeName()));
    } catch {
      setError(t("exportFailed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolPage slug="md2word">
      <div className={toolStyles.splitLayout}>
        <ToolPanel
          title="Markdown input"
          description="Paste or write the content you want to export."
          actions={<ToolButton variant="quiet" onClick={() => { setMarkdown(SAMPLE_MARKDOWN); setError(""); }}>{t("reset")}</ToolButton>}
        >
          <ToolTextArea
            value={markdown}
            onChange={setMarkdown}
            ariaLabel="Markdown input"
          />
        </ToolPanel>
        <ToolPanel
          title="Word preview"
          description="Export a legacy .doc file or a standard .docx document."
          actions={
            <div className="flex flex-wrap gap-2">
              <ToolButton variant="quiet" onClick={exportWord}>Download .doc</ToolButton>
              <ToolButton onClick={() => void exportDocx()} busy={busy}>
                {busy ? t("processing") : "Download .docx"}
              </ToolButton>
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
      <ToolPanel title="File name" actions={<ToolButton variant="quiet" onClick={() => setName("document")}>{t("reset")}</ToolButton>}>
        <input
          className={toolStyles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="document"
        />
        {error && <ToolNotice variant="error">{error}</ToolNotice>}
      </ToolPanel>
    </ToolPage>
  );
}

export function Md2PptxTool() {
  const { t } = useI18n();
  const [markdown, setMarkdown] = useState(
    `# Project brief\n\nA focused presentation from Markdown.\n\n---\n\n## Next steps\n\n- Choose a clear story\n- Keep each slide focused`,
  );
  const [name, setName] = useState("presentation");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const slides = useMemo(
    () => markdown.split(/\n\s*---+\s*\n/g).map((slide) => slide.trim()).filter(Boolean),
    [markdown],
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
      pptx.layout = "LAYOUT_WIDE";
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
        slide.addText(title, {
          x: 0.7,
          y: 0.7,
          w: 12,
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
          w: 11.4,
          h: 4.6,
          fontFace: "Aptos",
          fontSize: 18,
          color: "556274",
          breakLine: false,
          valign: "top",
          margin: 0.05,
          fit: "shrink",
        });
        slide.addText(`${index + 1} / ${slides.length}`, {
          x: 11.3,
          y: 7,
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
      <ToolPanel
        title="Markdown slides"
        description="Separate slides with a line containing three dashes."
      >
        <ToolTextArea
          value={markdown}
          onChange={setMarkdown}
          ariaLabel="Markdown slides input"
          rows={18}
        />
        <div className={toolStyles.panelActions}>
          <ToolButton variant="quiet" onClick={() => { setMarkdown("# Project brief\n\nA focused presentation from Markdown.\n\n---\n\n## Next steps\n\n- Choose a clear story\n- Keep each slide focused"); setName("presentation"); setError(""); }}>{t("reset")}</ToolButton>
          <input
            className={toolStyles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="presentation"
          />
          <ToolButton onClick={() => void exportPptx()} busy={busy}>
            {busy ? t("processing") : "Download .pptx"}
          </ToolButton>
        </div>
        <p className="mt-4 font-mono text-xs text-slate-500 dark:text-slate-400">
          {t("slidesCount", { count: slides.length })}
        </p>
        {error && <div className="mt-4"><ToolNotice variant="error">{error}</ToolNotice></div>}
      </ToolPanel>
      <div className={toolStyles.hint}>
        {t("pptxTip")}
      </div>
    </ToolPage>
  );
}

export function MergePdfTool() {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function merge(): Promise<void> {
    if (!files.length) return;
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const output = await PDFDocument.create();
      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer());
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }
      downloadBlob("merged.pdf", pdfBlob(await output.save()));
    } catch {
      setError(t("pdfLoadFailed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolPage slug="merge-pdf">
      <ToolPanel
        title="PDF files"
        description="Files stay in your browser and are never uploaded."
      >
        <FilePicker multiple onFiles={(nextFiles) => { setFiles(nextFiles); setError(""); }} />
        {files.length > 0 && (
          <div className="mb-4 flex items-center justify-between gap-3 font-mono text-xs text-slate-500 dark:text-slate-400">
            <span>{t("filesSelected", { count: files.length })}</span>
            <ToolButton variant="quiet" onClick={() => { setFiles([]); setError(""); }}>
              {t("clear")}
            </ToolButton>
          </div>
        )}
        <div className={toolStyles.fileList}>
          {files.map((file, index) => (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300" key={`${file.name}-${index}`}>
              <span className="font-mono text-[#f2633d]">{index + 1}</span>
              {file.name}
              <small className="ml-auto text-xs text-slate-400 dark:text-slate-500">{Math.round(file.size / 1024)} KB</small>
            </div>
          ))}
        </div>
        <ToolButton onClick={() => void merge()} busy={busy} disabled={!files.length}>
          {busy
            ? t("processing")
            : files.length === 1
              ? t("mergePdf", { count: files.length })
              : t("mergePdfs", { count: files.length })}
        </ToolButton>
        {error && <div className="mt-4"><ToolNotice variant="error">{error}</ToolNotice></div>}
      </ToolPanel>
    </ToolPage>
  );
}

function parseRanges(value: string, total: number): number[] {
  const pages = new Set<number>();
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (
    !parts.length ||
    parts.some((part) => !/^\d+(?:\s*-\s*\d+)?$/.test(part))
  )
    return [];
  let invalidRange = false;
  parts.forEach((part) => {
    const [startRaw, endRaw] = part
      .split("-")
      .map((item) => Number(item.trim()));
    const end = endRaw ?? startRaw;
    if (startRaw < 1 || end < 1 || startRaw > total || end > total) {
      invalidRange = true;
      return;
    }
    for (
      let page = Math.min(startRaw, end);
      page <= Math.max(startRaw, end);
      page += 1
    )
      pages.add(page);
  });
  return invalidRange ? [] : Array.from(pages).sort((a, b) => a - b);
}

export function SplitPdfTool() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function split(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pages = parseRanges(ranges, source.getPageCount());
      if (!pages.length) {
        setError(t("invalidRange"));
        return;
      }
      const output = await PDFDocument.create();
      const copied = await output.copyPages(
        source,
        pages.map((page) => page - 1),
      );
      copied.forEach((page) => output.addPage(page));
      downloadBlob(`${outputStem(file.name, "document")}-split.pdf`, pdfBlob(await output.save()));
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
        description="Use page numbers like 1, 3-5, 8."
        actions={<ToolButton variant="quiet" onClick={() => { setFile(null); setRanges("1"); setError(""); }}>{t("reset")}</ToolButton>}
      >
        <FilePicker onFiles={(files) => { setFile(files[0] || null); setError(""); }} />
        <p className={toolStyles.selectedFile}>
          {file ? file.name : <ToolLabel>No file selected</ToolLabel>}
        </p>
        <label className={toolStyles.label}>
          <ToolLabel>Pages</ToolLabel>
          <input
            className={toolStyles.input}
            value={ranges}
            onChange={(event) => setRanges(event.target.value)}
            placeholder="1, 3-5"
          />
        </label>
        <ToolButton onClick={() => void split()} busy={busy} disabled={!file}>
          {busy ? t("processing") : t("splitPdf")}
        </ToolButton>
        {error && <div className="mt-4"><ToolNotice variant="error">{error}</ToolNotice></div>}
      </ToolPanel>
    </ToolPage>
  );
}

export function CompressPdfTool() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sizeResult, setSizeResult] = useState<{ before: number; after: number } | null>(null);
  async function compress(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const source = await PDFDocument.load(await file.arrayBuffer());
      const bytes = await source.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      downloadBlob(`${outputStem(file.name, "document")}-optimized.pdf`, pdfBlob(bytes));
      setSizeResult({ before: file.size, after: bytes.byteLength });
    } catch {
      setError(t("pdfLoadFailed"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolPage slug="compress-pdf">
      <ToolPanel
        title="Compress a PDF"
        description="This browser-side pass removes some redundant PDF structure. Image-heavy PDFs may need a dedicated image optimizer for bigger savings."
        actions={<ToolButton variant="quiet" onClick={() => { setFile(null); setSizeResult(null); setError(""); }}>{t("clear")}</ToolButton>}
      >
        <FilePicker onFiles={(files) => { setFile(files[0] || null); setSizeResult(null); setError(""); }} />
        <p className={toolStyles.selectedFile}>
          {file
            ? `${file.name} · ${Math.round(file.size / 1024)} KB`
            : <ToolLabel>No file selected</ToolLabel>}
        </p>
        <ToolButton onClick={() => void compress()} busy={busy} disabled={!file}>
          {busy ? t("processing") : t("optimizePdf")}
        </ToolButton>
        {sizeResult && (
          <div className="mt-4">
            <ToolNotice variant={sizeResult.after < sizeResult.before ? "success" : "info"}>
              {t("pdfSizeResult", {
                before: formatBytes(sizeResult.before),
                after: formatBytes(sizeResult.after),
              })}
            </ToolNotice>
          </div>
        )}
        {error && <div className="mt-4"><ToolNotice variant="error">{error}</ToolNotice></div>}
      </ToolPanel>
    </ToolPage>
  );
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

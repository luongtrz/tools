import { useMemo, useState } from "react";
import { literal, useI18n } from "@/i18n";
import { SAMPLE_MARKDOWN } from "@/constants/sampleMarkdown";
import { renderMarkdown } from "@/lib/markdown";
import { markdownToDocxBlob } from "@/lib/docx";
import { downloadBlob, downloadFile } from "@/lib/download";
import {
  ToolButton,
  ToolLabel,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import { toolStyles } from "@/components/toolStyles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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
        <p className="mt-4 font-mono text-xs text-muted-foreground">
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
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("merged.pdf");

  function appendFiles(next: File[]): void {
    if (!next.length) return;
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
          setPageCounts((counts) => ({
            ...counts,
            [file.name]: doc.getPageCount(),
          }));
        } catch {
          setPageCounts((counts) => ({ ...counts, [file.name]: 0 }));
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
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
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
    (sum, file) => sum + (pageCounts[file.name] ?? 0),
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
              setPageCounts({});
              setError("");
              if (downloadUrl) URL.revokeObjectURL(downloadUrl);
              setDownloadUrl(null);
            }}
            onClear={() => {
              setFiles([]);
              setPageCounts({});
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
                  {pageCounts[file.name]
                    ? `${pageCounts[file.name]} page${pageCounts[file.name] === 1 ? "" : "s"}`
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

export function SplitPdfTool() {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [ranges, setRanges] = useState("1");
  const [preset, setPreset] = useState<SplitPreset>("custom");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [splitEach, setSplitEach] = useState(false);

  async function loadFile(next: File | null): Promise<void> {
    setFile(next);
    setError("");
    setTotalPages(0);
    if (!next) return;
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await next.arrayBuffer(), {
        ignoreEncryption: true,
      });
      setTotalPages(doc.getPageCount());
    } catch {
      setError(t("pdfLoadFailed"));
    }
  }

  function applyPreset(value: SplitPreset): void {
    setPreset(value);
    if (!totalPages) return;
    if (value === "all") {
      setRanges(`1-${totalPages}`);
    } else if (value === "odd") {
      setRanges(rangeForPredicate(totalPages, (p) => p % 2 === 1));
    } else if (value === "even") {
      setRanges(rangeForPredicate(totalPages, (p) => p % 2 === 0));
    } else if (value === "first") {
      setRanges("1");
    } else if (value === "last") {
      setRanges(`${totalPages}`);
    }
  }

  const rangeResult = useMemo(
    () => parseRanges(ranges, totalPages),
    [ranges, totalPages],
  );

  async function split(): Promise<void> {
    if (!file) return;
    if (!rangeResult.pages.length) {
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
        for (const page of rangeResult.pages) {
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
          rangeResult.pages.map((page) => page - 1),
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
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(["custom", "all", "odd", "even", "first", "last"] as SplitPreset[]).map(
            (value) => (
              <Button
                key={value}
                size="sm"
                variant={preset === value ? "default" : "outline"}
                onClick={() => applyPreset(value)}
                disabled={!totalPages}
              >
                {value}
              </Button>
            ),
          )}
        </div>
        <label className={toolStyles.label}>
          <ToolLabel>Pages</ToolLabel>
          <Input
            value={ranges}
            onChange={(event) => {
              setRanges(event.target.value);
              setPreset("custom");
            }}
            placeholder="1, 3-5"
            className="h-9 font-mono"
          />
        </label>
        {totalPages > 0 && (
          <p
            className={cn(
              "text-xs",
              rangeResult.error ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {rangeResult.error
              ? rangeResult.error
              : `${rangeResult.pages.length} page${rangeResult.pages.length === 1 ? "" : "s"} selected`}
          </p>
        )}
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={splitEach}
            onCheckedChange={(value) => setSplitEach(Boolean(value))}
          />
          Save each selected page as a separate PDF
        </label>
        <div className="mt-3">
          <Button
            onClick={() => void split()}
            busy={busy}
            disabled={!file || !rangeResult.pages.length}
          >
            {busy ? t("processing") : t("splitPdf")}
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

function rangeForPredicate(total: number, predicate: (page: number) => boolean): string {
  const pages: string[] = [];
  let start: number | null = null;
  for (let p = 1; p <= total; p += 1) {
    if (predicate(p)) {
      if (start === null) start = p;
    } else if (start !== null) {
      pages.push(start === p - 1 ? `${start}` : `${start}-${p - 1}`);
      start = null;
    }
  }
  if (start !== null) {
    pages.push(start === total ? `${start}` : `${start}-${total}`);
  }
  return pages.join(",");
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

  async function compress(): Promise<void> {
    if (!file) return;
    setBusy(true);
    setError("");
    setSizeResult(null);
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
      setSizeResult({
        before: file.size,
        after: bytes.byteLength,
        blob: pdfBlob(bytes),
      });
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
              setError("");
            }}
            onClear={() => {
              setFile(null);
              setSizeResult(null);
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
          {sizeResult && (
            <a
              href={URL.createObjectURL(sizeResult.blob)}
              download={`${outputStem(file?.name ?? "document", "document")}-optimized.pdf`}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
              onClick={(event) => {
                event.currentTarget.addEventListener("click", () => {
                  setTimeout(() => URL.revokeObjectURL(event.currentTarget.href), 1000);
                }, { once: true });
              }}
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

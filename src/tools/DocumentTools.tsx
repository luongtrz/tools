import { useState } from "react";
import pptxgen from "pptxgenjs";
import { PDFDocument } from "pdf-lib";
import { SAMPLE_MARKDOWN } from "../constants/sampleMarkdown";
import { renderMarkdown } from "../lib/markdown";
import { downloadBlob, downloadFile } from "../lib/download";
import {
  ToolButton,
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
  return (
    <label className={toolStyles.filePicker}>
      <span>Choose PDF file{multiple ? "s" : ""}</span>
      <input
        type="file"
        accept="application/pdf,.pdf"
        multiple={multiple}
        onChange={(event) => onFiles(Array.from(event.target.files || []))}
      />
    </label>
  );
}

function pdfBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

export function Md2WordTool() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [name, setName] = useState("document");
  function exportWord(): void {
    const safeName = name.trim().replace(/[^a-zA-Z0-9_-]/g, "-") || "document";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeName}</title><style>body{font-family:Arial,sans-serif;line-height:1.6;max-width:760px;margin:40px auto}h1,h2,h3{color:#172235}code{background:#f1f3f5;padding:2px 4px}</style></head><body>${renderMarkdown(markdown)}</body></html>`;
    downloadFile(`${safeName}.doc`, html, "application/msword;charset=utf-8");
  }
  return (
    <ToolPage slug="md2word">
      <div className={toolStyles.splitLayout}>
        <ToolPanel
          title="Markdown input"
          description="Paste or write the content you want to export."
        >
          <ToolTextArea
            value={markdown}
            onChange={setMarkdown}
            ariaLabel="Markdown input"
          />
        </ToolPanel>
        <ToolPanel
          title="Word preview"
          description="The exported .doc keeps this basic formatting."
          actions={<ToolButton onClick={exportWord}>Download .doc</ToolButton>}
        >
          <article
            className={toolStyles.documentPreview}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
          />
        </ToolPanel>
      </div>
      <ToolPanel title="File name">
        <input
          className={toolStyles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="document"
        />
      </ToolPanel>
    </ToolPage>
  );
}

export function Md2PptxTool() {
  const [markdown, setMarkdown] = useState(
    `# Project brief\n\nA focused presentation from Markdown.\n\n---\n\n## Next steps\n\n- Choose a clear story\n- Keep each slide focused`,
  );
  const [name, setName] = useState("presentation");
  const [busy, setBusy] = useState(false);
  async function exportPptx(): Promise<void> {
    setBusy(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "toolmd";
      pptx.subject = "Markdown presentation";
      const slides = markdown.split(/\n\s*---+\s*\n/g).filter(Boolean);
      slides.forEach((content, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: "F7F8FA" };
        const lines = content.split("\n").filter((line) => line.trim());
        const titleLine = lines.find((line) => /^#{1,3}\s/.test(line));
        const title = titleLine
          ? titleLine.replace(/^#{1,3}\s+/, "")
          : `Slide ${index + 1}`;
        const body = lines
          .filter((line) => line !== titleLine)
          .map((line) => line.replace(/^[-*+]\s+/, "• "))
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
        fileName: `${name.trim().replace(/[^a-zA-Z0-9_-]/g, "-") || "presentation"}.pptx`,
      });
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
          <input
            className={toolStyles.input}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="presentation"
          />
          <ToolButton onClick={exportPptx} disabled={busy}>
            {busy ? "Building…" : "Download .pptx"}
          </ToolButton>
        </div>
      </ToolPanel>
      <div className={toolStyles.hint}>
        Tip: use <code>---</code> between sections to create a new slide.
      </div>
    </ToolPage>
  );
}

export function MergePdfTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  async function merge(): Promise<void> {
    if (!files.length) return;
    setBusy(true);
    try {
      const output = await PDFDocument.create();
      for (const file of files) {
        const source = await PDFDocument.load(await file.arrayBuffer());
        const pages = await output.copyPages(source, source.getPageIndices());
        pages.forEach((page) => output.addPage(page));
      }
      downloadBlob("merged.pdf", pdfBlob(await output.save()));
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
        <FilePicker multiple onFiles={setFiles} />
        <div className={toolStyles.fileList}>
          {files.map((file, index) => (
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600" key={`${file.name}-${index}`}>
              <span className="font-mono text-[#f2633d]">{index + 1}</span>
              {file.name}
              <small className="ml-auto text-xs text-slate-400">{Math.round(file.size / 1024)} KB</small>
            </div>
          ))}
        </div>
        <ToolButton onClick={merge} disabled={!files.length || busy}>
          {busy
            ? "Merging…"
            : `Merge ${files.length || ""} PDF${files.length === 1 ? "" : "s"}`}
        </ToolButton>
      </ToolPanel>
    </ToolPage>
  );
}

function parseRanges(value: string, total: number): number[] {
  const pages = new Set<number>();
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [startRaw, endRaw] = part
        .split("-")
        .map((item) => Number(item.trim()));
      const start = Math.max(1, startRaw || 1);
      const end = Math.min(total, endRaw || start);
      for (
        let page = Math.min(start, end);
        page <= Math.max(start, end);
        page += 1
      )
        pages.add(page);
    });
  return Array.from(pages).sort((a, b) => a - b);
}

export function SplitPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [ranges, setRanges] = useState("1");
  const [busy, setBusy] = useState(false);
  async function split(): Promise<void> {
    if (!file) return;
    setBusy(true);
    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pages = parseRanges(ranges, source.getPageCount());
      const output = await PDFDocument.create();
      const copied = await output.copyPages(
        source,
        pages.map((page) => page - 1),
      );
      copied.forEach((page) => output.addPage(page));
      downloadBlob("split.pdf", pdfBlob(await output.save()));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolPage slug="split-pdf">
      <ToolPanel
        title="Choose a PDF"
        description="Use page numbers like 1, 3-5, 8."
      >
        <FilePicker onFiles={(files) => setFile(files[0] || null)} />
        <p className={toolStyles.selectedFile}>
          {file ? file.name : "No file selected"}
        </p>
        <label className={toolStyles.label}>
          Pages
          <input
            className={toolStyles.input}
            value={ranges}
            onChange={(event) => setRanges(event.target.value)}
            placeholder="1, 3-5"
          />
        </label>
        <ToolButton onClick={split} disabled={!file || busy}>
          {busy ? "Splitting…" : "Download split PDF"}
        </ToolButton>
      </ToolPanel>
    </ToolPage>
  );
}

export function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  async function compress(): Promise<void> {
    if (!file) return;
    setBusy(true);
    try {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const bytes = await source.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      downloadBlob("compressed.pdf", pdfBlob(bytes));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ToolPage slug="compress-pdf">
      <ToolPanel
        title="Compress a PDF"
        description="This browser-side pass removes some redundant PDF structure. Image-heavy PDFs may need a dedicated image optimizer for bigger savings."
      >
        <FilePicker onFiles={(files) => setFile(files[0] || null)} />
        <p className={toolStyles.selectedFile}>
          {file
            ? `${file.name} · ${Math.round(file.size / 1024)} KB`
            : "No file selected"}
        </p>
        <ToolButton onClick={compress} disabled={!file || busy}>
          {busy ? "Optimizing…" : "Download optimized PDF"}
        </ToolButton>
      </ToolPanel>
    </ToolPage>
  );
}

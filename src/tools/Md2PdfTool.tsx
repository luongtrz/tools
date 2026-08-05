import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { SAMPLE_MARKDOWN } from "../constants/sampleMarkdown";
import { useCollaboration } from "../hooks/useCollaboration";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { downloadFile } from "../lib/download";
import { renderMarkdown } from "../lib/markdown";
import MarkdownEditor from "../components/MarkdownEditor";
import MarkdownPreview from "../components/MarkdownPreview";
import OutputSettings from "../components/OutputSettings";
import QuickTip from "../components/QuickTip";
import ShareModal from "../components/ShareModal";
import Toast from "../components/Toast";
import TopBar from "../components/TopBar";
import WorkspaceToolbar from "../components/WorkspaceToolbar";

function randomGuestName(): string {
  return `Guest ${Math.floor(Math.random() * 90 + 10)}`;
}

export default function Md2PdfTool() {
  const [markdown, setMarkdown] = useLocalStorage(
    "md2pdf-content",
    SAMPLE_MARKDOWN,
  );
  const [outputName, setOutputName] = useLocalStorage(
    "md2pdf-name",
    "project-brief",
  );
  const [collaboratorName, setCollaboratorName] = useLocalStorage(
    "md2pdf-collab-name",
    randomGuestName(),
  );
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("Portrait");
  const [margins, setMargins] = useState("18");
  const [zoom, setZoom] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState("");
  const collaboration = useCollaboration({
    markdown,
    setMarkdown,
    name: collaboratorName,
  });
  const previewHtml = useMemo(() => renderMarkdown(markdown), [markdown]);
  const command = useMemo(() => {
    const safeName = (outputName.trim() || "document").replace(
      /[^a-zA-Z0-9_-]/g,
      "-",
    );
    return `wkhtmltopdf --page-size ${pageSize} --orientation ${orientation} ${safeName}.html ${safeName}.pdf`;
  }, [orientation, outputName, pageSize]);
  const pageCount = Math.max(1, Math.ceil(markdown.length / 1450));
  const fileBaseName = outputName.trim() || "untitled";

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShareOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  function notify(message: string): void {
    setToast(message);
  }
  function handleMarkdownChange(value: string): void {
    setMarkdown(value);
    collaboration.syncLocalChange(value);
  }
  function resetDocument(): void {
    handleMarkdownChange(SAMPLE_MARKDOWN);
    setOutputName("project-brief");
    notify("Đã khôi phục tài liệu mẫu");
  }
  function handleDownloadMarkdown(): void {
    const safeName = fileBaseName.replace(/[^a-zA-Z0-9_-]/g, "-");
    downloadFile(`${safeName}.md`, markdown, "text/markdown;charset=utf-8");
    notify("Đang tải Markdown…");
  }
  function handleExport(): void {
    notify("Mở hộp thoại in để lưu PDF");
    window.setTimeout(() => window.print(), 250);
  }
  function handleRename(): void {
    const nextName = window.prompt(
      "Tên tài liệu",
      outputName || "project-brief",
    );
    if (nextName !== null) setOutputName(nextName.replace(/\.md$/i, ""));
  }
  async function handleShare(): Promise<void> {
    const room = await collaboration.createRoom();
    if (room) setShareOpen(true);
    else notify("Không thể tạo live room — hãy thử lại");
  }
  async function copyShareLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(collaboration.shareUrl);
      notify("Đã copy share link");
    } catch {
      notify("Không thể copy tự động — hãy chọn link");
    }
  }

  return (
    <>
      <div className="mx-auto min-h-screen max-w-[1600px] px-4 font-sans text-[#152031] sm:px-8 lg:px-12 print:hidden">
        <TopBar onReset={resetDocument} />
        <main className="py-10 sm:py-14">
          <section className="mb-10 flex flex-col items-start justify-between gap-7 sm:mb-12 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 flex items-center gap-2 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">
                <span className="h-px w-6 bg-[#f2633d]" /> DOCUMENT WORKSPACE
              </p>
              <h1 className="mb-4 font-display text-[clamp(40px,5vw,68px)] font-bold leading-[.98] tracking-[-3px] text-[#111b2c]">
                Markdown, <em className="not-italic text-[#f2633d]">ready to print.</em>
              </h1>
              <p className="m-0 max-w-[620px] text-base leading-7 text-slate-500 sm:text-lg">
                Biến ghi chú và tài liệu của bạn thành PDF sạch đẹp trong vài
                giây.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 pb-1 sm:items-end">
              <span className="font-mono text-xs font-medium tracking-[1.3px] text-slate-400">
                {collaboration.status === "connected"
                  ? "LIVE WORKSPACE"
                  : "LOCAL WORKSPACE"}
              </span>
              <span className="flex items-center gap-2 font-mono text-sm text-slate-500">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(96,188,135,.14)]" />{" "}
                {collaboration.status === "connected"
                  ? "Đang cộng tác"
                  : "Đã đồng bộ"}
              </span>
            </div>
          </section>
          <section
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(24,38,61,.09),0_3px_12px_rgba(24,38,61,.04)]"
            aria-label="Markdown editor and preview"
          >
            <WorkspaceToolbar
              fileName={fileBaseName}
              status={collaboration.status}
              collaboratorCount={collaboration.collaboratorCount}
              onShare={handleShare}
              onDownload={handleDownloadMarkdown}
              onExport={handleExport}
              onRename={handleRename}
            />
            <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <MarkdownEditor
                value={markdown}
                onChange={handleMarkdownChange}
              />
              <MarkdownPreview
                html={previewHtml}
                zoom={zoom}
                pageCount={pageCount}
                onZoomIn={() =>
                  setZoom((value) => Math.min(1.2, +(value + 0.1).toFixed(1)))
                }
                onZoomOut={() =>
                  setZoom((value) => Math.max(0.8, +(value - 0.1).toFixed(1)))
                }
              />
            </div>
          </section>
          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(250px,.85fr)]">
            <OutputSettings
              pageSize={pageSize}
              orientation={orientation}
              margins={margins}
              outputName={outputName}
              onPageSizeChange={setPageSize}
              onOrientationChange={setOrientation}
              onMarginsChange={setMargins}
              onOutputNameChange={setOutputName}
              command={command}
              onCopyCommand={async () => {
                try {
                  await navigator.clipboard.writeText(command);
                  notify("Đã copy lệnh wkhtmltopdf");
                } catch {
                  notify("Không thể copy tự động — hãy chọn lệnh");
                }
              }}
            />
            <QuickTip />
          </section>
        </main>
        <footer className="flex flex-col justify-between gap-2 px-1 py-7 font-mono text-xs text-slate-400 sm:flex-row">
          <span>
            toolmd <span className="mx-2 text-slate-300">/</span> md2pdf workspace
          </span>
          <span>
            Made for focused writing <span className="text-[#f2633d]">♥</span>
          </span>
        </footer>
      </div>
      <ShareModal
        open={shareOpen}
        shareUrl={collaboration.shareUrl}
        roomId={collaboration.roomId}
        status={collaboration.status}
        collaboratorCount={collaboration.collaboratorCount}
        name={collaboratorName}
        onNameChange={(value) => {
          setCollaboratorName(value);
          collaboration.setName(value);
        }}
        onClose={() => setShareOpen(false)}
        onCopy={copyShareLink}
      />
      <div
        className="hidden min-h-screen print:block"
        style={{ padding: `${margins}mm` } as CSSProperties}
      >
        <article
          className="w-full text-slate-700 [&_h1]:mb-5 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-7 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-slate-800 [&_pre]:p-4 [&_pre]:text-slate-100"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
      <Toast message={toast} />
    </>
  );
}

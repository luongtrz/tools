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
      <div className="app-shell">
        <TopBar onReset={resetDocument} />
        <main>
          <section className="hero-row">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-line" /> DOCUMENT WORKSPACE
              </p>
              <h1>
                Markdown, <em>ready to print.</em>
              </h1>
              <p className="hero-copy">
                Biến ghi chú và tài liệu của bạn thành PDF sạch đẹp trong vài
                giây.
              </p>
            </div>
            <div className="hero-meta">
              <span className="meta-label">
                {collaboration.status === "connected"
                  ? "LIVE WORKSPACE"
                  : "LOCAL WORKSPACE"}
              </span>
              <span className="meta-value">
                <span className="status-dot" />{" "}
                {collaboration.status === "connected"
                  ? "Đang cộng tác"
                  : "Đã đồng bộ"}
              </span>
            </div>
          </section>
          <section
            className="workspace-card"
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
            <div className="editor-grid">
              <MarkdownEditor
                value={markdown}
                onChange={handleMarkdownChange}
              />
              <div className="splitter" aria-hidden="true">
                <span />
              </div>
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
          <section className="bottom-grid">
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
        <footer className="footer">
          <span>
            toolmd <span className="muted">/</span> md2pdf workspace
          </span>
          <span>
            Made for focused writing <span className="heart">♥</span>
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
        className="print-sheet"
        style={{ "--print-margin": `${margins}mm` } as CSSProperties}
      >
        <article
          className="paper"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </div>
      <Toast message={toast} />
    </>
  );
}

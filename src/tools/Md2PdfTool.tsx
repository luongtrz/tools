import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../i18n";
import { SAMPLE_MARKDOWN } from "../constants/sampleMarkdown";
import { useCollaboration } from "../hooks/useCollaboration";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { downloadBlob, downloadFile } from "../lib/download";
import { copyText } from "../lib/clipboard";
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

function safePdfName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-") || "document";
}

const PDF_ENDPOINT = import.meta.env.VITE_PDF_URL || "https://toolmd-mcp.22120199.workers.dev/pdf";

export default function Md2PdfTool() {
  const { t } = useI18n();
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
  const previewHtml = useMemo(
    () => (markdown.trim() ? renderMarkdown(markdown) : ""),
    [markdown],
  );
  const command = useMemo(() => {
    const safeName = safePdfName(outputName.trim() || "document");
    return `curl -X POST https://toolmd-mcp.22120199.workers.dev/pdf -H 'content-type: application/json' --data '{"markdown":"YOUR_MARKDOWN","filename":"${safeName}","format":"${pageSize.toLowerCase()}","landscape":${orientation === "Landscape"},"margins":"${margins}"}' --output ${safeName}.pdf`;
  }, [margins, orientation, outputName, pageSize]);
  const pageCount = markdown.trim() ? Math.ceil(markdown.length / 1450) : 0;
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
    notify(t("restoreSample"));
  }
  function handleDownloadMarkdown(): void {
    const safeName = safePdfName(fileBaseName);
    downloadFile(`${safeName}.md`, markdown, "text/markdown;charset=utf-8");
    notify(t("downloadMarkdown"));
  }
  function handleImport(text: string, fileName: string): void {
    handleMarkdownChange(text);
    const base = fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
    if (base) setOutputName(base);
    notify(t("fileImported"));
  }
  async function handleExport(): Promise<void> {
    const safeName = safePdfName(fileBaseName);
    notify(t("processing"));

    try {
      const response = await fetch(PDF_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          markdown,
          filename: safeName,
          format: pageSize.toLowerCase(),
          landscape: orientation === "Landscape",
          margins,
        }),
      });

      if (!response.ok) {
        let message = t("exportFailed");
        try {
          const body = await response.json() as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // Keep the translated fallback when the service does not return JSON.
        }
        throw new Error(message);
      }

      downloadBlob(`${safeName}.pdf`, await response.blob());
      notify(t("exportPdf"));
    } catch (error) {
      console.error("Direct PDF export failed:", error);
      notify(error instanceof Error ? error.message : t("exportFailed"));
    }
  }
  function handleRename(): void {
    const nextName = window.prompt(
      t("fileName"),
      outputName || "project-brief",
    );
    if (nextName !== null) setOutputName(nextName.replace(/\.md$/i, ""));
  }
  async function handleShare(): Promise<void> {
    const room = await collaboration.createRoom();
    if (room) setShareOpen(true);
    else notify(t("connectionFailed"));
  }
  async function copyShareLink(): Promise<void> {
    if (await copyText(collaboration.shareUrl)) {
      notify(t("copyLink"));
      return;
    }
    notify(t("connectionFailed"));
  }

  return (
    <>
      <div className="mx-auto min-h-screen max-w-[1600px] bg-background px-4 font-sans text-foreground sm:px-8 lg:px-12">
        <TopBar onReset={resetDocument} />
        <main className="py-10 sm:py-14">
          <section className="mb-10 flex flex-col items-start justify-between gap-7 sm:mb-12 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 flex items-center gap-2 font-mono text-xs font-medium tracking-[1.5px] text-primary">
                <span className="h-px w-6 bg-primary" /> {t("markdownWorkspace")}
              </p>
              <h1 className="mb-4 font-display text-[clamp(40px,5vw,68px)] font-bold leading-[.98] tracking-[-3px] text-foreground">
                {t("markdownReady")} <em className="not-italic text-primary">{t("readyToPrint")}</em>
              </h1>
              <p className="m-0 max-w-[620px] text-base leading-7 text-muted-foreground  sm:text-lg">
                {t("markdownDescription")}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 pb-1 sm:items-end">
              <span className="font-mono text-xs font-medium tracking-[1.3px] text-muted-foreground">
                {collaboration.status === "connected"
                  ? t("liveWorkspace")
                  : t("localWorkspace")}
              </span>
              <span className="flex items-center gap-2 font-mono text-sm text-muted-foreground ">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(96,188,135,.14)]" />{" "}
                {collaboration.status === "connected"
                  ? t("collaborating")
                  : t("synced")}
              </span>
            </div>
          </section>
          <section
            className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_20px_60px_rgba(24,38,61,.09),0_3px_12px_rgba(24,38,61,.04)] dark:border-border dark:bg-card dark:shadow-black/30"
            aria-label={t("markdownEditorPreview")}
          >
            <WorkspaceToolbar
              fileName={fileBaseName}
              status={collaboration.status}
              collaboratorCount={collaboration.collaboratorCount}
              onShare={handleShare}
              onDownload={handleDownloadMarkdown}
              onExport={handleExport}
              onImport={(text, name) => handleImport(text, name)}
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
                  notify(t("copy"));
                } catch {
                  notify(t("connectionFailed"));
                }
              }}
            />
            <QuickTip />
          </section>
        </main>
        <footer className="flex flex-col justify-between gap-2 px-1 py-7 font-mono text-xs text-muted-foreground  sm:flex-row">
          <span>
            toolmd <span className="mx-2 text-foreground">/</span> {t("md2pdfWorkspace")}
          </span>
          <span>
            {t("focusedWriting")} <span className="text-primary">♥</span>
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
      <Toast message={toast} />
    </>
  );
}

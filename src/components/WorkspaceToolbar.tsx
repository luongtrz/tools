import Icon from "./Icon";
import type { CollaborationStatus } from "@/hooks/useCollaboration";
import { useI18n } from "@/i18n";
import { FileDropZone } from "./ToolSupport";

interface WorkspaceToolbarProps {
  fileName: string;
  status: CollaborationStatus;
  collaboratorCount: number;
  onShare: () => void;
  onDownload: () => void;
  onExport: () => void;
  onImport?: (text: string, fileName: string) => void;
  onRename: () => void;
}

export default function WorkspaceToolbar({
  fileName,
  status,
  collaboratorCount,
  onShare,
  onDownload,
  onExport,
  onImport,
  onRename,
}: WorkspaceToolbarProps) {
  const { t } = useI18n();
  const isLive = status !== "idle" && status !== "error";
  const statusLabel =
    status === "connected"
      ? t("liveStatus", { count: collaboratorCount })
      : status === "connecting"
        ? t("connecting")
        : status === "offline"
          ? t("offlineRetrying")
          : status === "error"
            ? t("connectionFailed")
            : t("localDraft");
  return (
    <div className="flex min-h-[88px] flex-col items-start justify-between gap-4 border-b border-border px-5 py-4 dark:border-border lg:flex-row lg:items-center lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Icon name="file" />
        </span>
        <div className="min-w-0">
          <strong
            className="block truncate text-base font-semibold text-foreground"
            title={`${fileName}.md`}
          >
            {fileName}.md
          </strong>
          <span className="mt-1 block font-mono text-xs text-muted-foreground">
            {isLive
              ? `${t("liveRoom")} · ${t("onlinePeople", { count: collaboratorCount })}`
              : t("localMarkdown")}
          </span>
        </div>
        <button
          className="ml-1 rounded-lg px-2 text-xl leading-none text-muted-foreground transition hover:bg-accent hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary"
          type="button"
          aria-label={t("renameFile")}
          onClick={onRename}
        >
          ⌁
        </button>
        {onImport && (
          <div className="ml-2 max-w-[180px]">
            <FileDropZone
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              label="Import .md"
              description="Drop or click"
              className="[&>label]:min-h-0 [&>label]:py-2 [&>label]:text-[10px]"
              onFiles={async (files) => {
                const file = files[0];
                if (!file) return;
                const text = await file.text();
                onImport(text, file.name);
              }}
            />
          </div>
        )}
      </div>
      <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
        <span
          className={`inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs ${
            status === "connected"
              ? "text-emerald-600 dark:text-emerald-400"
              : status === "connecting"
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              status === "connected"
                ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(63,180,119,.14)]"
                : status === "connecting"
                  ? "bg-amber-400"
                  : "bg-muted"
            }`}
          />{" "}
          {statusLabel}
        </span>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:-translate-y-px hover:bg-primary/20 dark:border-primary/40 dark:bg-primary/10 dark:text-primary dark:hover:bg-primary/20"
          type="button"
          onClick={onShare}
        >
          <Icon name="share" /> {t("shareLive")}
        </button>
        <span className="ml-auto inline-flex items-center gap-2 font-mono text-xs text-muted-foreground lg:ml-0">
          <span className="size-2 rounded-full bg-emerald-400" /> {t("autoSave")}
        </span>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-muted/50 px-4 text-sm font-semibold text-foreground transition hover:bg-muted dark:bg-muted dark:hover:bg-muted"
          type="button"
          onClick={onDownload}
        >
          <Icon name="download" /> {t("downloadMarkdown")}
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-px hover:bg-primary"
          type="button"
          onClick={onExport}
        >
          <Icon name="print" /> {t("exportPdf")}
        </button>
      </div>
    </div>
  );
}

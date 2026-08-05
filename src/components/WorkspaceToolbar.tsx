import Icon from "./Icon";
import type { CollaborationStatus } from "../hooks/useCollaboration";
import { useI18n } from "../i18n";

interface WorkspaceToolbarProps {
  fileName: string;
  status: CollaborationStatus;
  collaboratorCount: number;
  onShare: () => void;
  onDownload: () => void;
  onExport: () => void;
  onRename: () => void;
}

export default function WorkspaceToolbar({
  fileName,
  status,
  collaboratorCount,
  onShare,
  onDownload,
  onExport,
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
    <div className="flex min-h-[88px] flex-col items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-none">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff3ef] text-[#f2633d]" aria-hidden="true">
          <Icon name="file" />
        </span>
        <div className="min-w-0">
          <strong className="block truncate text-base font-semibold text-[#111b2c] dark:text-slate-100" title={`${fileName}.md`}>{fileName}.md</strong>
          <span className="mt-1 block font-mono text-xs text-slate-400 dark:text-slate-500">
            {isLive
              ? `${t("liveRoom")} · ${t("onlinePeople", { count: collaboratorCount })}`
              : t("localMarkdown")}
          </span>
        </div>
        <button
          className="ml-1 rounded-lg px-2 text-xl leading-none text-slate-400 transition hover:bg-orange-50 hover:text-[#f2633d] dark:text-slate-500 dark:hover:bg-orange-950/50 dark:hover:text-orange-300"
          type="button"
          aria-label={t("renameFile")}
          onClick={onRename}
        >
          ⌁
        </button>
      </div>
      <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
        <span className={`inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs ${status === "connected" ? "text-emerald-600 dark:text-emerald-400" : status === "connecting" ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
          <span className={`size-2 rounded-full ${status === "connected" ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(63,180,119,.14)]" : status === "connecting" ? "bg-amber-400" : "bg-slate-300"}`} />{" "}
          {statusLabel}
        </span>
        <button className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-orange-100 bg-orange-50 px-4 text-sm font-semibold text-[#da5a3a] transition hover:-translate-y-px hover:bg-orange-100 dark:border-orange-900/70 dark:bg-orange-950/40 dark:text-orange-300 dark:hover:bg-orange-950/70" type="button" onClick={onShare}>
          <Icon name="share" /> {t("shareLive")}
        </button>
        <span className="ml-auto inline-flex items-center gap-2 font-mono text-xs text-slate-400 dark:text-slate-500 lg:ml-0">
          <span className="size-2 rounded-full bg-emerald-400" /> {t("autoSave")}
        </span>
        <button className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" type="button" onClick={onDownload}>
          <Icon name="download" /> {t("downloadMarkdown")}
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#f2633d] px-4 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-px hover:bg-[#d95132]" type="button" onClick={onExport}>
          <Icon name="print" /> {t("exportPdf")}
        </button>
      </div>
    </div>
  );
}

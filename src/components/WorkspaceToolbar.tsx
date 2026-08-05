import Icon from "./Icon";
import type { CollaborationStatus } from "../hooks/useCollaboration";

interface WorkspaceToolbarProps {
  fileName: string;
  status: CollaborationStatus;
  collaboratorCount: number;
  onShare: () => void;
  onDownload: () => void;
  onExport: () => void;
  onRename: () => void;
}

function statusText(
  status: CollaborationStatus,
  collaboratorCount: number,
): string {
  if (status === "connected") return `Live · ${collaboratorCount} online`;
  if (status === "connecting") return "Connecting…";
  if (status === "offline") return "Offline · retrying";
  if (status === "error") return "Connection failed";
  return "Local draft";
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
  const isLive = status !== "idle" && status !== "error";
  return (
    <div className="flex min-h-[88px] flex-col items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:px-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff3ef] text-[#f2633d]" aria-hidden="true">
          <Icon name="file" />
        </span>
        <div>
          <strong className="block text-base font-semibold text-[#111b2c]">{fileName}.md</strong>
          <span className="mt-1 block font-mono text-xs text-slate-400">
            {isLive
              ? `Live room · ${collaboratorCount} ${collaboratorCount === 1 ? "person" : "people"} online`
              : "Markdown document · Local"}
          </span>
        </div>
        <button
          className="ml-1 rounded-lg px-2 text-xl leading-none text-slate-400 transition hover:bg-orange-50 hover:text-[#f2633d]"
          type="button"
          aria-label="Đổi tên file"
          onClick={onRename}
        >
          ⌁
        </button>
      </div>
      <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
        <span className={`inline-flex items-center gap-2 whitespace-nowrap font-mono text-xs ${status === "connected" ? "text-emerald-600" : status === "connecting" ? "text-amber-600" : "text-slate-400"}`}>
          <span className={`size-2 rounded-full ${status === "connected" ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(63,180,119,.14)]" : status === "connecting" ? "bg-amber-400" : "bg-slate-300"}`} />{" "}
          {statusText(status, collaboratorCount)}
        </span>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-4 text-sm font-semibold text-[#da5a3a] transition hover:-translate-y-px hover:bg-orange-100" type="button" onClick={onShare}>
          <Icon name="share" /> Share live
        </button>
        <span className="ml-auto inline-flex items-center gap-2 font-mono text-xs text-slate-400 lg:ml-0">
          <span className="size-2 rounded-full bg-emerald-400" /> Tự động lưu
        </span>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" type="button" onClick={onDownload}>
          <Icon name="download" /> Tải .md
        </button>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#f2633d] px-4 text-sm font-semibold text-white shadow-lg shadow-orange-100 transition hover:-translate-y-px hover:bg-[#d95132]" type="button" onClick={onExport}>
          <Icon name="print" /> Xuất PDF
        </button>
      </div>
    </div>
  );
}

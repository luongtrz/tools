import type { ChangeEvent } from "react";
import type { CollaborationStatus } from "../hooks/useCollaboration";

interface ShareModalProps {
  open: boolean;
  shareUrl: string;
  roomId: string | null;
  status: CollaborationStatus;
  collaboratorCount: number;
  name: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onCopy: () => void;
}

function statusLabel(status: CollaborationStatus): string {
  if (status === "connected") return "Live room";
  if (status === "connecting") return "Connecting…";
  if (status === "offline") return "Offline · retrying";
  if (status === "error") return "Connection failed";
  return "Room ready";
}

export default function ShareModal({
  open,
  shareUrl,
  roomId,
  status,
  collaboratorCount,
  name,
  onNameChange,
  onClose,
  onCopy,
}: ShareModalProps) {
  if (!open) return null;
  const peopleLabel =
    collaboratorCount === 1 ? "Only you" : `${collaboratorCount} people online`;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#111b2c]/50 p-5 backdrop-blur-md"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="relative w-full max-w-[520px] rounded-2xl border border-white/70 bg-white p-6 shadow-[0_25px_80px_rgba(17,27,44,.24)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shareTitle"
      >
        <button
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ chia sẻ"
        >
          ×
        </button>
        <p className="mb-3 flex items-center gap-2 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">
          <span className="h-px w-6 bg-[#f2633d]" /> LIVE COLLABORATION
        </p>
        <h2 className="mb-3 font-display text-3xl font-bold tracking-tight text-[#111b2c]" id="shareTitle">
          Share this <em className="not-italic text-[#f2633d]">workspace.</em>
        </h2>
        <p className="mb-6 max-w-[420px] text-sm leading-6 text-slate-500">
          Mời mọi người cùng chỉnh sửa Markdown theo thời gian thực. Ai có link
          đều có thể tham gia phòng này.
        </p>
        <label className="mb-4 flex flex-col gap-2 font-mono text-xs text-slate-500">
          Your name
          <input className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            value={name}
            maxLength={24}
            placeholder="Guest writer"
            autoComplete="nickname"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onNameChange(event.target.value)
            }
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-600 outline-none" value={shareUrl} readOnly aria-label="Link phòng cộng tác" />
          <button className="h-11 rounded-lg bg-[#f2633d] px-4 text-sm font-semibold text-white shadow-lg shadow-orange-100 hover:bg-[#d95132]" type="button" onClick={onCopy}>
            Copy link
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-500">
          <span>
            <span className="mr-2 inline-block size-2 rounded-full bg-emerald-400" />
            <strong className="font-medium text-slate-700">{statusLabel(status)}</strong>
          </span>
          <span>{peopleLabel}</span>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="h-10 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-200" type="button" onClick={onClose}>
            Done
          </button>
        </div>
        <p className="mt-4 font-mono text-xs text-slate-400">
          Mã phòng: <code>{roomId ?? "—"}</code> · Đồng bộ qua Cloudflare
          WebSocket
        </p>
      </section>
    </div>
  );
}

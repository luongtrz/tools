import { useEffect, useRef, type ChangeEvent } from "react";
import type { CollaborationStatus } from "../hooks/useCollaboration";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  const nameInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) nameInputRef.current?.focus();
  }, [open]);
  if (!open) return null;
  const peopleLabel =
    collaboratorCount === 1
      ? t("onlyYou")
      : t("onlinePeople", { count: collaboratorCount });
  const statusLabel =
    status === "connected"
      ? t("liveRoom")
      : status === "connecting"
        ? t("connecting")
        : status === "offline"
        ? t("offlineRetrying")
          : status === "error"
            ? t("connectionFailed")
            : t("roomReady");
  const statusDot =
    status === "connected"
      ? "bg-emerald-400"
      : status === "connecting"
        ? "bg-amber-400"
        : status === "error"
          ? "bg-red-400"
          : "bg-slate-300";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#111b2c]/50 p-4 backdrop-blur-md dark:bg-black/70 sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-white/70 bg-white p-6 shadow-[0_25px_80px_rgba(17,27,44,.24)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/50 sm:max-h-[calc(100dvh-2.5rem)] sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shareTitle"
        aria-describedby="shareDescription"
      >
        <button
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          type="button"
          onClick={onClose}
          aria-label={t("closeWindow")}
        >
          ×
        </button>
        <p className="mb-3 flex items-center gap-2 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">
          <span className="h-px w-6 bg-[#f2633d]" /> {t("liveCollaboration")}
        </p>
        <h2 className="mb-3 font-display text-3xl font-bold tracking-tight text-[#111b2c] dark:text-slate-100" id="shareTitle">
          {t("shareWorkspace")} <em className="not-italic text-[#f2633d]">{t("workspaceAccent")}</em>
        </h2>
        <p className="mb-6 max-w-[420px] text-sm leading-6 text-slate-500 dark:text-slate-400" id="shareDescription">
          {t("shareDescription")}
        </p>
        <label className="mb-4 flex flex-col gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {t("yourName")}
          <input ref={nameInputRef} className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-orange-400 dark:focus:ring-orange-950/50"
            value={name}
            maxLength={24}
          placeholder={t("guestWriter")}
            autoComplete="nickname"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onNameChange(event.target.value)
            }
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
        <input className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-xs text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300" value={shareUrl} readOnly aria-label={t("roomLink")} />
        <button className="h-11 rounded-lg bg-[#f2633d] px-4 text-sm font-semibold text-white shadow-lg shadow-orange-100 hover:bg-[#d95132] disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={onCopy} disabled={!shareUrl}>
            {t("copyLink")}
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
          <span>
            <span className={`mr-2 inline-block size-2 rounded-full ${statusDot}`} />
            <strong className="font-medium text-slate-700 dark:text-slate-200">{statusLabel}</strong>
          </span>
          <span>{peopleLabel}</span>
        </div>
        <div className="mt-5 flex justify-end">
          <button className="h-10 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" type="button" onClick={onClose}>
            {t("done")}
          </button>
        </div>
        <p className="mt-4 font-mono text-xs text-slate-400">
          {t("roomCode")}: <code>{roomId ?? "—"}</code> · {t("syncedViaCloudflare")}
        </p>
      </section>
    </div>
  );
}

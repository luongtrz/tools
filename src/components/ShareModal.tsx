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
      className="share-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shareTitle"
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ chia sẻ"
        >
          ×
        </button>
        <p className="eyebrow small">
          <span className="eyebrow-line" /> LIVE COLLABORATION
        </p>
        <h2 id="shareTitle">
          Share this <em>workspace.</em>
        </h2>
        <p className="modal-copy">
          Mời mọi người cùng chỉnh sửa Markdown theo thời gian thực. Ai có link
          đều có thể tham gia phòng này.
        </p>
        <label className="collab-name-label">
          Your name
          <input
            value={name}
            maxLength={24}
            placeholder="Guest writer"
            autoComplete="nickname"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onNameChange(event.target.value)
            }
          />
        </label>
        <div className="share-link-row">
          <input value={shareUrl} readOnly aria-label="Link phòng cộng tác" />
          <button className="primary-button" type="button" onClick={onCopy}>
            Copy link
          </button>
        </div>
        <div className="room-info">
          <span>
            <span className="live-dot" />
            <strong>{statusLabel(status)}</strong>
          </span>
          <span>{peopleLabel}</span>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Done
          </button>
        </div>
        <p className="modal-note">
          Mã phòng: <code>{roomId ?? "—"}</code> · Đồng bộ qua Cloudflare
          WebSocket
        </p>
      </section>
    </div>
  );
}

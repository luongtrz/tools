import Icon from './Icon';
import type { CollaborationStatus } from '../hooks/useCollaboration';

interface WorkspaceToolbarProps {
  fileName: string;
  status: CollaborationStatus;
  collaboratorCount: number;
  onShare: () => void;
  onDownload: () => void;
  onExport: () => void;
  onRename: () => void;
}

function statusText(status: CollaborationStatus, collaboratorCount: number): string {
  if (status === 'connected') return `Live · ${collaboratorCount} online`;
  if (status === 'connecting') return 'Connecting…';
  if (status === 'offline') return 'Offline · retrying';
  if (status === 'error') return 'Connection failed';
  return 'Local draft';
}

export default function WorkspaceToolbar({ fileName, status, collaboratorCount, onShare, onDownload, onExport, onRename }: WorkspaceToolbarProps) {
  const isLive = status !== 'idle' && status !== 'error';
  return (
    <div className="workspace-toolbar">
      <div className="file-info">
        <span className="file-icon" aria-hidden="true"><Icon name="file" /></span>
        <div>
          <strong>{fileName}.md</strong>
          <span>{isLive ? `Live room · ${collaboratorCount} ${collaboratorCount === 1 ? 'person' : 'people'} online` : 'Markdown document · Local'}</span>
        </div>
        <button className="rename-button" type="button" aria-label="Đổi tên file" onClick={onRename}>⌁</button>
      </div>
      <div className="toolbar-actions">
        <span className={`collab-status ${status}`}><span className="status-dot" /> {statusText(status, collaboratorCount)}</span>
        <button className="share-button" type="button" onClick={onShare}><Icon name="share" /> Share live</button>
        <span className="autosave"><span className="status-dot" /> Tự động lưu</span>
        <button className="secondary-button" type="button" onClick={onDownload}><Icon name="download" /> Tải .md</button>
        <button className="primary-button" type="button" onClick={onExport}><Icon name="print" /> Xuất PDF</button>
      </div>
    </div>
  );
}

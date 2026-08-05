import Icon from './Icon';

interface TopBarProps {
  onReset: () => void;
}

export default function TopBar({ onReset }: TopBarProps) {
  return (
    <header className="topbar">
      <a className="brand" href="./" aria-label="md2pdf home">
        <span className="brand-mark" aria-hidden="true"><Icon name="fileDocument" /></span>
        <span>md<span className="brand-accent">2</span>pdf</span>
      </a>
      <div className="topbar-actions">
        <div className="engine-pill"><span className="pulse-dot" /> wkhtmltopdf core</div>
        <button className="icon-button" type="button" title="Khôi phục nội dung mẫu" aria-label="Khôi phục nội dung mẫu" onClick={onReset}><Icon name="reset" /></button>
        <button className="avatar" type="button" title="Workspace">A</button>
      </div>
    </header>
  );
}

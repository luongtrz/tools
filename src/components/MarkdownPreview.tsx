interface MarkdownPreviewProps {
  html: string;
  zoom: number;
  pageCount: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function MarkdownPreview({ html, zoom, pageCount, onZoomIn, onZoomOut }: MarkdownPreviewProps) {
  return (
    <section className="preview-pane">
      <div className="pane-heading"><div className="pane-title"><span className="pane-number">02</span><span>LIVE PREVIEW</span></div><div className="preview-tools"><span className="zoom-value">{Math.round(zoom * 100)}%</span><button className="zoom-button" type="button" onClick={onZoomOut} aria-label="Thu nhỏ preview">−</button><button className="zoom-button" type="button" onClick={onZoomIn} aria-label="Phóng to preview">+</button></div></div>
      <div className="preview-stage"><article className="paper" style={{ transform: `scale(${zoom})` }} dangerouslySetInnerHTML={{ __html: html }} /></div>
      <div className="pane-footer"><span><span className="live-dot" /> Cập nhật theo thời gian thực</span><span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span></div>
    </section>
  );
}

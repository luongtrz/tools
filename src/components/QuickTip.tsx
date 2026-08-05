export default function QuickTip() {
  return (
    <aside className="tip-card">
      <span className="tip-spark">✦</span>
      <p className="eyebrow small">QUICK TIP</p>
      <h2>Designed for<br /><em>clean exports.</em></h2>
      <p>Hỗ trợ headings, lists, links, code blocks và blockquotes. PDF được render bằng engine tương thích wkhtmltopdf.</p>
      <a href="https://wkhtmltopdf.org/usage/wkhtmltopdf.txt" target="_blank" rel="noreferrer">Xem wkhtmltopdf docs <span>↗</span></a>
    </aside>
  );
}

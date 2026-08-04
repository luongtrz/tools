const SAMPLE_MARKDOWN = `# Project brief

## A focused workspace for ideas

Write in **Markdown**, preview your document instantly, and export a polished PDF when it is ready.

> Good documents make complex ideas feel simple.

### What you can do

- Draft without distractions
- Preview every change in real time
- Export with clean, print-ready margins

---

The output is compatible with the \`wkhtmltopdf\` rendering workflow. Add a link to [your project](https://example.com) or a small code snippet:

\`\`\`bash
wkhtmltopdf --page-size A4 input.html output.pdf
\`\`\``;

const input = document.querySelector('#markdownInput');
const preview = document.querySelector('#preview');
const lineNumbers = document.querySelector('#lineNumbers');
const wordCount = document.querySelector('#wordCount');
const charCount = document.querySelector('#charCount');
const pageEstimate = document.querySelector('#pageEstimate');
const outputName = document.querySelector('#outputName');
const pageSize = document.querySelector('#pageSize');
const margins = document.querySelector('#margins');
const orientation = document.querySelector('#orientation');
const commandText = document.querySelector('#commandText');
const toast = document.querySelector('#toast');
const fileName = document.querySelector('#fileName');
const fileMeta = document.querySelector('#fileMeta');
const printSheet = document.querySelector('#printSheet');
let zoom = 1;
let toastTimer;

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img alt="$1" src="$2">');
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  return html;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  let listType = null;
  let inCode = false;
  let codeLanguage = '';
  let codeLines = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) { output.push(`</${listType}>`); listType = null; }
  };
  const closeCode = () => {
    if (inCode) {
      output.push(`<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      inCode = false; codeLanguage = ''; codeLines = [];
    }
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      flushParagraph(); closeList();
      if (!inCode) { inCode = true; codeLanguage = line.trim().slice(3); } else closeCode();
      return;
    }
    if (inCode) { codeLines.push(line); return; }
    if (!line.trim()) { flushParagraph(); closeList(); return; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { flushParagraph(); closeList(); output.push(`<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`); return; }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { flushParagraph(); closeList(); output.push('<hr>'); return; }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) { flushParagraph(); closeList(); output.push(`<blockquote>${inlineMarkdown(quote[1])}</blockquote>`); return; }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const desiredType = unordered ? 'ul' : 'ol';
      if (listType !== desiredType) { closeList(); output.push(`<${desiredType}>`); listType = desiredType; }
      output.push(`<li>${inlineMarkdown((unordered || ordered)[1])}</li>`); return;
    }
    closeList(); paragraph.push(line.trim());
  });
  flushParagraph(); closeList(); closeCode();
  return output.join('') || '<p class="empty-state">Bắt đầu viết Markdown của bạn…</p>';
}

function updateLineNumbers() {
  const count = Math.max(1, input.value.split('\n').length);
  lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join('\n');
  lineNumbers.style.lineHeight = getComputedStyle(input).lineHeight;
}

function updateStats() {
  const text = input.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  wordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  charCount.textContent = `${input.value.length} characters`;
  pageEstimate.textContent = `${Math.max(1, Math.ceil(input.value.length / 1450))} ${Math.ceil(input.value.length / 1450) === 1 ? 'page' : 'pages'}`;
}

function updateCommand() {
  const safeName = (outputName.value.trim() || 'document').replace(/[^a-zA-Z0-9_-]/g, '-');
  commandText.textContent = `wkhtmltopdf --page-size ${pageSize.value} --orientation ${orientation.value} ${safeName}.html ${safeName}.pdf`;
}

function updatePreview() {
  preview.innerHTML = renderMarkdown(input.value);
  updateLineNumbers(); updateStats(); updateCommand();
  localStorage.setItem('md2pdf-content', input.value);
  localStorage.setItem('md2pdf-name', outputName.value);
}

function showToast(message) {
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function syncPrintSheet() {
  printSheet.innerHTML = `<article class="paper">${preview.innerHTML}</article>`;
  printSheet.style.setProperty('--print-margin', `${margins.value}mm`);
}

input.addEventListener('input', updatePreview);
input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
document.querySelector('#pageSize').addEventListener('change', updateCommand);
document.querySelector('#orientation').addEventListener('change', updateCommand);
document.querySelector('#margins').addEventListener('change', updateCommand);
outputName.addEventListener('input', () => { fileName.textContent = `${outputName.value.trim() || 'untitled'}.md`; updateCommand(); localStorage.setItem('md2pdf-name', outputName.value); });

document.querySelector('#resetButton').addEventListener('click', () => { input.value = SAMPLE_MARKDOWN; outputName.value = 'project-brief'; fileName.textContent = 'project-brief.md'; updatePreview(); showToast('Đã khôi phục tài liệu mẫu'); });
document.querySelector('#downloadMdButton').addEventListener('click', () => { const name = (outputName.value.trim() || 'document').replace(/[^a-zA-Z0-9_-]/g, '-'); downloadFile(`${name}.md`, input.value, 'text/markdown;charset=utf-8'); showToast('Đang tải Markdown…'); });
document.querySelector('#exportButton').addEventListener('click', () => { syncPrintSheet(); showToast('Mở hộp thoại in để lưu PDF'); setTimeout(() => window.print(), 250); });
document.querySelector('#copyCommand').addEventListener('click', async () => { try { await navigator.clipboard.writeText(commandText.textContent); showToast('Đã copy lệnh wkhtmltopdf'); } catch { showToast('Không thể copy tự động — hãy chọn lệnh'); } });
document.querySelector('#renameButton').addEventListener('click', () => { const nextName = window.prompt('Tên tài liệu', outputName.value || 'project-brief'); if (nextName !== null) { outputName.value = nextName.replace(/\.md$/i, ''); outputName.dispatchEvent(new Event('input')); } });
document.querySelector('#zoomIn').addEventListener('click', () => { zoom = Math.min(1.2, +(zoom + .1).toFixed(1)); preview.style.transform = `scale(${zoom})`; document.querySelector('#zoomValue').textContent = `${Math.round(zoom * 100)}%`; });
document.querySelector('#zoomOut').addEventListener('click', () => { zoom = Math.max(.8, +(zoom - .1).toFixed(1)); preview.style.transform = `scale(${zoom})`; document.querySelector('#zoomValue').textContent = `${Math.round(zoom * 100)}%`; });

input.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); syncPrintSheet(); setTimeout(() => window.print(), 100); }
  if (event.key === 'Tab') { event.preventDefault(); const start = input.selectionStart; input.value = `${input.value.slice(0, start)}  ${input.value.slice(input.selectionEnd)}`; input.selectionStart = input.selectionEnd = start + 2; updatePreview(); }
});

const savedContent = localStorage.getItem('md2pdf-content');
const savedName = localStorage.getItem('md2pdf-name');
input.value = savedContent || SAMPLE_MARKDOWN;
if (savedName) { outputName.value = savedName; fileName.textContent = `${savedName || 'untitled'}.md`; }
updatePreview();

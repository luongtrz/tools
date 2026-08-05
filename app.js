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
const shareButton = document.querySelector('#shareButton');
const shareModal = document.querySelector('#shareModal');
const shareLink = document.querySelector('#shareLink');
const roomCode = document.querySelector('#roomCode');
const roomStatus = document.querySelector('#roomStatus');
const presenceCount = document.querySelector('#presenceCount');
const collabName = document.querySelector('#collabName');
const collabStatus = document.querySelector('#collabStatus');
let collaboration = null;
let syncedMarkdown = '';
let applyingRemoteChange = false;
let toastTimer;
let zoom = 1;

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

function sanitizeRoomId(value) {
  return value && /^[a-zA-Z0-9_-]{8,32}$/.test(value) ? value : null;
}

function createRoomId() {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  }
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

let roomId = sanitizeRoomId(new URLSearchParams(window.location.search).get('room'));

function roomUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('room', roomId);
  return url.toString();
}

function updateRoomUrl() {
  window.history.replaceState({}, '', roomUrl());
  shareLink.value = roomUrl();
  roomCode.textContent = roomId;
}

function setCollabStatus(label, state = '') {
  collabStatus.className = `collab-status ${state}`.trim();
  collabStatus.innerHTML = `<span class="status-dot"></span> ${label}`;
  roomStatus.textContent = label;
}

function updatePresence() {
  if (!collaboration) return;
  const count = collaboration.provider.awareness.getStates().size;
  presenceCount.textContent = count === 1 ? 'Only you' : `${count} people online`;
  fileMeta.textContent = `Live room · ${count} ${count === 1 ? 'person' : 'people'} online`;
}

function applyRemoteMarkdown() {
  if (!collaboration) return;
  const nextValue = collaboration.ytext.toString();
  if (nextValue === syncedMarkdown) return;
  const selectionStart = input.selectionStart;
  const selectionEnd = input.selectionEnd;
  applyingRemoteChange = true;
  input.value = nextValue;
  syncedMarkdown = nextValue;
  updatePreview();
  input.setSelectionRange(Math.min(selectionStart, nextValue.length), Math.min(selectionEnd, nextValue.length));
  applyingRemoteChange = false;
}

function applyLocalMarkdown(nextValue) {
  if (!collaboration || applyingRemoteChange || nextValue === syncedMarkdown) return;
  const previousValue = syncedMarkdown;
  let start = 0;
  while (start < previousValue.length && start < nextValue.length && previousValue[start] === nextValue[start]) start += 1;
  let oldEnd = previousValue.length;
  let newEnd = nextValue.length;
  while (oldEnd > start && newEnd > start && previousValue[oldEnd - 1] === nextValue[newEnd - 1]) { oldEnd -= 1; newEnd -= 1; }
  const deletedLength = oldEnd - start;
  const insertedText = nextValue.slice(start, newEnd);
  collaboration.doc.transact(() => {
    if (deletedLength) collaboration.ytext.delete(start, deletedLength);
    if (insertedText) collaboration.ytext.insert(start, insertedText);
  }, 'local-input');
  syncedMarkdown = nextValue;
}

function collaboratorName() {
  return collabName.value.trim() || 'Guest writer';
}

async function startCollaboration({ seed = false } = {}) {
  if (!roomId) return null;
  if (collaboration?.roomId === roomId) return collaboration;
  if (collaboration) collaboration.provider.destroy();
  setCollabStatus('Connecting…', 'connecting');
  fileMeta.textContent = `Live room · ${roomId}`;
  updateRoomUrl();
  try {
    const [Y, { WebrtcProvider }] = await Promise.all([
      import('https://esm.sh/yjs@13.6.27?target=es2022'),
      import('https://esm.sh/y-webrtc@10.3.0?target=es2022&deps=yjs@13.6.27')
    ]);
    const doc = new Y.Doc();
    const provider = new WebrtcProvider(roomId, doc, {
      signaling: ['wss://signaling.yjs.dev'],
      password: roomId,
      maxConns: 20,
      filterBcConns: false
    });
    const ytext = doc.getText('markdown');
    collaboration = { roomId, doc, provider, ytext };
    syncedMarkdown = input.value;
    const initialText = input.value;
    ytext.observe(applyRemoteMarkdown);
    provider.awareness.setLocalStateField('user', { name: collaboratorName(), color: '#f2633d' });
    provider.awareness.on('change', updatePresence);
    provider.on('status', ({ status }) => {
      if (status === 'connected') setCollabStatus('Live · connected', 'live');
      if (status === 'disconnected') setCollabStatus('Offline · retrying', 'connecting');
      updatePresence();
    });
    if (seed && ytext.length === 0) {
      doc.transact(() => ytext.insert(0, initialText), 'initial-seed');
    }
    setCollabStatus('Live room', 'live');
    updatePresence();
    showToast('Đã mở live room — copy link để mời người khác');
    return collaboration;
  } catch (error) {
    console.error('Realtime collaboration failed', error);
    setCollabStatus('Connection failed');
    fileMeta.textContent = 'Markdown document · Local';
    showToast('Không thể kết nối realtime — hãy thử lại');
    return null;
  }
}

function openShareModal() {
  shareModal.hidden = false;
  shareModal.setAttribute('aria-hidden', 'false');
  shareLink.value = roomId ? roomUrl() : '';
  if (roomId) roomCode.textContent = roomId;
  collabName.focus();
}

function closeShareModal() {
  shareModal.hidden = true;
  shareModal.setAttribute('aria-hidden', 'true');
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

input.addEventListener('input', () => { updatePreview(); applyLocalMarkdown(input.value); });
input.addEventListener('scroll', () => { lineNumbers.scrollTop = input.scrollTop; });
document.querySelector('#pageSize').addEventListener('change', updateCommand);
document.querySelector('#orientation').addEventListener('change', updateCommand);
document.querySelector('#margins').addEventListener('change', updateCommand);
outputName.addEventListener('input', () => { fileName.textContent = `${outputName.value.trim() || 'untitled'}.md`; updateCommand(); localStorage.setItem('md2pdf-name', outputName.value); });

document.querySelector('#resetButton').addEventListener('click', () => { input.value = SAMPLE_MARKDOWN; outputName.value = 'project-brief'; fileName.textContent = 'project-brief.md'; updatePreview(); applyLocalMarkdown(input.value); showToast('Đã khôi phục tài liệu mẫu'); });
document.querySelector('#downloadMdButton').addEventListener('click', () => { const name = (outputName.value.trim() || 'document').replace(/[^a-zA-Z0-9_-]/g, '-'); downloadFile(`${name}.md`, input.value, 'text/markdown;charset=utf-8'); showToast('Đang tải Markdown…'); });
document.querySelector('#exportButton').addEventListener('click', () => { syncPrintSheet(); showToast('Mở hộp thoại in để lưu PDF'); setTimeout(() => window.print(), 250); });
document.querySelector('#copyCommand').addEventListener('click', async () => { try { await navigator.clipboard.writeText(commandText.textContent); showToast('Đã copy lệnh wkhtmltopdf'); } catch { showToast('Không thể copy tự động — hãy chọn lệnh'); } });
document.querySelector('#renameButton').addEventListener('click', () => { const nextName = window.prompt('Tên tài liệu', outputName.value || 'project-brief'); if (nextName !== null) { outputName.value = nextName.replace(/\.md$/i, ''); outputName.dispatchEvent(new Event('input')); } });
document.querySelector('#zoomIn').addEventListener('click', () => { zoom = Math.min(1.2, +(zoom + .1).toFixed(1)); preview.style.transform = `scale(${zoom})`; document.querySelector('#zoomValue').textContent = `${Math.round(zoom * 100)}%`; });
document.querySelector('#zoomOut').addEventListener('click', () => { zoom = Math.max(.8, +(zoom - .1).toFixed(1)); preview.style.transform = `scale(${zoom})`; document.querySelector('#zoomValue').textContent = `${Math.round(zoom * 100)}%`; });
shareButton.addEventListener('click', async () => {
  if (!roomId) {
    roomId = createRoomId();
    updateRoomUrl();
    await startCollaboration({ seed: true });
  } else {
    await startCollaboration();
  }
  openShareModal();
});
document.querySelector('#closeShare').addEventListener('click', closeShareModal);
document.querySelector('#doneShare').addEventListener('click', closeShareModal);
shareModal.addEventListener('click', (event) => { if (event.target === shareModal) closeShareModal(); });
document.querySelector('#copyShareLink').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(shareLink.value); showToast('Đã copy share link'); }
  catch { shareLink.select(); showToast('Đã chọn link — nhấn Ctrl/Cmd+C để copy'); }
});
collabName.addEventListener('input', () => {
  localStorage.setItem('md2pdf-collab-name', collabName.value);
  if (collaboration) collaboration.provider.awareness.setLocalStateField('user', { name: collaboratorName(), color: '#f2633d' });
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !shareModal.hidden) closeShareModal(); });

input.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); syncPrintSheet(); setTimeout(() => window.print(), 100); }
  if (event.key === 'Tab') { event.preventDefault(); const start = input.selectionStart; input.value = `${input.value.slice(0, start)}  ${input.value.slice(input.selectionEnd)}`; input.selectionStart = input.selectionEnd = start + 2; updatePreview(); applyLocalMarkdown(input.value); }
});

const savedContent = localStorage.getItem('md2pdf-content');
const savedName = localStorage.getItem('md2pdf-name');
collabName.value = localStorage.getItem('md2pdf-collab-name') || `Guest ${Math.floor(Math.random() * 90 + 10)}`;
input.value = savedContent || SAMPLE_MARKDOWN;
if (savedName) { outputName.value = savedName; fileName.textContent = `${savedName || 'untitled'}.md`; }
updatePreview();
if (roomId) {
  updateRoomUrl();
  void startCollaboration();
}

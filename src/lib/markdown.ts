export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

function renderInlineMarkdown(value: string): string {
  let html = escapeHtml(value);
  html = html.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,
    '<img alt="$1" src="$2">',
  );
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
  );
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  return html;
}

function markdownTableCells(line: string): string[] {
  let source = line.trim();
  if (source.startsWith("|")) source = source.slice(1);
  if (source.endsWith("|")) source = source.slice(0, -1);
  const cells: string[] = [];
  let cell = "";
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === "\\" && source[index + 1] === "|") {
      cell += "|";
      index += 1;
    } else if (character === "|") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function tableAlignment(separator: string): "left" | "center" | "right" | undefined {
  const trimmed = separator.trim();
  if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
  if (trimmed.endsWith(":")) return "right";
  if (trimmed.startsWith(":")) return "left";
  return undefined;
}

function isTableSeparator(line: string): boolean {
  const cells = markdownTableCells(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderMarkdownTable(header: string[], separator: string[], rows: string[][]): string {
  const columnCount = Math.max(header.length, ...rows.map((row) => row.length));
  const cell = (value: string, tag: "th" | "td", column: number): string => {
    const alignment = tableAlignment(separator[column] || "");
    const align = alignment ? ` align="${alignment}"` : "";
    return `<${tag}${align}>${renderInlineMarkdown(value)}</${tag}>`;
  };
  const normalizedHeader = Array.from({ length: columnCount }, (_, column) => header[column] || "");
  const head = `<thead><tr>${normalizedHeader.map((value, column) => cell(value, "th", column)).join("")}</tr></thead>`;
  const body = rows.length
    ? `<tbody>${rows.map((row) => `<tr>${Array.from({ length: columnCount }, (_, column) => cell(row[column] || "", "td", column)).join("")}</tr>`).join("")}</tbody>`
    : "";
  return `<table>${head}${body}</table>`;
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      output.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (listType) {
      output.push(`</${listType}>`);
      listType = null;
    }
  };

  const closeCode = () => {
    if (inCode) {
      output.push(
        `<pre><code class="language-${escapeHtml(codeLanguage)}">${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      inCode = false;
      codeLanguage = "";
      codeLines = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith("```")) {
      flushParagraph();
      closeList();
      if (!inCode) {
        inCode = true;
        codeLanguage = line.trim().slice(3);
      } else {
        closeCode();
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    const tableHeader = markdownTableCells(line);
    const tableSeparator = lines[index + 1] && markdownTableCells(lines[index + 1]);
    if (line.includes("|") && tableSeparator && isTableSeparator(lines[index + 1])) {
      flushParagraph();
      closeList();
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(markdownTableCells(lines[index]));
        index += 1;
      }
      output.push(renderMarkdownTable(tableHeader, tableSeparator, rows));
      index -= 1;
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      output.push(
        `<h${heading[1].length}>${renderInlineMarkdown(heading[2])}</h${heading[1].length}>`,
      );
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flushParagraph();
      closeList();
      output.push("<hr>");
      continue;
    }
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
      continue;
    }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const desiredType: "ul" | "ol" = unordered ? "ul" : "ol";
      if (listType !== desiredType) {
        closeList();
        output.push(`<${desiredType}>`);
        listType = desiredType;
      }
      const item = unordered?.[1] ?? ordered?.[1] ?? "";
      const task = item.match(/^\[([ xX])\]\s+(.+)$/);
      const taskMarkup = task
        ? `<input type="checkbox" disabled${task[1].toLowerCase() === "x" ? " checked" : ""}> `
        : "";
      output.push(`<li>${taskMarkup}${renderInlineMarkdown(task?.[2] || item)}</li>`);
      continue;
    }
    closeList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  closeCode();
  return (
    output.join("") ||
    '<p class="empty-state">Bắt đầu viết Markdown của bạn…</p>'
  );
}

export interface HtmlToMarkdownResult {
  markdown: string;
  warnings: string[];
  unsupported: { tag: string; count: number }[];
}

export function htmlToMarkdownAdvanced(input: string): HtmlToMarkdownResult {
  const document = new DOMParser().parseFromString(input, "text/html");
  const warnings: string[] = [];
  const unsupported = new Map<string, number>();

  function bumpUnsupported(tag: string): void {
    unsupported.set(tag, (unsupported.get(tag) ?? 0) + 1);
  }

  function inline(nodes: Node[]): string {
    return nodes.map((node) => inlineNode(node)).join("").trim();
  }

  function inlineNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || "").replace(/\s+/g, " ");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes);
    switch (tag) {
      case "strong":
      case "b":
        return `**${inline(children)}**`;
      case "em":
      case "i":
        return `*${inline(children)}*`;
      case "code":
        return `\`${el.textContent ?? ""}\``;
      case "a": {
        const href = el.getAttribute("href") || "";
        return `[${inline(children)}](${href})`;
      }
      case "br":
        return "\n";
      case "span":
        return inline(children);
      case "img": {
        const alt = el.getAttribute("alt") || "";
        const src = el.getAttribute("src") || "";
        return `![${alt}](${src})`;
      }
      default:
        return inline(children);
    }
  }

  function block(node: Node, depth = 0): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      return text ? `${text}\n\n` : "";
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes);

    switch (tag) {
      case "h1":
        return `# ${inline(children)}\n\n`;
      case "h2":
        return `## ${inline(children)}\n\n`;
      case "h3":
        return `### ${inline(children)}\n\n`;
      case "h4":
        return `#### ${inline(children)}\n\n`;
      case "h5":
        return `##### ${inline(children)}\n\n`;
      case "h6":
        return `###### ${inline(children)}\n\n`;
      case "p":
      case "div":
      case "section":
      case "article":
        return `${inline(children)}\n\n`;
      case "hr":
        return `---\n\n`;
      case "br":
        return "\n";
      case "blockquote":
        return (
          inline(children)
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n") + "\n\n"
        );
      case "ul":
      case "ol": {
        const ordered = tag === "ol";
        const items = Array.from(el.children)
          .filter((child) => child.tagName.toLowerCase() === "li")
          .map((item, index) => {
            const content = inline(Array.from(item.childNodes));
            const indent = "  ".repeat(Math.max(0, depth));
            return `${indent}${ordered ? `${index + 1}.` : "-"} ${content}`;
          })
          .join("\n");
        return `${items}\n\n`;
      }
      case "li":
        return `- ${inline(children)}\n`;
      case "pre": {
        const codeChild = el.querySelector("code");
        const code = codeChild
          ? codeChild.textContent ?? ""
          : el.textContent ?? "";
        return `\`\`\`\n${code}\n\`\`\`\n\n`;
      }
      case "table": {
        return `${convertTable(el)}\n\n`;
      }
      default: {
        bumpUnsupported(tag);
        return inline(children);
      }
    }
  }

  function convertTable(table: HTMLElement): string {
    const head = table.querySelector("thead");
    const body = table.querySelector("tbody") || table;
    const headerCells = head
      ? Array.from(head.querySelectorAll("th,td")).map((cell) =>
          inline(Array.from(cell.childNodes)),
        )
      : Array.from(body.querySelectorAll("tr"))
          .slice(0, 1)
          .flatMap((row) => Array.from(row.querySelectorAll("th,td")))
          .map((cell) => inline(Array.from(cell.childNodes)));
    const rows = Array.from(body.querySelectorAll("tr"))
      .filter((row) => !head || !head.contains(row))
      .map((row) =>
        Array.from(row.querySelectorAll("td,th")).map((cell) =>
          inline(Array.from(cell.childNodes)),
        ),
      );
    if (!headerCells.length && !rows.length) return "";
    const widths = headerCells.map((cell) => Math.max(3, cell.length));
    for (const row of rows) {
      row.forEach((cell, index) => {
        widths[index] = Math.max(widths[index] ?? 3, cell.length);
      });
    }
    const pad = (cell: string, width: number) =>
      cell.padEnd(width, " ");
    const headerLine = `| ${headerCells.map((cell, i) => pad(cell, widths[i] ?? 3)).join(" | ")} |`;
    const separatorLine = `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`;
    const bodyLines = rows.map(
      (row) =>
        `| ${row
          .map((cell, i) => pad(cell, widths[i] ?? 3))
          .join(" | ")} |`,
    );
    return [headerLine, separatorLine, ...bodyLines].join("\n");
  }

  const blocks: string[] = [];
  Array.from(document.body.childNodes).forEach((child) => {
    const md = block(child);
    if (md) blocks.push(md);
  });

  const markdown = blocks
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  for (const [tag, count] of unsupported) {
    warnings.push(`${count} × <${tag}> tag(s) were not converted`);
  }
  if (!markdown.trim()) {
    warnings.push("Input produced empty Markdown");
  }
  return { markdown, warnings, unsupported: Array.from(unsupported, ([tag, count]) => ({ tag, count })) };
}

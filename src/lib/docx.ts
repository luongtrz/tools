import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  type IParagraphOptions,
  type ParagraphChild,
} from "docx";

function inlineRuns(value: string): ParagraphChild[] {
  const runs: ParagraphChild[] = [];
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|(`([^`]+)`)|(\*([^*]+)\*)|(_([^_]+)_)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value))) {
    if (match.index > cursor) {
      runs.push(new TextRun(value.slice(cursor, match.index)));
    }
    if (match[2] && match[3]) {
      runs.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: match[2],
              style: "Hyperlink",
              color: "2563EB",
              underline: {},
            }),
          ],
          link: match[3],
        }),
      );
    } else if (match[5] || match[7]) {
      runs.push(new TextRun({ text: match[5] || match[7], bold: true }));
    } else if (match[9]) {
      runs.push(
        new TextRun({
          text: match[9],
          font: "Courier New",
          shading: { fill: "E2E8F0" },
        }),
      );
    } else if (match[11] || match[13]) {
      runs.push(new TextRun({ text: match[11] || match[13], italics: true }));
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) runs.push(new TextRun(value.slice(cursor)));
  return runs.length ? runs : [new TextRun("")];
}

function contentParagraph(value: string, options: IParagraphOptions = {}): Paragraph {
  return new Paragraph({
    ...options,
    children: inlineRuns(value),
  });
}

export async function markdownToDocxBlob(markdown: string, title: string): Promise<Blob> {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const children: Paragraph[] = [];
  let paragraphLines: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    children.push(contentParagraph(paragraphLines.join(" ")));
    paragraphLines = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      flushParagraph();
      if (inCode) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeLines.join("\n"),
                font: "Courier New",
                size: 20,
                color: "334155",
              }),
            ],
            indent: { left: 360, right: 360 },
          }),
        );
        codeLines = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) {
      codeLines.push(line);
      return;
    }
    if (!trimmed) {
      flushParagraph();
      return;
    }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3] as const;
      children.push(contentParagraph(heading[2], { heading: levels[heading[1].length - 1] }));
      return;
    }
    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      children.push(contentParagraph(unordered[1], { bullet: { level: 0 } }));
      return;
    }
    const ordered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      children.push(contentParagraph(`${ordered[1]}. ${ordered[2]}`));
      return;
    }
    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      children.push(
        new Paragraph({
          children: [new TextRun({ text: quote[1], italics: true, color: "64748B" })],
          indent: { left: 720 },
        }),
      );
      return;
    }
    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      children.push(new Paragraph({ children: [new TextRun("────────────────")] }));
      return;
    }
    paragraphLines.push(trimmed);
  });

  if (inCode && codeLines.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: codeLines.join("\n"), font: "Courier New", size: 20 })],
        indent: { left: 360, right: 360 },
      }),
    );
  }
  flushParagraph();

  const document = new Document({
    creator: "toolmd",
    title,
    description: "Document exported from toolmd Markdown tools.",
    sections: [{ children: children.length ? children : [contentParagraph("")] }],
  });
  return Packer.toBlob(document);
}

import type { IParagraphOptions, ParagraphChild } from "docx";

type DocxApi = typeof import("docx");
type DocxParagraph = InstanceType<DocxApi["Paragraph"]>;

function inlineRuns(value: string, api: DocxApi): ParagraphChild[] {
  const runs: ParagraphChild[] = [];
  const pattern = new RegExp(
    [
      "(\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\))",
      "(\\*\\*([^*]+)\\*\\*)",
      "(__([^_]+)__)",
      "(`([^`]+)`)",
      "(\\*([^*]+)\\*)",
      "(_([^_]+)_)",
    ].join("|"),
    "g",
  );
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value))) {
    if (match.index > cursor) {
      runs.push(new api.TextRun(value.slice(cursor, match.index)));
    }
    if (match[2] && match[3]) {
      runs.push(
        new api.ExternalHyperlink({
          children: [
            new api.TextRun({
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
      runs.push(new api.TextRun({ text: match[5] || match[7], bold: true }));
    } else if (match[9]) {
      runs.push(
        new api.TextRun({
          text: match[9],
          font: "Courier New",
          shading: { fill: "E2E8F0" },
        }),
      );
    } else if (match[11] || match[13]) {
      runs.push(new api.TextRun({ text: match[11] || match[13], italics: true }));
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) {
    runs.push(new api.TextRun(value.slice(cursor)));
  }
  return runs.length ? runs : [new api.TextRun("")];
}

function contentParagraph(
  value: string,
  api: DocxApi,
  options: IParagraphOptions = {},
): DocxParagraph {
  return new api.Paragraph({
    ...options,
    children: inlineRuns(value, api),
  });
}

export async function markdownToDocxBlob(
  markdown: string,
  title: string,
): Promise<Blob> {
  const api = await import("docx");
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const children: DocxParagraph[] = [];
  let paragraphLines: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    children.push(contentParagraph(paragraphLines.join(" "), api));
    paragraphLines = [];
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      flushParagraph();
      if (inCode) {
        children.push(
          new api.Paragraph({
            children: [
              new api.TextRun({
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
      const levels = [
        api.HeadingLevel.HEADING_1,
        api.HeadingLevel.HEADING_2,
        api.HeadingLevel.HEADING_3,
      ] as const;
      children.push(
        contentParagraph(heading[2], api, {
          heading: levels[heading[1].length - 1],
        }),
      );
      return;
    }
    const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      children.push(
        contentParagraph(unordered[1], api, { bullet: { level: 0 } }),
      );
      return;
    }
    const ordered = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      children.push(contentParagraph(`${ordered[1]}. ${ordered[2]}`, api));
      return;
    }
    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      children.push(
        new api.Paragraph({
          children: [
            new api.TextRun({
              text: quote[1],
              italics: true,
              color: "64748B",
            }),
          ],
          indent: { left: 720 },
        }),
      );
      return;
    }
    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      children.push(
        new api.Paragraph({
          children: [new api.TextRun("────────────────")],
        }),
      );
      return;
    }
    paragraphLines.push(trimmed);
  });

  if (inCode && codeLines.length) {
    children.push(
      new api.Paragraph({
        children: [
          new api.TextRun({
            text: codeLines.join("\n"),
            font: "Courier New",
            size: 20,
          }),
        ],
        indent: { left: 360, right: 360 },
      }),
    );
  }
  flushParagraph();

  const document = new api.Document({
    creator: "toolmd",
    title,
    description: "Document exported from toolmd Markdown tools.",
    sections: [
      {
        children: children.length ? children : [contentParagraph("", api)],
      },
    ],
  });
  return api.Packer.toBlob(document);
}

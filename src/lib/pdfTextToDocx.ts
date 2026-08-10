import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const DOCX_TWIPS_PER_POINT = 20;
const DOCX_MARGIN_TWIPS = 720;

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface PdfTextLine {
  items: PdfTextItem[];
  y: number;
  fontSize: number;
  minX: number;
}

export interface PdfTextToDocxOptions {
  title: string;
  onProgress?: (current: number, total: number) => void;
}

function isTextItem(item: unknown): item is PdfTextItem {
  if (!item || typeof item !== "object") return false;
  const candidate = item as Partial<PdfTextItem>;
  return (
    typeof candidate.str === "string" &&
    Array.isArray(candidate.transform) &&
    candidate.transform.length >= 6 &&
    typeof candidate.width === "number" &&
    typeof candidate.height === "number"
  );
}

function itemFontSize(item: PdfTextItem): number {
  const transformSize = Math.max(
    Math.abs(item.transform[0] || 0),
    Math.abs(item.transform[3] || 0),
  );
  return Math.max(1, transformSize || item.height || 10);
}

function groupTextItems(items: PdfTextItem[]): PdfTextLine[] {
  const sortedItems = [...items].sort(
    (left, right) => right.transform[5] - left.transform[5],
  );
  const lines: PdfTextLine[] = [];

  for (const item of sortedItems) {
    const y = item.transform[5];
    const fontSize = itemFontSize(item);
    const tolerance = Math.max(2, fontSize * 0.35);
    const line = lines.find(
      (candidate) => Math.abs(candidate.y - y) <= tolerance,
    );

    if (line) {
      line.items.push(item);
      line.fontSize = Math.max(line.fontSize, fontSize);
      line.minX = Math.min(line.minX, item.transform[4]);
    } else {
      lines.push({
        items: [item],
        y,
        fontSize,
        minX: item.transform[4],
      });
    }
  }

  return lines
    .map((line) => ({
      ...line,
      items: [...line.items].sort(
        (left, right) => left.transform[4] - right.transform[4],
      ),
    }))
    .sort((left, right) => right.y - left.y);
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function lineRuns(line: PdfTextLine, api: typeof import("docx")) {
  const runs: InstanceType<typeof api.TextRun>[] = [];
  let previousRight: number | null = null;
  let previousText = "";

  for (const item of line.items) {
    const text = normalizeText(item.str);
    if (!text) continue;

    const x = item.transform[4];
    const gap = previousRight === null ? 0 : x - previousRight;
    const shouldAddSpace =
      previousRight !== null &&
      gap > Math.max(1.5, itemFontSize(item) * 0.2) &&
      !/^[,.;:!?%)\]}]/u.test(text) &&
      !/[([{/$]$/u.test(previousText);
    const prefix = shouldAddSpace ? " " : "";

    runs.push(
      new api.TextRun({
        text: `${prefix}${text}`,
        size: Math.max(16, Math.min(96, Math.round(itemFontSize(item) * 2))),
      }),
    );
    previousRight = x + item.width;
    previousText = text;
  }

  return runs;
}

function pageSizeInTwips(points: number): number {
  return Math.max(1, Math.round(points * DOCX_TWIPS_PER_POINT));
}

function lineIndentInTwips(minX: number): number {
  return Math.max(
    0,
    Math.round(minX * DOCX_TWIPS_PER_POINT) - DOCX_MARGIN_TWIPS,
  );
}

export async function pdfTextPagesToDocxBlob(
  bytes: Uint8Array,
  options: PdfTextToDocxOptions,
): Promise<Blob> {
  if (!bytes.length) throw new Error("PDF bytes are required");

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const api = await import("docx");
  const sections: Array<{
    properties: Record<string, unknown>;
    children: InstanceType<typeof api.Paragraph>[];
  }> = [];
  let pagesWithText = 0;

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = content.items.filter((item) => isTextItem(item)) as PdfTextItem[];
      const lines = groupTextItems(items);
      const children = lines
        .map((line) => {
          const runs = lineRuns(line, api);
          if (!runs.length) return null;
          return new api.Paragraph({
            indent: { left: lineIndentInTwips(line.minX) },
            spacing: { before: 0, after: 0 },
            children: runs,
          });
        })
        .filter(
          (paragraph): paragraph is InstanceType<typeof api.Paragraph> =>
            paragraph !== null,
        );

      if (children.length) pagesWithText += 1;
      sections.push({
        properties: {
          page: {
            size: {
              width: pageSizeInTwips(viewport.width),
              height: pageSizeInTwips(viewport.height),
            },
            margin: {
              top: DOCX_MARGIN_TWIPS,
              right: DOCX_MARGIN_TWIPS,
              bottom: DOCX_MARGIN_TWIPS,
              left: DOCX_MARGIN_TWIPS,
              header: 0,
              footer: 0,
            },
          },
          type: api.SectionType.NEXT_PAGE,
        },
        children,
      });
      options.onProgress?.(pageNumber, pdf.numPages);
    }
  } finally {
    await pdf.cleanup();
  }

  if (!pagesWithText) {
    throw new Error(
      "This PDF has no extractable text layer. It may be scanned or image-only.",
    );
  }

  const document = new api.Document({
    creator: "toolmd",
    title: options.title,
    description: "Editable DOCX created from the PDF text layer.",
    sections,
  });
  return api.Packer.toBlob(document);
}

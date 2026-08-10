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

interface PdfEmbeddedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
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

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const [, encoded] = dataUrl.split(",", 2);
  if (!encoded) throw new Error("Extracted PDF image is empty");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function imagePixelsToRgba(
  data: ArrayLike<number>,
  width: number,
  height: number,
): Uint8ClampedArray | null {
  const pixelCount = width * height;
  if (data.length === pixelCount * 4) {
    return new Uint8ClampedArray(data);
  }

  if (data.length === pixelCount * 3) {
    const rgba = new Uint8ClampedArray(pixelCount * 4);
    for (let source = 0, target = 0; source < data.length; source += 3) {
      rgba[target++] = data[source];
      rgba[target++] = data[source + 1];
      rgba[target++] = data[source + 2];
      rgba[target++] = 255;
    }
    return rgba;
  }

  if (data.length === pixelCount) {
    const rgba = new Uint8ClampedArray(pixelCount * 4);
    for (let source = 0, target = 0; source < data.length; source += 1) {
      const value = data[source];
      rgba[target++] = value;
      rgba[target++] = value;
      rgba[target++] = value;
      rgba[target++] = 255;
    }
    return rgba;
  }

  const packedRowLength = Math.ceil(width / 8);
  if (data.length === packedRowLength * height) {
    const rgba = new Uint8ClampedArray(pixelCount * 4);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const packed = data[y * packedRowLength + Math.floor(x / 8)];
        const value = packed & (1 << (7 - (x % 8))) ? 0 : 255;
        const target = (y * width + x) * 4;
        rgba[target] = value;
        rgba[target + 1] = value;
        rgba[target + 2] = value;
        rgba[target + 3] = 255;
      }
    }
    return rgba;
  }

  return null;
}

function imageObjectToPng(image: unknown): PdfEmbeddedImage | null {
  if (!image || typeof image !== "object") return null;
  const candidate = image as {
    bitmap?: CanvasImageSource & { close?: () => void };
    data?: ArrayLike<number>;
    width?: number;
    height?: number;
  };
  const width = Math.round(candidate.width || 0);
  const height = Math.round(candidate.height || 0);
  if (width <= 0 || height <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  if (candidate.bitmap) {
    context.drawImage(candidate.bitmap, 0, 0, width, height);
    candidate.bitmap.close?.();
  } else if (candidate.data) {
    const rgba = imagePixelsToRgba(candidate.data, width, height);
    if (!rgba) return null;
    const imageData = new Uint8ClampedArray(new ArrayBuffer(rgba.length));
    imageData.set(rgba);
    context.putImageData(new ImageData(imageData, width, height), 0, 0);
  } else {
    return null;
  }

  return {
    bytes: dataUrlToBytes(canvas.toDataURL("image/png")),
    width,
    height,
  };
}

function resolvePageObject(
  objects: { get: (name: string, callback: (value: unknown) => void) => unknown },
  name: string,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => resolve(null), 2000);
    const finish = (value: unknown) => {
      window.clearTimeout(timeout);
      resolve(value);
    };
    try {
      const value = objects.get(name, finish);
      if (value) finish(value);
    } catch (error) {
      window.clearTimeout(timeout);
      reject(error);
    }
  });
}

async function extractPageImages(
  page: unknown,
  pdfjs: typeof import("pdfjs-dist"),
): Promise<PdfEmbeddedImage[]> {
  const pdfPage = page as {
    getViewport: (options: { scale: number }) => {
      width: number;
      height: number;
    };
    render: (options: {
      canvas: HTMLCanvasElement;
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<unknown> };
    getOperatorList: () => Promise<{
      fnArray: number[];
      argsArray: unknown[][];
    }>;
    objs: {
      get: (name: string, callback: (value: unknown) => void) => unknown;
    };
    commonObjs: {
      get: (name: string, callback: (value: unknown) => void) => unknown;
    };
  };
  const extractionViewport = pdfPage.getViewport({ scale: 0.01 });
  const extractionCanvas = document.createElement("canvas");
  extractionCanvas.width = Math.max(1, Math.ceil(extractionViewport.width));
  extractionCanvas.height = Math.max(1, Math.ceil(extractionViewport.height));
  const extractionContext = extractionCanvas.getContext("2d");
  if (!extractionContext) return [];
  await pdfPage.render({
    canvas: extractionCanvas,
    canvasContext: extractionContext,
    viewport: extractionViewport,
  }).promise;
  const operatorList = await pdfPage.getOperatorList();
  const imageNames: string[] = [];
  const inlineImages: unknown[] = [];
  const imageOperations = new Set([
    pdfjs.OPS.paintImageXObject,
    pdfjs.OPS.paintImageXObjectRepeat,
  ]);

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const operation = operatorList.fnArray[index];
    const args = operatorList.argsArray[index] || [];
    if (operation === pdfjs.OPS.paintInlineImageXObject) {
      inlineImages.push(args[0]);
    } else if (imageOperations.has(operation) && typeof args[0] === "string") {
      imageNames.push(args[0]);
    }
  }

  const imageObjects = [
    ...inlineImages,
    ...(await Promise.all(
      imageNames.map((name) =>
        resolvePageObject(
          name.startsWith("g_") ? pdfPage.commonObjs : pdfPage.objs,
          name,
        ),
      ),
    )),
  ];
  return imageObjects
    .map(imageObjectToPng)
    .filter((image): image is PdfEmbeddedImage => image !== null);
}

function imageSizeInPixels(
  image: PdfEmbeddedImage,
  pageWidthPoints: number,
): { width: number; height: number } {
  const contentWidthPoints =
    pageWidthPoints - (DOCX_MARGIN_TWIPS / DOCX_TWIPS_PER_POINT) * 2;
  const maxWidthPixels = Math.max(
    1,
    Math.round((contentWidthPoints / 72) * 96),
  );
  const width = Math.min(image.width, maxWidthPixels);
  return {
    width,
    height: Math.max(1, Math.round((image.height / image.width) * width)),
  };
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
      const items = content.items.filter((item) =>
        isTextItem(item),
      ) as PdfTextItem[];
      const lines = groupTextItems(items);
      const textChildren = lines
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
      const children = [...textChildren];
      const embeddedImages = await extractPageImages(page, pdfjs);
      for (const [imageIndex, image] of embeddedImages.entries()) {
        const size = imageSizeInPixels(image, viewport.width);
        children.push(
          new api.Paragraph({
            alignment: api.AlignmentType.CENTER,
            spacing: { before: 120, after: 120 },
            children: [
              new api.ImageRun({
                type: "png",
                data: image.bytes,
                transformation: size,
                altText: {
                  name: `PDF page ${pageNumber} image ${imageIndex + 1}`,
                  description: `Extracted image ${imageIndex + 1} from PDF page ${pageNumber}`,
                },
              }),
            ],
          }),
        );
      }

      if (textChildren.length) pagesWithText += 1;
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
    description: "Editable DOCX with PDF text and extracted images.",
    sections,
  });
  return api.Packer.toBlob(document);
}

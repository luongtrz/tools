import type { PdfPagePreview } from "@/lib/pdfRender";

const PDF_POINTS_PER_INCH = 72;
const DOCX_IMAGE_PIXELS_PER_INCH = 96;
const DOCX_TWIPS_PER_POINT = 20;

export interface PdfToDocxOptions {
  renderScale: number;
  title: string;
}

function dataUrlToBytes(dataUrl: string): {
  bytes: Uint8Array;
  type: "jpg" | "png";
} {
  const [header, encoded] = dataUrl.split(",", 2);
  if (!encoded) throw new Error("Rendered page image is empty");
  const type = header.includes("image/png") ? "png" : "jpg";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return { bytes, type };
}

function pageSizeInTwips(
  pixels: number,
  renderScale: number,
): number {
  const points = pixels / renderScale;
  return Math.max(1, Math.round(points * DOCX_TWIPS_PER_POINT));
}

function imageSizeInPixels(
  pixels: number,
  renderScale: number,
): number {
  const points = pixels / renderScale;
  return Math.max(
    1,
    Math.round(
      (points / PDF_POINTS_PER_INCH) * DOCX_IMAGE_PIXELS_PER_INCH,
    ),
  );
}

export async function pdfPagesToDocxBlob(
  pages: PdfPagePreview[],
  options: PdfToDocxOptions,
): Promise<Blob> {
  if (
    !pages.length ||
    !Number.isFinite(options.renderScale) ||
    options.renderScale <= 0
  ) {
    throw new Error("PDF pages are required");
  }

  const failedPages = pages
    .filter((page) => !page.src)
    .map((page) => page.pageNumber);
  if (failedPages.length) {
    throw new Error(`Pages failed to render: ${failedPages.join(", ")}`);
  }

  /*
   * PDF text may only contain positioned glyphs and CMaps, not source text or
   * semantic math. Keeping rendered pixels avoids Word font substitution and
   * layout reflow when the document is opened on another machine.
   */
  const api = await import("docx");
  const sections = pages.map((page) => {
    const source = page.src;
    if (!source) throw new Error("Rendered page image is empty");
    const image = dataUrlToBytes(source);
    const pageWidth = pageSizeInTwips(page.width, options.renderScale);
    const pageHeight = pageSizeInTwips(page.height, options.renderScale);

    return {
      properties: {
        page: {
          size: { width: pageWidth, height: pageHeight },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
        type: api.SectionType.NEXT_PAGE,
      },
      children: [
        new api.Paragraph({
          alignment: api.AlignmentType.CENTER,
          indent: { left: 0, right: 0, firstLine: 0 },
          spacing: {
            before: 0,
            after: 0,
            line: 1,
            lineRule: api.LineRuleType.EXACT,
          },
          children: [
            new api.ImageRun({
              type: image.type,
              data: image.bytes,
              transformation: {
                width: imageSizeInPixels(page.width, options.renderScale),
                height: imageSizeInPixels(page.height, options.renderScale),
              },
              altText: {
                name: `PDF page ${page.pageNumber}`,
                description: `Rendered image of PDF page ${page.pageNumber}`,
              },
            }),
          ],
        }),
      ],
    };
  });

  const document = new api.Document({
    creator: "toolmd",
    title: options.title,
    description: "Visual PDF conversion; each page is a rendered image.",
    sections,
  });
  return api.Packer.toBlob(document);
}

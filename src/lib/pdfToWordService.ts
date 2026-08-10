const PDF_TO_WORD_ENDPOINT = (
  import.meta.env.VITE_PDF_TO_WORD_URL as string | undefined
)?.trim();

export function hasSemanticPdfToWordEndpoint(): boolean {
  return Boolean(PDF_TO_WORD_ENDPOINT);
}

export async function convertPdfToEditableDocx(
  file: Blob,
  fileName: string,
): Promise<Blob> {
  if (!PDF_TO_WORD_ENDPOINT) {
    throw new Error("The local PDF to Word service is not configured");
  }

  const formData = new FormData();
  formData.append("file", file, fileName);
  const response = await fetch(PDF_TO_WORD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "The local PDF to Word service could not convert this file";
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) detail = payload.detail;
    } catch {
      // Keep the generic error when the service did not return JSON.
    }
    throw new Error(detail);
  }

  const contentType = response.headers.get("content-type") || "";
  if (
    !contentType.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
  ) {
    throw new Error("The local service returned an invalid DOCX response");
  }

  return response.blob();
}

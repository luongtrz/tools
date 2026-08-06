export type Base64Variant = "standard" | "url" | "url-nopad";

export type Base64EncodeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function encodeBase64(
  text: string,
  variant: Base64Variant = "standard",
): Base64EncodeResult {
  try {
    if (typeof TextEncoder === "function") {
      const bytes = new TextEncoder().encode(text);
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const encoded = btoa(binary);
      return { ok: true, value: applyVariant(encoded, variant) };
    }
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return { ok: true, value: applyVariant(encoded, variant) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function decodeBase64(
  text: string,
  variant: Base64Variant = "standard",
): Base64EncodeResult {
  try {
    const sanitized = applyVariantReverse(text.trim(), variant);
    if (!sanitized) return { ok: true, value: "" };
    const binary = atob(sanitized);
    if (typeof TextDecoder === "function") {
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      return { ok: true, value: new TextDecoder().decode(bytes) };
    }
    return {
      ok: true,
      value: decodeURIComponent(escape(binary)),
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

function applyVariant(encoded: string, variant: Base64Variant): string {
  if (variant === "standard") return encoded;
  const swapped = encoded.replace(/\+/g, "-").replace(/\//g, "_");
  if (variant === "url") return swapped;
  return swapped.replace(/=+$/, "");
}

function applyVariantReverse(value: string, variant: Base64Variant): string {
  if (variant === "standard") return value;
  let swapped = value.replace(/-/g, "+").replace(/_/g, "/");
  if (variant === "url") {
    const pad = swapped.length % 4 === 0 ? "" : "=".repeat(4 - (swapped.length % 4));
    return swapped + pad;
  }
  const pad = swapped.length % 4 === 0 ? "" : "=".repeat(4 - (swapped.length % 4));
  return swapped + pad;
}

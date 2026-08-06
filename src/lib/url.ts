export interface UrlQueryRow {
  key: string;
  value: string;
  encodedKey: string;
  encodedValue: string;
}

export type UrlMode = "component" | "full" | "form";

export function encodeUrl(value: string, mode: UrlMode): string {
  switch (mode) {
    case "component":
      return encodeURIComponent(value);
    case "full":
      return encodeURI(value);
    case "form":
      return encodeURIComponent(value).replace(/%20/g, "+");
    default:
      return value;
  }
}

export type UrlDecodeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function decodeUrl(value: string, mode: UrlMode): UrlDecodeResult {
  try {
    let next = value;
    if (mode === "form") {
      next = value.replace(/\+/g, " ");
    }
    return {
      ok: true,
      value: mode === "full" ? decodeURI(next) : decodeURIComponent(next),
    };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export function parseQueryString(query: string): UrlQueryRow[] {
  const trimmed = query.replace(/^\?/, "");
  if (!trimmed) return [];
  return trimmed.split("&").filter(Boolean).map((pair) => {
    const [rawKey, ...rest] = pair.split("=");
    const rawValue = rest.join("=");
    return {
      key: safeDecode(rawKey),
      value: safeDecode(rawValue),
      encodedKey: rawKey,
      encodedValue: rawValue,
    };
  });
}

export function rowsToQuery(rows: UrlQueryRow[]): string {
  if (!rows.length) return "";
  return rows
    .map((row) =>
      row.encodedKey
        ? `${row.encodedKey}=${row.encodedValue}`
        : "",
    )
    .filter(Boolean)
    .join("&");
}

function safeDecode(value: string | undefined): string {
  if (!value) return "";
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

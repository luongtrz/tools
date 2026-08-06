export interface JsonError {
  message: string;
  line: number;
  column: number;
}

export function tryParseJson(text: string): {
  ok: true;
  value: unknown;
} | {
  ok: false;
  error: JsonError;
} {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return {
      ok: false,
      error: extractJsonError(error as Error, text),
    };
  }
}

function extractJsonError(error: Error, text: string): JsonError {
  const message = error.message.replace(/^JSON\.parse:?\s*/, "");
  const match = /position\s+(\d+)/i.exec(message) ??
    /at\s+position\s+(\d+)/i.exec(message);
  let line = 1;
  let column = 1;
  if (match) {
    const position = Number(match[1]);
    const upTo = text.slice(0, position);
    const lines = upTo.split("\n");
    line = lines.length;
    column = (lines[lines.length - 1] ?? "").length + 1;
  } else {
    const lineMatch = /line\s+(\d+)/i.exec(message);
    if (lineMatch) line = Number(lineMatch[1]);
  }
  return { message, line, column };
}

export function formatJson(value: unknown, indent: number | "\t"): string {
  return JSON.stringify(value, null, indent);
}

export function jsonToQueryString(value: unknown, prefix = ""): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => jsonToQueryString(item, prefix))
      .filter(Boolean)
      .join("&");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => jsonToQueryString(val, prefix ? `${prefix}[${key}]` : key))
      .filter(Boolean)
      .join("&");
  }
  return `${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`;
}

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

export type CsvParseError = { message: string };

const DELIMITERS = [",", "\t", ";"] as const;
type Delimiter = (typeof DELIMITERS)[number];

function detectDelimiter(text: string): Delimiter {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  let best: Delimiter = ",";
  let bestCount = -1;
  for (const d of DELIMITERS) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

function parseLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuote = true;
      continue;
    }
    if (ch === delimiter) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

export function parseCsv(
  text: string,
  delimiter?: string,
): CsvParseResult | CsvParseError {
  const trimmed = text.replace(/^\uFEFF/, "");
  if (!trimmed.trim()) {
    return { headers: [], rows: [], delimiter: "," };
  }
  const chosen = (delimiter as Delimiter | undefined) ?? detectDelimiter(trimmed);
  const records: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuote = false;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (inQuote) {
      if (ch === '"' && trimmed[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuote = true;
      continue;
    }
    if (ch === chosen) {
      current.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      current.push(cell);
      records.push(current);
      current = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.length || current.length) {
    current.push(cell);
    records.push(current);
  }
  if (!records.length) {
    return { headers: [], rows: [], delimiter: chosen };
  }
  const headers = records[0].map((h) => h.trim());
  const rows = records.slice(1).map((r) => {
    const padded = r.slice();
    while (padded.length < headers.length) padded.push("");
    return padded.slice(0, headers.length);
  });
  return { headers, rows, delimiter: chosen };
}

export function objectsToCsv(
  records: Record<string, unknown>[],
  headers?: string[],
): string {
  if (!records.length && !headers?.length) return "";
  const cols = headers ?? collectHeaders(records);
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    if (/[",\r\n\t;]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };
  const lines = [cols.map(escape).join(",")];
  for (const record of records) {
    lines.push(cols.map((col) => escape(record[col])).join(","));
  }
  return lines.join("\n");
}

function collectHeaders(records: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }
  }
  return order;
}

export function csvToObjects(text: string, delimiter?: string): {
  ok: true;
  data: Record<string, string>[];
  headers: string[];
  delimiter: string;
} | {
  ok: false;
  error: string;
} {
  const parsed = parseCsv(text, delimiter);
  if ("message" in parsed) {
    return { ok: false, error: parsed.message };
  }
  const dupes = findDuplicateHeaders(parsed.headers);
  if (dupes.length) {
    return {
      ok: false,
      error: `Duplicate header column(s): ${dupes.join(", ")}`,
    };
  }
  const data = parsed.rows.map((row) => {
    const object: Record<string, string> = {};
    parsed.headers.forEach((header, index) => {
      object[header] = row[index] ?? "";
    });
    return object;
  });
  return {
    ok: true,
    data,
    headers: parsed.headers,
    delimiter: parsed.delimiter,
  };
}

function findDuplicateHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  const dupes = new Set<string>();
  for (const header of headers) {
    const key = header.trim();
    if (!key) continue;
    seen.set(key, (seen.get(key) ?? 0) + 1);
    if ((seen.get(key) ?? 0) > 1) dupes.add(key);
  }
  return Array.from(dupes);
}

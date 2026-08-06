export type Alignment = "left" | "center" | "right";

export interface ParsedTable {
  headers: string[];
  alignments: Alignment[];
  rows: string[][];
}

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

const ALIGNMENT_PATTERN = /^:?-{3,}:?$/;

export function parseMarkdownTable(
  input: string,
): { ok: true; table: ParsedTable } | { ok: false; error: ParseError } {
  const lines = input
    .split(/\r?\n/)
    .filter((line) => line.includes("|"));
  if (lines.length < 2) {
    return {
      ok: false,
      error: { message: "Table needs header and separator", line: 1, column: 1 },
    };
  }
  const headerCells = splitRow(lines[0]);
  const separatorCells = splitRow(lines[1]);
  if (
    separatorCells.length === 0 ||
    !separatorCells.every((cell) => ALIGNMENT_PATTERN.test(cell.trim()))
  ) {
    return {
      ok: false,
      error: {
        message: "Separator row is not a valid Markdown table separator",
        line: 2,
        column: 1,
      },
    };
  }
  const alignments = separatorCells.map<Alignment>((cell) => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(":") && trimmed.endsWith(":")) return "center";
    if (trimmed.endsWith(":")) return "right";
    return "left";
  });
  const columnCount = Math.max(headerCells.length, alignments.length);
  const normalizedHeaders = padArray(headerCells, columnCount, "");
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i += 1) {
    const cells = padArray(splitRow(lines[i]), columnCount, "");
    rows.push(cells);
  }
  return {
    ok: true,
    table: {
      headers: normalizedHeaders,
      alignments,
      rows,
    },
  };
}

export function formatMarkdownTable(
  table: ParsedTable,
  options: { padded?: boolean } = {},
): string {
  const { padded = true } = options;
  const columnCount = Math.max(
    table.headers.length,
    ...table.rows.map((row) => row.length),
  );
  const headers = padArray(table.headers, columnCount, "");
  const alignments = padArray(table.alignments, columnCount, "left" as Alignment);
  const rows = table.rows.map((row) => padArray(row, columnCount, ""));
  const widths = Array.from({ length: columnCount }, (_, index) =>
    Math.max(
      3,
      headers[index].length,
      ...rows.map((row) => (row[index] ?? "").length),
    ),
  );
  const padCell = (cell: string, index: number, align: Alignment) => {
    if (!padded) return cell;
    const width = widths[index];
    if (align === "right") return cell.padStart(width, " ");
    if (align === "center") {
      const total = width - cell.length;
      const left = Math.floor(total / 2);
      return `${" ".repeat(left)}${cell}${" ".repeat(total - left)}`;
    }
    return cell.padEnd(width, " ");
  };
  const headerLine = `| ${headers
    .map((cell, i) => padCell(cell, i, alignments[i]))
    .join(" | ")} |`;
  const separatorLine = `| ${alignments
    .map((align, i) => {
      const width = widths[i];
      if (align === "center") return `:${"-".repeat(width - 2)}:`;
      if (align === "right") return `${"-".repeat(width - 1)}:`;
      return "-".repeat(width);
    })
    .join(" | ")} |`;
  const bodyLines = rows.map(
    (row) =>
      `| ${row
        .map((cell, i) => padCell(cell, i, alignments[i]))
        .join(" | ")} |`,
  );
  return [headerLine, separatorLine, ...bodyLines].join("\n");
}

export function updateTableAlignment(
  table: ParsedTable,
  column: number,
  alignment: Alignment,
): ParsedTable {
  const next = table.alignments.slice();
  next[column] = alignment;
  return { ...table, alignments: next };
}

function splitRow(line: string): string[] {
  const trimmed = line.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
  const cells: string[] = [];
  let current = "";
  let inCode = false;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (inCode) {
      if (ch === "`" && trimmed[i + 1] !== "`") {
        inCode = false;
      }
      current += ch;
      continue;
    }
    if (ch === "\\" && trimmed[i + 1] === "|") {
      current += "|";
      i += 1;
      continue;
    }
    if (ch === "`") {
      inCode = true;
      current += ch;
      continue;
    }
    if (ch === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function padArray<T>(array: T[], length: number, fill: T): T[] {
  const next = array.slice(0, length);
  while (next.length < length) next.push(fill);
  return next;
}

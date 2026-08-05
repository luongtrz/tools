import YAML from "yaml";
import { diffLines } from "../src/lib/diff";
import { renderMarkdown } from "../src/lib/markdown";
import { randomString } from "../src/lib/random";
import { TOOL_REGISTRY } from "../src/toolRegistry";

export type JsonValue = string | number | boolean | null | JsonValue[] | {
  [key: string]: JsonValue;
};

export function catalog() {
  return TOOL_REGISTRY.map(({ slug, title, description, category }) => ({
    slug,
    title,
    description,
    category,
    url: `https://toolmd.pages.dev/${slug}/`,
  }));
}

export function markdownRender(markdown: string) {
  return {
    html: renderMarkdown(markdown),
    stats: markdownStats(markdown),
  };
}

export function markdownStats(markdown: string) {
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  return {
    words,
    characters: markdown.length,
    lines: markdown ? markdown.split(/\r?\n/).length : 0,
    readingMinutes: words ? Math.ceil(words / 220) : 0,
  };
}

export function formatJson(value: string): { valid: boolean; result: string } {
  if (!value.trim()) return { valid: false, result: "Input is empty." };
  try {
    return { valid: true, result: JSON.stringify(JSON.parse(value), null, 2) };
  } catch (error) {
    return {
      valid: false,
      result: `JSON error: ${error instanceof Error ? error.message : "Invalid JSON"}`,
    };
  }
}

export function validateJson(value: string) {
  if (!value.trim()) return { valid: false, message: "Input is empty." };
  try {
    JSON.parse(value);
    return { valid: true, message: "Valid JSON ✓" };
  } catch (error) {
    return {
      valid: false,
      message: `Invalid JSON: ${error instanceof Error ? error.message : "parse error"}`,
    };
  }
}

export function diffJson(first: string, second: string) {
  try {
    const rows = diffLines(
      JSON.stringify(JSON.parse(first), null, 2),
      JSON.stringify(JSON.parse(second), null, 2),
    );
    return {
      valid: true,
      result:
        rows
          .map((row) => `${row.type === "added" ? "+" : row.type === "removed" ? "-" : " "} ${row.text}`)
          .join("\n") || "  (no changes)",
    };
  } catch {
    return { valid: false, result: "Both inputs must be valid JSON before comparing." };
  }
}

export function convertYamlJson(value: string, direction: "yaml-to-json" | "json-to-yaml") {
  if (!value.trim()) return { valid: false, result: "Input is empty." };
  try {
    const parsed = direction === "yaml-to-json" ? YAML.parse(value) : JSON.parse(value);
    return {
      valid: true,
      result: direction === "yaml-to-json" ? JSON.stringify(parsed, null, 2) : YAML.stringify(parsed),
    };
  } catch (error) {
    return {
      valid: false,
      result: `Conversion error: ${error instanceof Error ? error.message : "invalid input"}`,
    };
  }
}

function parseCsv(value: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"') {
      if (quoted && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && value[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (quoted) throw new Error("Unclosed quoted field.");
  return rows.filter((item) => item.some((cell) => cell.length));
}

function stringifyCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell).join(","))
    .join("\n");
}

export function convertCsvJson(value: string, direction: "csv-to-json" | "json-to-csv") {
  try {
    if (!value.trim()) return { valid: false, result: "Input is empty." };
    if (direction === "csv-to-json") {
      const rows = parseCsv(value);
      const headers = rows[0] || [];
      if (!headers.length) return { valid: false, result: "CSV headers are required." };
      return {
        valid: true,
        result: JSON.stringify(rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))), null, 2),
      };
    }
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "object" && item !== null)) {
      return { valid: false, result: "JSON must be an array of objects." };
    }
    const objects = parsed as Record<string, unknown>[];
    const headers = Array.from(new Set(objects.flatMap((item) => Object.keys(item))));
    return {
      valid: true,
      result: stringifyCsv([headers, ...objects.map((item) => headers.map((header) => String(item[header] ?? "")))]),
    };
  } catch (error) {
    return {
      valid: false,
      result: `Conversion error: ${error instanceof Error ? error.message : "invalid input"}`,
    };
  }
}

export function generateMarkdownTable(headers: string, rowCount: number) {
  const cleanHeaders = headers.split(",").map((header, index) => header.trim() || `Column ${index + 1}`);
  const separator = cleanHeaders.map(() => "---");
  const rows = Array.from({ length: Math.max(1, Math.min(30, rowCount)) }, (_, row) => cleanHeaders.map((_, column) => `Value ${row + 1}.${column + 1}`));
  return [cleanHeaders, separator, ...rows].map((row) => `| ${row.join(" | ")} |`).join("\n");
}

function markdownTableRows(value: string): string[][] {
  return value
    .split("\n")
    .filter((line) => line.includes("|"))
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()));
}

function isMarkdownTable(value: string): boolean {
  const rows = markdownTableRows(value);
  return rows.length >= 2 && rows[1].length > 0 && rows[1].every((cell) => /^:?-{3,}:?$/.test(cell));
}

export function formatMarkdownTable(value: string): string {
  const rows = markdownTableRows(value);
  if (rows.length < 2) return value;
  if (!isMarkdownTable(value)) return value;
  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row, index) => Array.from({ length: columnCount }, (_, column) => index === 1 ? row[column] || "---" : row[column] || ""));
  const widths = Array.from({ length: columnCount }, (_, column) => Math.max(3, ...normalized.map((row) => row[column].length)));
  return normalized.map((row) => `| ${row.map((cell, column) => cell.padEnd(widths[column])).join(" | ")} |`).join("\n");
}

export function diffText(left: string, right: string) {
  return diffLines(left, right);
}

export function testRegex(pattern: string, flags: string, value: string) {
  try {
    const regex = new RegExp(pattern, flags);
    const matches = flags.includes("g") ? Array.from(value.matchAll(regex)).map((match) => match[0]) : (value.match(regex) || []).slice(0, 1);
    return { valid: true, matches };
  } catch (error) {
    return { valid: false, matches: [], error: error instanceof Error ? error.message : "Invalid regex" };
  }
}

export function base64(value: string, direction: "encode" | "decode") {
  try {
    if (direction === "encode") return { valid: true, result: Buffer.from(value, "utf8").toString("base64") };
    const normalized = value.trim();
    if (!normalized || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) || normalized.length % 4 === 1) {
      return { valid: false, result: "Invalid Base64 input" };
    }
    const decoded = Buffer.from(normalized, "base64");
    const canonical = decoded.toString("base64").replace(/=+$/, "");
    if (canonical !== normalized.replace(/=+$/, "")) return { valid: false, result: "Invalid Base64 input" };
    return { valid: true, result: decoded.toString("utf8") };
  } catch {
    return { valid: false, result: "Invalid Base64 input" };
  }
}

export function convertCase(value: string, mode: "upper" | "lower" | "title" | "camel" | "snake" | "kebab") {
  const tokens = value.trim().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (mode === "upper") return value.toUpperCase();
  if (mode === "lower") return value.toLowerCase();
  if (mode === "title") return tokens.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  if (mode === "camel") return tokens.map((word, index) => index ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join("");
  return tokens.map((word) => word.toLowerCase()).join(mode === "snake" ? "_" : "-");
}

export function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function createUuid(): string {
  return crypto.randomUUID();
}

export function createPassword(length: number, symbols: boolean): string {
  const alphabet = `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789${symbols ? "!@#$%^&*_-+=" : ""}`;
  return randomString(Math.max(8, Math.min(128, length)), alphabet);
}

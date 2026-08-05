import { useMemo, useState } from "react";
import YAML from "yaml";
import {
  CopyButton,
  ToolButton,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

const SAMPLE_JSON =
  '{"name":"toolmd","tools":["md2pdf","md2word"],"private":true}';

type JsonMode = "format" | "validate" | "diff";

export function JsonTool({ mode }: { mode: JsonMode }) {
  const [value, setValue] = useState(SAMPLE_JSON);
  const [compare, setCompare] = useState(
    '{"name":"toolmd","tools":["md2pdf","md2word","md2pptx"],"private":true}',
  );
  const result = useMemo(() => {
    if (mode === "diff") return diffJson(value, compare);
    try {
      const parsed: unknown = JSON.parse(value);
      return mode === "format"
        ? JSON.stringify(parsed, null, 2)
        : "Valid JSON ✓";
    } catch (error) {
      return mode === "format"
        ? `JSON error: ${error instanceof Error ? error.message : "Invalid JSON"}`
        : `Invalid JSON: ${error instanceof Error ? error.message : "parse error"}`;
    }
  }, [compare, mode, value]);
  const slug =
    mode === "format"
      ? "json-formatter"
      : mode === "validate"
        ? "json-validator"
        : "json-diff";
  return (
    <ToolPage slug={slug}>
      <div className={mode === "diff" ? toolStyles.splitLayout : ""}>
        {mode === "diff" && (
          <ToolPanel title="JSON A">
            <ToolTextArea
              value={value}
              onChange={setValue}
              ariaLabel="First JSON"
              rows={18}
            />
          </ToolPanel>
        )}
        {mode === "diff" && (
          <ToolPanel title="JSON B">
            <ToolTextArea
              value={compare}
              onChange={setCompare}
              ariaLabel="Second JSON"
              rows={18}
            />
          </ToolPanel>
        )}
        {mode !== "diff" && (
          <ToolPanel
            title={mode === "format" ? "JSON input" : "Validate JSON"}
            description="Paste JSON and run it locally in your browser."
          >
            <ToolTextArea
              value={value}
              onChange={setValue}
              ariaLabel="JSON input"
              rows={18}
            />
            <div className={toolStyles.panelActions}>
              <ToolButton
                onClick={() => setValue(mode === "format" ? result : value)}
              >
                {mode === "format" ? "Format JSON" : "Check JSON"}
              </ToolButton>
              <CopyButton value={result} />
            </div>
          </ToolPanel>
        )}
      </div>
      <ToolPanel title={mode === "diff" ? "JSON changes" : "Result"}>
        <pre
          className={`${toolStyles.codeOutput} ${result.startsWith("Invalid") || result.startsWith("JSON error") ? "border-red-200 bg-red-50 text-[#b34835]" : ""}`}
        >
          {result}
        </pre>
      </ToolPanel>
    </ToolPage>
  );
}

function diffJson(first: string, second: string): string {
  try {
    const left = JSON.stringify(JSON.parse(first), null, 2).split("\n");
    const right = JSON.stringify(JSON.parse(second), null, 2).split("\n");
    const lines = new Set([...left, ...right]);
    return Array.from(lines)
      .map((line) => {
        const marker = !left.includes(line)
          ? "+ "
          : !right.includes(line)
            ? "- "
            : "  ";
        return `${marker}${line}`;
      })
      .join("\n");
  } catch {
    return "Both inputs must be valid JSON before comparing.";
  }
}

export function YamlJsonTool() {
  const [direction, setDirection] = useState<"yaml-to-json" | "json-to-yaml">(
    "yaml-to-json",
  );
  const [value, setValue] = useState(
    "name: toolmd\ntools:\n  - md2pdf\n  - md2word\nprivate: true",
  );
  const result = useMemo(() => {
    try {
      const parsed = YAML.parse(value);
      return direction === "yaml-to-json"
        ? JSON.stringify(parsed, null, 2)
        : YAML.stringify(parsed);
    } catch (error) {
      return `Conversion error: ${error instanceof Error ? error.message : "invalid input"}`;
    }
  }, [direction, value]);
  return (
    <ToolPage slug="yaml-json">
      <ToolPanel title="Convert YAML and JSON">
        <div className={toolStyles.segmented}>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "yaml-to-json" ? "bg-white text-[#f2633d] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            onClick={() => setDirection("yaml-to-json")}
          >
            YAML → JSON
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "json-to-yaml" ? "bg-white text-[#f2633d] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            onClick={() => setDirection("json-to-yaml")}
          >
            JSON → YAML
          </button>
        </div>
        <div className={toolStyles.splitLayout}>
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="YAML or JSON input"
            rows={18}
          />
          <pre className={toolStyles.codeOutput}>{result}</pre>
        </div>
        <CopyButton value={result} />
      </ToolPanel>
    </ToolPage>
  );
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
  return rows.filter((item) => item.some((cell) => cell.length));
}

function stringifyCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) =>
          /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell,
        )
        .join(","),
    )
    .join("\n");
}

export function CsvJsonTool() {
  const [direction, setDirection] = useState<"csv-to-json" | "json-to-csv">(
    "csv-to-json",
  );
  const [value, setValue] = useState(
    "name,category,status\nmd2pdf,Document,ready\nmd2word,Document,next",
  );
  const result = useMemo(() => {
    try {
      if (direction === "csv-to-json") {
        const rows = parseCsv(value);
        const headers = rows[0] || [];
        return JSON.stringify(
          rows
            .slice(1)
            .map((row) =>
              Object.fromEntries(
                headers.map((header, index) => [header, row[index] || ""]),
              ),
            ),
          null,
          2,
        );
      }
      const parsed: unknown = JSON.parse(value);
      if (
        !Array.isArray(parsed) ||
        !parsed.every((item) => typeof item === "object" && item !== null)
      )
        return "JSON must be an array of objects.";
      const objects = parsed as Record<string, unknown>[];
      const headers = Array.from(
        new Set(objects.flatMap((item) => Object.keys(item))),
      );
      return stringifyCsv([
        headers,
        ...objects.map((item) =>
          headers.map((header) => String(item[header] ?? "")),
        ),
      ]);
    } catch (error) {
      return `Conversion error: ${error instanceof Error ? error.message : "invalid input"}`;
    }
  }, [direction, value]);
  return (
    <ToolPage slug="csv-json">
      <ToolPanel title="Convert CSV and JSON">
        <div className={toolStyles.segmented}>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "csv-to-json" ? "bg-white text-[#f2633d] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            onClick={() => setDirection("csv-to-json")}
          >
            CSV → JSON
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "json-to-csv" ? "bg-white text-[#f2633d] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            onClick={() => setDirection("json-to-csv")}
          >
            JSON → CSV
          </button>
        </div>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="CSV or JSON input"
          rows={16}
        />
        <div className="mt-5 flex items-start gap-3">
          <pre className={`${toolStyles.codeOutput} min-w-0 flex-1`}>{result}</pre>
          <CopyButton value={result} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

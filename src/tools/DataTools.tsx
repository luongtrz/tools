import { useMemo, useState } from "react";
import YAML from "yaml";
import { useI18n } from "../i18n";
import {
  CopyButton,
  ToolButton,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

const SAMPLE_JSON =
  '{"name":"toolmd","tools":["md2pdf","md2word"],"private":true}';
const SAMPLE_JSON_COMPARE =
  '{"name":"toolmd","tools":["md2pdf","md2word","md2pptx"],"private":true}';

type JsonMode = "format" | "validate" | "diff";

export function JsonTool({ mode }: { mode: JsonMode }) {
  const { t } = useI18n();
  const [value, setValue] = useState(SAMPLE_JSON);
  const [compare, setCompare] = useState(SAMPLE_JSON_COMPARE);
  function reset(): void {
    setValue(SAMPLE_JSON);
    setCompare(SAMPLE_JSON_COMPARE);
  }
  const computed = useMemo((): { output: string; error: string } => {
    if (mode === "diff") {
      try {
        return { output: diffJson(value, compare), error: "" };
      } catch {
        return { output: "", error: t("invalidJsonPair") };
      }
    }
    if (!value.trim()) return { output: "", error: t("emptyInput") };
    try {
      const parsed: unknown = JSON.parse(value);
      return {
        output: mode === "format" ? JSON.stringify(parsed, null, 2) : t("validJson"),
        error: "",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "parse error";
      return { output: "", error: t("invalidJson", { message }) };
    }
  }, [compare, mode, t, value]);
  const output = computed.output || computed.error;
  const error = computed.error;
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
          <ToolPanel title="JSON A" actions={<ToolButton variant="quiet" onClick={reset}>{t("reset")}</ToolButton>}>
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
            actions={<ToolButton variant="quiet" onClick={reset}>{t("reset")}</ToolButton>}
          >
            <ToolTextArea
              value={value}
              onChange={setValue}
              ariaLabel="JSON input"
              rows={18}
            />
            <div className={toolStyles.panelActions}>
              {mode === "format" && (
                <ToolButton onClick={() => setValue(computed.output)}>
                  Format JSON
                </ToolButton>
              )}
              <CopyButton value={output} />
            </div>
          </ToolPanel>
        )}
      </div>
      <ToolPanel title={mode === "diff" ? "JSON changes" : "Result"}>
        {error ? (
          <ToolNotice variant="error">{error}</ToolNotice>
        ) : (
          <pre className={toolStyles.codeOutput}>{output}</pre>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

function diffJson(first: string, second: string): string {
  const left = JSON.stringify(JSON.parse(first), null, 2).split("\n");
  const right = JSON.stringify(JSON.parse(second), null, 2).split("\n");
  const lines: string[] = [];
  const total = Math.max(left.length, right.length);
  for (let index = 0; index < total; index += 1) {
    if (left[index] === right[index]) {
      if (left[index] !== undefined) lines.push(`  ${left[index]}`);
      continue;
    }
    if (left[index] !== undefined) lines.push(`- ${left[index]}`);
    if (right[index] !== undefined) lines.push(`+ ${right[index]}`);
  }
  return lines.join("\n") || "  (no changes)";
}

export function YamlJsonTool() {
  const { t } = useI18n();
  const initialValue = "name: toolmd\ntools:\n  - md2pdf\n  - md2word\nprivate: true";
  const [direction, setDirection] = useState<"yaml-to-json" | "json-to-yaml">(
    "yaml-to-json",
  );
  const [value, setValue] = useState(initialValue);
  const result = useMemo((): { output: string; error: string } => {
    if (!value.trim()) return { output: "", error: t("emptyInput") };
    try {
      const parsed = YAML.parse(value);
      return {
        output:
          direction === "yaml-to-json"
            ? JSON.stringify(parsed, null, 2)
            : YAML.stringify(parsed),
        error: "",
      };
    } catch (error) {
      return {
        output: "",
        error: t("conversionFailed", {
          message: error instanceof Error ? error.message : "invalid input",
        }),
      };
    }
  }, [direction, t, value]);
  return (
    <ToolPage slug="yaml-json">
      <ToolPanel title="Convert YAML and JSON" actions={<ToolButton variant="quiet" onClick={() => { setValue(initialValue); setDirection("yaml-to-json"); }}>{t("reset")}</ToolButton>}>
        <div className={toolStyles.segmented}>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "yaml-to-json" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
            onClick={() => setDirection("yaml-to-json")}
          >
            YAML → JSON
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "json-to-yaml" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
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
          {result.error ? <ToolNotice variant="error">{result.error}</ToolNotice> : <pre className={toolStyles.codeOutput}>{result.output}</pre>}
        </div>
        <CopyButton value={result.output} />
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
  const { t } = useI18n();
  const initialValue = "name,category,status\nmd2pdf,Document,ready\nmd2word,Document,next";
  const [direction, setDirection] = useState<"csv-to-json" | "json-to-csv">(
    "csv-to-json",
  );
  const [value, setValue] = useState(initialValue);
  const result = useMemo((): { output: string; error: string } => {
    if (!value.trim()) return { output: "", error: t("emptyInput") };
    try {
      if (direction === "csv-to-json") {
        const rows = parseCsv(value);
        const headers = rows[0] || [];
        if (!headers.length) return { output: "", error: t("emptyInput") };
        return {
          output: JSON.stringify(
            rows
              .slice(1)
              .map((row) =>
                Object.fromEntries(
                  headers.map((header, index) => [header, row[index] || ""]),
                ),
              ),
            null,
            2,
          ),
          error: "",
        };
      }
      const parsed: unknown = JSON.parse(value);
      if (
        !Array.isArray(parsed) ||
        !parsed.every((item) => typeof item === "object" && item !== null)
      )
        return { output: "", error: "JSON must be an array of objects." };
      const objects = parsed as Record<string, unknown>[];
      const headers = Array.from(
        new Set(objects.flatMap((item) => Object.keys(item))),
      );
      return {
        output: stringifyCsv([
          headers,
          ...objects.map((item) =>
            headers.map((header) => String(item[header] ?? "")),
          ),
        ]),
        error: "",
      };
    } catch (error) {
      return {
        output: "",
        error: t("conversionFailed", {
          message: error instanceof Error ? error.message : "invalid input",
        }),
      };
    }
  }, [direction, t, value]);
  return (
    <ToolPage slug="csv-json">
      <ToolPanel title="Convert CSV and JSON" actions={<ToolButton variant="quiet" onClick={() => { setValue(initialValue); setDirection("csv-to-json"); }}>{t("reset")}</ToolButton>}>
        <div className={toolStyles.segmented}>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "csv-to-json" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
            onClick={() => setDirection("csv-to-json")}
          >
            CSV → JSON
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "json-to-csv" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
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
          {result.error ? <ToolNotice variant="error">{result.error}</ToolNotice> : <pre className={`${toolStyles.codeOutput} min-w-0 flex-1`}>{result.output}</pre>}
          <CopyButton value={result.output} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

import { useMemo, useState } from "react";
import YAML from "yaml";
import { literal, useI18n } from "@/i18n";
import { downloadFile } from "@/lib/download";
import { tryParseJson, formatJson } from "@/lib/json";
import { csvToObjects, objectsToCsv, parseCsv } from "@/lib/csv";
import { diffJsonValues, type JsonDiffEntry } from "@/lib/jsonDiff";
import { detectFormat } from "@/lib/format";
import {
  CopyButton,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import {
  ErrorLine,
  FileDropZone,
  ToolExamples,
  ToolStats,
} from "@/components/ToolSupport";
import { toolStyles } from "@/components/toolStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const SAMPLE_JSON =
  '{"name":"toolmd","tools":["md2pdf","md2word","md2pptx"],"version":"1.0","settings":{"theme":"auto","limit":50}}';
const SAMPLE_JSON_B =
  '{"name":"toolmd","tools":["md2pdf","md2word","md2pptx","json-diff"],"version":"1.1","settings":{"theme":"auto","limit":100}}';

const JSON_SAMPLES = [
  { label: "Compact", description: "Single line, no spaces", value: '{"name":"toolmd","ok":true}' },
  { label: "Nested", description: "Config-like with array", value: SAMPLE_JSON },
  { label: "Array", description: "Top-level array", value: '[1,2,3,"four",{"five":5}]' },
  { label: "Unicode", description: "Vietnamese and emoji", value: '{"name":"toolmd","motto":"Đơn giản 🚀"}' },
];

const JSON_DIFF_SAMPLES = [
  {
    label: "v1 → v1.1",
    description: "Add field, change value",
    value: SAMPLE_JSON_B,
    left: SAMPLE_JSON,
    right: SAMPLE_JSON_B,
  },
  {
    label: "Reordered",
    description: "Same data, different key order",
    value: '{"c":3,"b":2,"a":1}',
    left: '{"a":1,"b":2,"c":3}',
    right: '{"c":3,"b":2,"a":1}',
  },
];

type JsonMode = "format" | "validate" | "diff";

export function JsonTool({ mode }: { mode: JsonMode }) {
  const { t } = useI18n();
  const [value, setValue] = useState(SAMPLE_JSON);
  const [compare, setCompare] = useState(SAMPLE_JSON_B);
  const [indent, setIndent] = useState<number | "\t">(2);
  const [minify, setMinify] = useState(false);
  const [ignoreOrder, setIgnoreOrder] = useState(false);
  const isFormat = mode === "format";
  const isValidate = mode === "validate";
  const isDiff = mode === "diff";

  const parsed = useMemo(() => tryParseJson(value), [value]);
  const output = useMemo(() => {
    if (!parsed.ok) return "";
    if (isFormat) return formatJson(parsed.value, minify ? 0 : indent);
    if (isValidate) return JSON.stringify(parsed.value, null, 2);
    return "";
  }, [indent, isFormat, isValidate, minify, parsed]);

  const parsedCompare = useMemo(() => tryParseJson(compare), [compare]);
  const diffEntries = useMemo<JsonDiffEntry[]>(() => {
    if (!isDiff) return [];
    if (!parsed.ok || !parsedCompare.ok) return [];
    return diffJsonValues(parsed.value, parsedCompare.value, {
      ignoreArrayOrder: ignoreOrder,
    });
  }, [ignoreOrder, isDiff, parsed, parsedCompare]);

  const stats = useMemo(() => {
    if (!parsed.ok) return null;
    const serialized = JSON.stringify(parsed.value);
    return {
      bytes: serialized.length,
      lines: serialized.split("\n").length,
      keys: countKeys(parsed.value),
    };
  }, [parsed]);

  function reset(): void {
    setValue(SAMPLE_JSON);
    setCompare(SAMPLE_JSON_B);
    setIndent(2);
    setMinify(false);
    setIgnoreOrder(false);
  }

  return (
    <ToolPage
      slug={
        isFormat ? "json-formatter" : isValidate ? "json-validator" : "json-diff"
      }
    >
      {!isDiff && (
        <ToolPanel
          title={isFormat ? "JSON input" : "Validate JSON"}
          actions={
            <OutputActions
              onReset={reset}
              onClear={() => setValue("")}
              onCopy={async () => {
                await navigator.clipboard.writeText(value);
              }}
              onDownload={() =>
                downloadFile(
                  "input.json",
                  value,
                  "application/json;charset=utf-8",
                )
              }
            />
          }
        >
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="JSON input"
            rows={18}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {isFormat && (
              <>
                <Field label="Output">
                  <Select
                    value={minify ? "minified" : "pretty"}
                    onValueChange={(v: string) => setMinify(v === "minified")}
                  >
                    <SelectTrigger className="h-9 w-full font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pretty">Pretty print</SelectItem>
                      <SelectItem value="minified">Minified</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Indent">
                  <Select
                    value={String(indent)}
                    onValueChange={(v: string) =>
                      setIndent(v === "tab" ? "\t" : Number(v))
                    }
                    disabled={minify}
                  >
                    <SelectTrigger className="h-9 w-full font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 spaces</SelectItem>
                      <SelectItem value="4">4 spaces</SelectItem>
                      <SelectItem value="tab">Tab</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
            <FileDropZone
              accept=".json,application/json"
              label="Drop a .json file"
              description="or click to browse"
              onFiles={async (files) => {
                const file = files[0];
                if (!file) return;
                const text = await file.text();
                setValue(text);
              }}
            />
          </div>
          <ToolExamples
            className="mt-3"
            examples={JSON_SAMPLES}
            onSelect={setValue}
          />
          {stats && (
            <ToolStats
              className="mt-3"
              items={[
                { label: "Bytes", value: stats.bytes.toLocaleString() },
                { label: "Lines", value: stats.lines.toLocaleString() },
                { label: "Keys", value: stats.keys.toLocaleString() },
                {
                  label: isFormat ? "Indent" : "Status",
                  value: isFormat ? String(indent === "\t" ? "tab" : indent) : "Valid",
                },
              ]}
            />
          )}
        </ToolPanel>
      )}
      {isDiff && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ToolPanel
            title="JSON A"
            actions={
              <OutputActions
                onReset={reset}
                onClear={() => setValue("")}
                onCopy={async () => {
                  await navigator.clipboard.writeText(value);
                }}
              />
            }
          >
            <ToolTextArea
              value={value}
              onChange={setValue}
              ariaLabel="First JSON"
              rows={18}
            />
          </ToolPanel>
          <ToolPanel
            title="JSON B"
            actions={
              <OutputActions
                onSwap={() => {
                  const a = value;
                  setValue(compare);
                  setCompare(a);
                }}
                onClear={() => setCompare("")}
                onCopy={async () => {
                  await navigator.clipboard.writeText(compare);
                }}
              />
            }
          >
            <ToolTextArea
              value={compare}
              onChange={setCompare}
              ariaLabel="Second JSON"
              rows={18}
            />
            <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={ignoreOrder}
                onCheckedChange={(value) => setIgnoreOrder(Boolean(value))}
              />
              Ignore array element order
            </label>
            <ToolExamples
              className="mt-3"
              examples={JSON_DIFF_SAMPLES}
              onSelect={(next) => {
                const sample = JSON_DIFF_SAMPLES.find((entry) => entry.right === next);
                if (sample) {
                  setValue(sample.left);
                  setCompare(sample.right);
                } else {
                  setCompare(next);
                }
              }}
            />
          </ToolPanel>
        </div>
      )}
      <ToolPanel
        title={isDiff ? "Changes" : "Result"}
        actions={
          <OutputActions
            onCopy={async () => {
              if (isDiff) {
                await navigator.clipboard.writeText(
                  diffEntries
                    .filter((entry) => entry.type !== "unchanged")
                    .map((entry) => `${entry.type === "added" ? "+" : entry.type === "removed" ? "-" : "~"} ${entry.path}`)
                    .join("\n"),
                );
              } else {
                await navigator.clipboard.writeText(output);
              }
            }}
            onDownload={
              isDiff || !output
                ? undefined
                : () =>
                    downloadFile(
                      isFormat ? "formatted.json" : "validated.json",
                      output,
                      "application/json;charset=utf-8",
                    )
            }
          />
        }
      >
        {!parsed.ok && !isDiff && (
          <ErrorLine text={value} error={parsed.error} />
        )}
        {!parsedCompare.ok && isDiff && (
          <ErrorLine text={compare} error={parsedCompare.error} />
        )}
        {((isDiff && parsed.ok && parsedCompare.ok) ||
          (!isDiff && parsed.ok)) && (
          <>
            {isDiff ? (
              <div className="space-y-1">
                {diffEntries.length === 0 ? (
                  <ToolNotice>No changes detected.</ToolNotice>
                ) : (
                  diffEntries.map((entry, index) => (
                    <DiffEntryRow
                      key={`${entry.path}-${index}`}
                      entry={entry}
                    />
                  ))
                )}
              </div>
            ) : (
              <pre className={cn(toolStyles.codeOutput, "min-h-[300px]")}>
                {output}
              </pre>
            )}
          </>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

function DiffEntryRow({ entry }: { entry: JsonDiffEntry }) {
  const styles = {
    added: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
    removed: "border-destructive/40 bg-destructive/10 text-destructive",
    changed: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
    unchanged: "border-border bg-muted/30 text-foreground",
  } as const;
  return (
    <div className={cn("rounded-md border px-3 py-2 font-mono text-xs", styles[entry.type])}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold">{entry.path}</span>
        <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] uppercase tracking-wide">
          {entry.type}
        </span>
      </div>
      <div className="mt-1 grid gap-1 sm:grid-cols-2">
        {entry.before !== undefined && (
          <code className="break-all rounded bg-background/60 p-1.5 text-[11px]">
            − {formatJson(entry.before, 2)}
          </code>
        )}
        {entry.after !== undefined && (
          <code className="break-all rounded bg-background/60 p-1.5 text-[11px]">
            + {formatJson(entry.after, 2)}
          </code>
        )}
      </div>
    </div>
  );
}

function countKeys(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((sum, item) => sum + countKeys(item), 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (sum, item) => sum + 1 + countKeys(item),
      0,
    );
  }
  return 0;
}

const SAMPLE_YAML = "name: toolmd\ntools:\n  - md2pdf\n  - md2word\n  - md2pptx\nversion: 1.0\n";
const SAMPLE_YAML_JSON = `{\n  "name": "toolmd",\n  "tools": ["md2pdf", "md2word"],\n  "private": true\n}`;

const YAML_SAMPLES = [
  { label: "YAML", description: "Mapping + list", value: SAMPLE_YAML },
  { label: "JSON", description: "Same content in JSON", value: SAMPLE_YAML_JSON },
];

export function YamlJsonTool() {
  const { t } = useI18n();
  const [direction, setDirection] = useState<"yaml-to-json" | "json-to-yaml">(
    "yaml-to-json",
  );
  const [value, setValue] = useState(SAMPLE_YAML);
  const [indent, setIndent] = useState(2);
  const result = useMemo<{ output: string; error: string }>(() => {
    if (!value.trim()) return { output: "", error: t("emptyInput") };
    try {
      const parsed = YAML.parse(value);
      return {
        output:
          direction === "yaml-to-json"
            ? JSON.stringify(parsed, null, indent)
            : YAML.stringify(parsed, { indent }),
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
  }, [direction, indent, t, value]);
  const detected = useMemo(() => detectFormat("input", value), [value]);
  return (
    <ToolPage slug="yaml-json">
      <ToolPanel
        title="Convert YAML and JSON"
        actions={
          <OutputActions
            onReset={() => {
              setValue(SAMPLE_YAML);
              setDirection("yaml-to-json");
              setIndent(2);
            }}
            onSwap={() => {
              if (!result.output) return;
              setDirection((d) => (d === "yaml-to-json" ? "json-to-yaml" : "yaml-to-json"));
              setValue(result.output);
            }}
            onClear={() => setValue("")}
            onCopy={async () => {
              await navigator.clipboard.writeText(result.output);
            }}
            onDownload={() =>
              downloadFile(
                direction === "yaml-to-json" ? "out.json" : "out.yaml",
                result.output,
                direction === "yaml-to-json"
                  ? "application/json;charset=utf-8"
                  : "application/x-yaml;charset=utf-8",
              )
            }
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Direction">
            <div className="inline-flex h-9 w-full overflow-hidden rounded-md border border-input">
              <button
                type="button"
                onClick={() => setDirection("yaml-to-json")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "yaml-to-json"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                YAML → JSON
              </button>
              <button
                type="button"
                onClick={() => setDirection("json-to-yaml")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "json-to-yaml"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                JSON → YAML
              </button>
            </div>
          </Field>
          <Field label="Indent">
            <Select
              value={String(indent)}
              onValueChange={(v: string) => setIndent(Number(v))}
            >
              <SelectTrigger className="h-9 w-full font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Detected input: <code className="font-mono">{detected}</code>
          </span>
          <FileDropZone
            accept=".yaml,.yml,.json,application/json,application/x-yaml"
            className="flex-1 max-w-md"
            label="Drop a .yaml/.yml/.json file"
            description="or click to browse"
            onFiles={async (files) => {
              const file = files[0];
              if (!file) return;
              const text = await file.text();
              const format = detectFormat(file.name, text);
              if (format === "json") setDirection("json-to-yaml");
              else if (format === "yaml") setDirection("yaml-to-json");
              setValue(text);
            }}
          />
        </div>
        <ToolExamples
          className="mt-3"
          examples={YAML_SAMPLES}
          onSelect={setValue}
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Input
            </Label>
            <ToolTextArea
              className="mt-1"
              value={value}
              onChange={setValue}
              ariaLabel="YAML or JSON input"
              rows={16}
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">
              Output
            </Label>
            {result.error ? (
              <ToolNotice variant="error" className="mt-1">
                {result.error}
              </ToolNotice>
            ) : (
              <pre className={cn(toolStyles.codeOutput, "mt-1 min-h-[320px]")}>
                {result.output}
              </pre>
            )}
          </div>
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

const CSV_SAMPLES = [
  {
    label: "Inventory",
    description: "3 columns, 4 rows",
    value: "name,category,status\nmd2pdf,Document,ready\nmd2word,Document,next\nmd2pptx,Document,planned\nmd2pdf v2,Document,shipped",
  },
  {
    label: "TSV",
    description: "Tab-separated values",
    value: "id\tname\tqty\n1\tmd2pdf\t42\n2\tmd2word\t7",
  },
  {
    label: "Quoted",
    description: "Comma inside a quoted field",
    value: 'name,description\n"tool, md2pdf","Markdown, ready to print"\n"tool, md2word","Convert to Word"',
  },
];

export function CsvJsonTool() {
  const { t } = useI18n();
  const [direction, setDirection] = useState<"csv-to-json" | "json-to-csv">(
    "csv-to-json",
  );
  const [value, setValue] = useState(CSV_SAMPLES[0].value);
  const [delimiter, setDelimiter] = useState<"" | "," | "\t" | ";">("");
  const result = useMemo<{
    output: string;
    error: string;
    headers?: string[];
    detected?: string;
    rows?: Record<string, string>[];
  }>(() => {
    if (!value.trim()) return { output: "", error: t("emptyInput") };
    if (direction === "csv-to-json") {
      const parsed = parseCsv(value, delimiter || undefined);
      if ("message" in parsed) {
        return { output: "", error: parsed.message };
      }
      const out = csvToObjects(value, delimiter || undefined);
      if (!out.ok) return { output: "", error: out.error };
      return {
        output: JSON.stringify(out.data, null, 2),
        error: "",
        headers: out.headers,
        detected: parsed.delimiter,
        rows: out.data,
      };
    }
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed) || !parsed.every(isPlainObject)) {
        return { output: "", error: t("jsonArrayRequired") };
      }
      return {
        output: objectsToCsv(parsed as Record<string, unknown>[]),
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
  }, [delimiter, direction, t, value]);
  return (
    <ToolPage slug="csv-json">
      <ToolPanel
        title="Convert CSV and JSON"
        actions={
          <OutputActions
            onReset={() => {
              setValue(CSV_SAMPLES[0].value);
              setDirection("csv-to-json");
              setDelimiter("");
            }}
            onSwap={() => {
              if (!result.output) return;
              setDirection((d) => (d === "csv-to-json" ? "json-to-csv" : "csv-to-json"));
              setValue(result.output);
            }}
            onClear={() => setValue("")}
            onCopy={async () => {
              await navigator.clipboard.writeText(result.output);
            }}
            onDownload={() =>
              downloadFile(
                direction === "csv-to-json" ? "out.json" : "out.csv",
                result.output,
                direction === "csv-to-json"
                  ? "application/json;charset=utf-8"
                  : "text/csv;charset=utf-8",
              )
            }
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Direction">
            <div className="inline-flex h-9 w-full overflow-hidden rounded-md border border-input">
              <button
                type="button"
                onClick={() => setDirection("csv-to-json")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "csv-to-json"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                CSV → JSON
              </button>
              <button
                type="button"
                onClick={() => setDirection("json-to-csv")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "json-to-csv"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                JSON → CSV
              </button>
            </div>
          </Field>
          <Field
            label="Delimiter (CSV input)"
            hint="Auto-detects when set to Auto."
          >
            <Select
              value={delimiter || "auto"}
              onValueChange={(v: string) =>
                setDelimiter(v === "auto" ? "" : (v as "," | "\t" | ";"))
              }
            >
              <SelectTrigger className="h-9 w-full font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value=",">Comma ,</SelectItem>
                <SelectItem value="\t">Tab</SelectItem>
                <SelectItem value=";">Semicolon ;</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <FileDropZone
          accept=".csv,.tsv,text/csv"
          className="mt-3"
          label="Drop a .csv or .tsv file"
          description="or click to browse"
          onFiles={async (files) => {
            const file = files[0];
            if (!file) return;
            const text = await file.text();
            setValue(text);
            setDirection("csv-to-json");
          }}
        />
        <ToolExamples
          className="mt-3"
          examples={CSV_SAMPLES}
          onSelect={setValue}
        />
        {result.detected && direction === "csv-to-json" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Detected delimiter: <code className="font-mono">{result.detected === "\t" ? "tab" : result.detected}</code>
          </p>
        )}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="CSV or JSON input"
            rows={16}
          />
          {result.error ? (
            <ToolNotice variant="error">{result.error}</ToolNotice>
          ) : (
            <pre className={cn(toolStyles.codeOutput, "min-h-[320px]")}>
              {result.output}
            </pre>
          )}
        </div>
        {result.rows && result.headers && result.rows.length > 0 && (
          <div className="mt-4 overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  {result.headers.map((header) => (
                    <th key={header} className="px-3 py-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 8).map((row, index) => (
                  <tr key={index} className="even:bg-muted/20">
                    {result.headers!.map((header) => (
                      <td key={header} className="px-3 py-1.5 font-mono text-xs">
                        {row[header] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {result.rows.length > 8 && (
              <p className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Showing 8 of {result.rows.length} rows.
              </p>
            )}
          </div>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const { language } = useI18n();
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {literal(label, language)}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{literal(hint, language)}</p>}
    </div>
  );
}

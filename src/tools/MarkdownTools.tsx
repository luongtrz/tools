import { useEffect, useMemo, useRef, useState } from "react";
import { SAMPLE_MARKDOWN } from "@/constants/sampleMarkdown";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "@/i18n";
import { renderMarkdown } from "@/lib/markdown";
import { downloadFile } from "@/lib/download";
import { countWords, type WordCountMode } from "@/lib/wordCount";
import { parseMarkdownTable, formatMarkdownTable, updateTableAlignment, type Alignment, type ParsedTable } from "@/lib/markdownTable";
import { htmlToMarkdownAdvanced } from "@/lib/htmlToMarkdown";
import { detectFormat } from "@/lib/format";
import {
  CopyButton,
  ToolButton,
  ToolLabel,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import { ToolExamples, ToolStats, FileDropZone, formatBytes } from "@/components/ToolSupport";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toolStyles } from "@/components/toolStyles";
import { cn } from "@/lib/utils";

const MD_SAMPLES = [
  {
    label: "Article",
    description: "Headings, lists, quote, code",
    value: SAMPLE_MARKDOWN,
  },
  {
    label: "Empty",
    description: "Start from a blank document",
    value: "",
  },
  {
    label: "Meeting notes",
    description: "Agenda + action items",
    value: `# Meeting — ${new Date().toISOString().slice(0, 10)}\n\n## Agenda\n\n- Review launch plan\n- Pricing\n- Hiring update\n\n## Decisions\n\n- Ship v1 by end of month\n- Hold the line on the free tier\n\n## Action items\n\n- [ ] Send launch email draft\n- [ ] Update changelog\n- [ ] Sync with support team\n`,
  },
];

export function MarkdownEditorTool() {
  const { t } = useI18n();
  const [value, setValue] = useLocalStorage("markdown-editor-content", SAMPLE_MARKDOWN);
  const [filename, setFilename] = useState("document");
  const [warning, setWarning] = useState<string | null>(null);

  function downloadMarkdown(): void {
    const safe = (filename || "document").replace(/[^a-zA-Z0-9_-]/g, "-");
    downloadFile(`${safe}.md`, value, "text/markdown;charset=utf-8");
  }

  function loadFile(text: string, name: string): void {
    setValue(text);
    const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
    if (base) setFilename(base);
    setWarning(null);
  }

  return (
    <ToolPage slug="markdown-editor">
      <div className={toolStyles.splitLayout}>
        <ToolPanel
          title="Write Markdown"
          actions={
            <OutputActions
              onReset={() => setValue(SAMPLE_MARKDOWN)}
              onClear={() => {
                if (!value) return;
                if (window.confirm(t("confirmClear"))) setValue("");
              }}
              onCopy={async () => {
                await navigator.clipboard.writeText(value);
              }}
              onDownload={downloadMarkdown}
            />
          }
        >
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="Markdown editor"
            rows={20}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <Field label="Filename (without .md)">
              <Input
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                className="h-9 font-mono"
              />
            </Field>
            <div className="flex items-end">
              <FileDropZone
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                onFiles={async (files) => {
                  const file = files[0];
                  if (!file) return;
                  const text = await file.text();
                  if (text.length > 200_000) {
                    setWarning(`File is large (${formatBytes(text.length)}). Editor may slow down.`);
                  }
                  loadFile(text, file.name);
                }}
                label="Drop a .md or .txt file"
                description="or click to browse"
                className="[&>label]:min-h-0 [&>label]:py-3"
              />
            </div>
          </div>
          {warning && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {warning}
            </p>
          )}
        </ToolPanel>
        <ToolPanel title="Live preview">
          {value.trim() ? (
            <article
              className={toolStyles.documentPreview}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <ToolNotice>{t("emptyMarkdown")}</ToolNotice>
          )}
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

export function MarkdownTableGeneratorTool() {
  const { t } = useI18n();
  const initialHeaders = "Name,Description,Status";
  const [headersText, setHeadersText] = useState(initialHeaders);
  const [rowCount, setRowCount] = useState(3);
  const [grid, setGrid] = useState<string[][]>(() =>
    buildGrid(["Name", "Description", "Status"], 3, undefined),
  );
  const [delimiter, setDelimiter] = useState<"," | "\t" | ";">(",");

  const headers = useMemo(
    () => headersText.split(delimiter).map((header) => header.trim() || "—"),
    [delimiter, headersText],
  );

  useEffect(() => {
    setGrid((current) => buildGrid(headers, rowCount, current));
  }, [headers, rowCount]);

  const markdown = useMemo(() => gridToMarkdown(grid), [grid]);

  function updateCell(row: number, col: number, value: string): void {
    setGrid((current) => {
      const next = current.map((r) => r.slice());
      next[row][col] = value;
      return next;
    });
  }

  function reset(): void {
    setHeadersText(initialHeaders);
    setRowCount(3);
    setGrid(buildGrid(["Name", "Description", "Status"], 3, undefined));
  }

  return (
    <ToolPage slug="markdown-table-generator">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ToolPanel
          title="Table setup"
          actions={
            <OutputActions onReset={reset} onCopy={async () => {
              await navigator.clipboard.writeText(markdown);
            }} onDownload={() => downloadFile("table.md", markdown, "text/markdown;charset=utf-8")} />
          }
        >
          <Field
            label="Headers"
            hint="Separated by the chosen delimiter. Drag the corner to resize."
          >
            <ToolTextArea
              value={headersText}
              onChange={setHeadersText}
              ariaLabel="Table headers"
              rows={2}
              className="min-h-[80px]"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rows">
              <Input
                type="number"
                min={1}
                max={50}
                value={rowCount}
                onChange={(event) =>
                  setRowCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))
                }
                className="h-9 font-mono"
              />
            </Field>
            <Field label="Delimiter">
              <Select value={delimiter} onValueChange={(v: string) => setDelimiter(v as "," | "\t" | ";")}>
                <SelectTrigger className="h-9 w-full font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=",">Comma ,</SelectItem>
                  <SelectItem value="\t">Tab</SelectItem>
                  <SelectItem value=";">Semicolon ;</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="border-b border-border px-3 py-2 text-left font-semibold"
                    >
                      <Input
                        value={header}
                        onChange={(event) => {
                          const next = headersText.split(delimiter);
                          next[index] = event.target.value;
                          setHeadersText(next.join(delimiter));
                        }}
                        className="h-7 border-0 bg-transparent px-1 font-semibold"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, r) => (
                  <tr key={r} className="even:bg-muted/20">
                    {row.map((cell, c) => (
                      <td key={c} className="border-b border-border px-2 py-1.5">
                        <Input
                          value={cell}
                          onChange={(event) => updateCell(r, c, event.target.value)}
                          className="h-7 border-0 bg-transparent px-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ToolPanel>
        <ToolPanel title="Generated Markdown">
          <pre className={cn(toolStyles.codeOutput, "min-h-[420px]")}>{markdown}</pre>
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

function buildGrid(
  headers: string[],
  rows: number,
  previous?: string[][],
): string[][] {
  return Array.from({ length: rows }, (_, row) =>
    headers.map((_, col) => previous?.[row]?.[col] ?? `Value ${row + 1}.${col + 1}`),
  );
}

function gridToMarkdown(grid: string[][]): string {
  if (!grid.length) return "";
  const headerRow = grid[0].map((header) => escapeCell(header));
  const separator = grid[0].map(() => "---");
  const body = grid
    .slice(1)
    .map((row) => row.map((cell) => escapeCell(cell)).join(" | "));
  return [
    `| ${headerRow.join(" | ")} |`,
    `| ${separator.join(" | ")} |`,
    ...body.map((line) => `| ${line} |`),
  ].join("\n");
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

export function MarkdownTableFormatterTool() {
  const { t } = useI18n();
  const sample = `| Name | Status | Notes |\n| --- | :---: | --- |\n| md2pdf | ready | renders tables |\n| md2word | next | with code |`;
  const [value, setValue] = useState(sample);
  const parsed = useMemo(() => parseMarkdownTable(value), [value]);
  const formatted = useMemo(() => {
    if (!parsed.ok) return value;
    return formatMarkdownTable(parsed.table);
  }, [parsed, value]);
  const [compact, setCompact] = useState(false);
  const formattedView = useMemo(() => {
    if (!parsed.ok) return formatted;
    return formatMarkdownTable(parsed.table, { padded: !compact });
  }, [compact, formatted, parsed]);

  function setAlignment(column: number, alignment: Alignment): void {
    if (!parsed.ok) return;
    const next = updateTableAlignment(parsed.table, column, alignment);
    setValue(formatMarkdownTable(next));
  }

  return (
    <ToolPage slug="markdown-table-formatter">
      <ToolPanel
        title="Unformatted table"
        actions={
          <OutputActions
            onReset={() => setValue(sample)}
            onCopy={async () => {
              if (parsed.ok) await navigator.clipboard.writeText(formatted);
            }}
            onDownload={() =>
              downloadFile("table.md", formatted, "text/markdown;charset=utf-8")
            }
          />
        }
      >
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Markdown table input"
          rows={10}
        />
        {!parsed.ok && (
          <ToolNotice variant="error">
            Line {parsed.error.line}: {parsed.error.message}
          </ToolNotice>
        )}
      </ToolPanel>
      {parsed.ok && (
        <ToolPanel
          title="Result"
          actions={
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={compact}
                onCheckedChange={(value) => setCompact(Boolean(value))}
              />
              Compact (no padding)
            </label>
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Click an alignment button to set it for that column.</span>
          </div>
          <div className="overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {parsed.table.headers.map((header, index) => (
                    <th
                      key={index}
                      className="border-b border-border px-3 py-2 text-left font-semibold"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{header || "—"}</span>
                        <AlignmentPicker
                          value={parsed.table.alignments[index] ?? "left"}
                          onChange={(a) => setAlignment(index, a)}
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.table.rows.map((row, r) => (
                  <tr key={r} className="even:bg-muted/20">
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className="border-b border-border px-3 py-1.5"
                        style={{ textAlign: parsed.table.alignments[c] ?? "left" }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <pre className={cn(toolStyles.codeOutput, "mt-4 min-h-[160px]")}>
            {formattedView}
          </pre>
        </ToolPanel>
      )}
    </ToolPage>
  );
}

function AlignmentPicker({
  value,
  onChange,
}: {
  value: Alignment;
  onChange: (value: Alignment) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
      {(["left", "center", "right"] as Alignment[]).map((align) => (
        <button
          key={align}
          type="button"
          onClick={() => onChange(align)}
          className={cn(
            "h-6 w-6 rounded-sm text-xs transition-colors",
            value === align
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
          aria-label={`Align ${align}`}
        >
          {align === "left" ? "⟸" : align === "center" ? "⟺" : "⟹"}
        </button>
      ))}
    </div>
  );
}

export function MarkdownWordCounterTool() {
  const { t } = useI18n();
  const [value, setValue] = useState(SAMPLE_MARKDOWN);
  const [mode, setMode] = useState<WordCountMode>("raw");
  const [wpm, setWpm] = useState(220);
  const result = useMemo(() => countWords(value, mode, wpm), [mode, value, wpm]);

  return (
    <ToolPage slug="markdown-word-counter">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ToolPanel
          title="Markdown text"
          actions={
            <OutputActions
              onReset={() => setValue(SAMPLE_MARKDOWN)}
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
            ariaLabel="Markdown text"
            rows={20}
          />
        </ToolPanel>
        <ToolPanel
          title="Statistics"
          actions={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Label className="text-xs">Mode</Label>
              <Select value={mode} onValueChange={(v: string) => setMode(v as WordCountMode)}>
                <SelectTrigger className="h-8 w-[110px] font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw">Raw</SelectItem>
                  <SelectItem value="prose">Prose</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          <Field label={`Reading speed (${wpm} WPM)`}>
            <input
              type="range"
              min={150}
              max={300}
              step={10}
              value={wpm}
              onChange={(event) => setWpm(Number(event.target.value))}
              className="w-full"
            />
          </Field>
          <ToolStats
            className="mt-4"
            items={[
              { label: "Words", value: result.words.toLocaleString() },
              {
                label: "Characters",
                value: result.characters.toLocaleString(),
                hint: `${result.charactersNoSpaces.toLocaleString()} no spaces`,
              },
              { label: "Lines", value: result.lines.toLocaleString() },
              { label: "Paragraphs", value: result.paragraphs.toLocaleString() },
              { label: "Headings", value: result.headings.toLocaleString() },
              { label: "Code blocks", value: result.codeBlocks.toLocaleString() },
              {
                label: "Reading time",
                value: `${result.readingMinutes} min`,
                hint: `at ${wpm} WPM`,
              },
            ]}
          />
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

export function HtmlToMarkdownTool() {
  const { t } = useI18n();
  const [value, setValue] = useState(
    "<h1>Project brief</h1><p>Write <strong>focused</strong> documents.</p><ul><li>Draft</li><li>Review</li></ul><table><thead><tr><th>Name</th><th>Status</th></tr></thead><tbody><tr><td>md2pdf</td><td>ready</td></tr></tbody></table>",
  );
  const result = useMemo(() => htmlToMarkdownAdvanced(value), [value]);
  const sample = SAMPLE_MARKDOWN;
  return (
    <ToolPage slug="html-to-markdown">
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel
          title="HTML input"
          actions={
            <OutputActions
              onReset={() => setValue(sample)}
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
            ariaLabel="HTML input"
            rows={18}
          />
          <FileDropZone
            accept=".html,.htm,text/html"
            className="mt-4"
            label="Drop an HTML file"
            description="or click to browse"
            onFiles={async (files) => {
              const file = files[0];
              if (!file) return;
              const text = await file.text();
              setValue(text);
            }}
          />
        </ToolPanel>
        <ToolPanel
          title="Markdown result"
          actions={
            <OutputActions
              onCopy={async () => {
                await navigator.clipboard.writeText(result.markdown);
              }}
              onDownload={() =>
                downloadFile(
                  "converted.md",
                  result.markdown,
                  "text/markdown;charset=utf-8",
                )
              }
            />
          }
        >
          {result.markdown ? (
            <pre className={cn(toolStyles.codeOutput, "min-h-[420px]")}>
              {result.markdown}
            </pre>
          ) : (
            <ToolNotice>{t("emptyHtml")}</ToolNotice>
          )}
          {result.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-amber-600 dark:text-amber-400">
              {result.warnings.map((warning, index) => (
                <li key={index}>⚠ {warning}</li>
              ))}
            </ul>
          )}
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

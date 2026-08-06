import { useMemo, useState } from "react";
import { SAMPLE_MARKDOWN } from "../constants/sampleMarkdown";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useI18n } from "../i18n";
import { renderMarkdown } from "../lib/markdown";
import { downloadFile } from "../lib/download";
import {
  CopyButton,
  ToolButton,
  ToolLabel,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "../components/ToolUI";
import { toolStyles } from "../components/toolStyles";

export function MarkdownEditorTool() {
  const { t } = useI18n();
  const [value, setValue] = useLocalStorage("markdown-editor-content", SAMPLE_MARKDOWN);
  return (
    <ToolPage slug="markdown-editor">
      <div className={toolStyles.splitLayout}>
        <ToolPanel title="Write Markdown">
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="Markdown editor"
            rows={22}
          />
          <div className={toolStyles.panelActions}>
            <ToolButton variant="quiet" onClick={() => setValue("")}>
              {t("clear")}
            </ToolButton>
            <ToolButton variant="quiet" onClick={() => setValue(SAMPLE_MARKDOWN)}>
              {t("reset")}
            </ToolButton>
            <ToolButton
              variant="quiet"
              onClick={() =>
                downloadFile(
                  "document.md",
                  value,
                  "text/markdown;charset=utf-8",
                )
              }
            >
              Download .md
            </ToolButton>
            <CopyButton value={value} />
          </div>
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

function makeMarkdownTable(headers: string[], rowCount: number): string {
  const cleanHeaders = headers.map(
    (header, index) => header.trim() || `Column ${index + 1}`,
  );
  const separator = cleanHeaders.map(() => "---");
  const safeRowCount = Number.isFinite(rowCount)
    ? Math.max(1, Math.min(30, rowCount))
    : 3;
  const rows = Array.from({ length: safeRowCount }, (_, row) =>
    cleanHeaders.map((_, column) => `Value ${row + 1}.${column + 1}`),
  );
  return [cleanHeaders, separator, ...rows]
    .map((row) => `| ${row.join(" | ")} |`)
    .join("\n");
}

export function MarkdownTableGeneratorTool() {
  const { t } = useI18n();
  const initialHeaders = "Name,Description,Status";
  const [headers, setHeaders] = useState("Name,Description,Status");
  const [rowCount, setRowCount] = useState(3);
  const output = useMemo(
    () =>
      makeMarkdownTable(
        headers.split(","),
        Math.max(1, Math.min(30, rowCount)),
      ),
    [headers, rowCount],
  );
  return (
    <ToolPage slug="markdown-table-generator">
      <ToolPanel
        title="Table setup"
        description="Separate column names with commas."
        actions={<ToolButton variant="quiet" onClick={() => { setHeaders(initialHeaders); setRowCount(3); }}>{t("reset")}</ToolButton>}
      >
        <label className={toolStyles.label}>
          <ToolLabel>Headers</ToolLabel>
          <ToolTextArea
            value={headers}
            onChange={setHeaders}
            ariaLabel="Table headers"
            rows={3}
          />
        </label>
        <label className={toolStyles.label}>
            <ToolLabel>Rows</ToolLabel>
          <input
            className={toolStyles.input}
            type="number"
            min="1"
            max="30"
            step="1"
            value={rowCount}
            onChange={(event) => setRowCount(Number(event.target.value))}
          />
        </label>
      </ToolPanel>
      <ToolPanel
        title="Generated Markdown"
        actions={<CopyButton value={output} />}
      >
        <pre className={toolStyles.codeOutput}>{output}</pre>
      </ToolPanel>
    </ToolPage>
  );
}

function markdownTableRows(value: string): string[][] {
  return value
    .split("\n")
    .filter((line) => line.includes("|"))
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
}

function isMarkdownTable(value: string): boolean {
  const rows = markdownTableRows(value);
  return (
    rows.length >= 2 &&
    rows[1].length > 0 &&
    rows[1].every((cell) => /^:?-{3,}:?$/.test(cell))
  );
}

function formatMarkdownTable(value: string): string {
  const rows = markdownTableRows(value);
  if (rows.length < 2) return value;
  if (!isMarkdownTable(value)) return value;
  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row, index) =>
    Array.from({ length: columnCount }, (_, column) =>
      index === 1 ? row[column] || "---" : row[column] || "",
    ),
  );
  const widths = Array.from({ length: columnCount }, (_, column) =>
    Math.max(3, ...normalized.map((row) => row[column].length)),
  );
  return normalized
    .map(
      (row) =>
        `| ${row.map((cell, column) => cell.padEnd(widths[column])).join(" | ")} |`,
    )
    .join("\n");
}

export function MarkdownTableFormatterTool() {
  const { t } = useI18n();
  const [value, setValue] = useState(
    "| Name | Status |\n| --- | --- |\n| md2pdf | ready |\n| md2word | next |",
  );
  const output = useMemo(() => formatMarkdownTable(value), [value]);
  const isValidTable = isMarkdownTable(value);
  return (
    <ToolPage slug="markdown-table-formatter">
      <ToolPanel title="Unformatted table" actions={<ToolButton variant="quiet" onClick={() => setValue("| Name | Status |\n| --- | --- |\n| md2pdf | ready |\n| md2word | next |")}>{t("reset")}</ToolButton>}>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Markdown table input"
          rows={10}
        />
        <div className={toolStyles.panelActions}>
          <ToolButton onClick={() => setValue(output)} disabled={!isValidTable}>Format table</ToolButton>
          <CopyButton value={isValidTable ? output : ""} />
        </div>
      </ToolPanel>
      <ToolPanel title="Result">
        {isValidTable ? (
          <pre className={toolStyles.codeOutput}>{output}</pre>
        ) : (
          <ToolNotice variant="warning">{t("noTableFound")}</ToolNotice>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

export function MarkdownWordCounterTool() {
  const { t } = useI18n();
  const [value, setValue] = useState(SAMPLE_MARKDOWN);
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const lines = value ? value.split(/\r?\n/).length : 0;
  const readingMinutes = words ? Math.ceil(words / 220) : 0;
  return (
    <ToolPage slug="markdown-word-counter">
      <ToolPanel title="Markdown text" actions={<ToolButton variant="quiet" onClick={() => setValue(SAMPLE_MARKDOWN)}>{t("reset")}</ToolButton>}>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Markdown text"
          rows={19}
        />
      </ToolPanel>
      <div className={toolStyles.statGrid}>
        <Stat label="Words" value={words.toLocaleString()} />
        <Stat label="Characters" value={value.length.toLocaleString()} />
        <Stat label="Lines" value={lines.toLocaleString()} />
        <Stat label="Reading time" value={`${readingMinutes} min`} />
      </div>
    </ToolPage>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={toolStyles.stat}>
      <span className="font-mono text-xs text-muted-foreground"><ToolLabel>{label}</ToolLabel></span>
      <strong className="font-display text-3xl font-bold text-foreground">{value}</strong>
    </div>
  );
}

function htmlNodeToMarkdown(node: Node, depth = 0): string {
  if (node.nodeType === Node.TEXT_NODE)
    return (node.textContent || "").replace(/\s+/g, " ");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const element = node as HTMLElement;
  const inner = Array.from(element.childNodes)
    .map((child) => htmlNodeToMarkdown(child, depth + 1))
    .join("")
    .trim();
  switch (element.tagName.toLowerCase()) {
    case "h1":
      return `# ${inner}\n\n`;
    case "h2":
      return `## ${inner}\n\n`;
    case "h3":
      return `### ${inner}\n\n`;
    case "strong":
    case "b":
      return `**${inner}**`;
    case "em":
    case "i":
      return `*${inner}*`;
    case "code":
      return `\`${inner}\``;
    case "a":
      return `[${inner}](${element.getAttribute("href") || ""})`;
    case "br":
      return "\n";
    case "blockquote":
      return (
        inner
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") + "\n\n"
      );
    case "li":
      return `${"  ".repeat(Math.max(0, depth - 3))}- ${inner}\n`;
    case "ul":
    case "ol":
      return `${inner}\n`;
    case "pre":
      return `\n\`\`\`\n${element.textContent || ""}\n\`\`\`\n\n`;
    case "p":
    case "div":
    case "section":
      return `${inner}\n\n`;
    default:
      return inner;
  }
}

function htmlToMarkdown(value: string): string {
  const document = new DOMParser().parseFromString(value, "text/html");
  return Array.from(document.body.childNodes)
    .map((node) => htmlNodeToMarkdown(node))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function HtmlToMarkdownTool() {
  const { t } = useI18n();
  const [value, setValue] = useState(
    "<h1>Project brief</h1><p>Write <strong>focused</strong> documents.</p><ul><li>Draft</li><li>Review</li></ul>",
  );
  const output = useMemo(() => htmlToMarkdown(value), [value]);
  return (
    <ToolPage slug="html-to-markdown">
      <div className={toolStyles.splitLayout}>
        <ToolPanel title="HTML input" actions={<ToolButton variant="quiet" onClick={() => setValue("<h1>Project brief</h1><p>Write <strong>focused</strong> documents.</p><ul><li>Draft</li><li>Review</li></ul>")}>{t("reset")}</ToolButton>}>
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="HTML input"
            rows={18}
          />
        </ToolPanel>
        <ToolPanel
          title="Markdown result"
          actions={<CopyButton value={output} />}
        >
          {output ? (
            <pre className={toolStyles.codeOutput}>{output}</pre>
          ) : (
            <ToolNotice>{t("emptyHtml")}</ToolNotice>
          )}
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

import { useMemo, useState } from "react";
import { literal, useI18n } from "../i18n";
import { diffLines } from "../lib/diff";
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

export function TextDiffTool() {
  const { t } = useI18n();
  const [left, setLeft] = useState("toolmd\nmd2pdf\nmd2word");
  const [right, setRight] = useState("toolmd\nmd2pdf\nmd2pptx");
  const rows = useMemo(() => diffLines(left, right), [left, right]);
  const diffText = rows
    .map((row) => `${row.type === "added" ? "+" : row.type === "removed" ? "-" : " "} ${row.text}`)
    .join("\n");
  return (
    <ToolPage slug="text-diff">
      <div className={toolStyles.splitLayout}>
        <ToolPanel title="Original">
          <ToolTextArea
            value={left}
            onChange={setLeft}
            ariaLabel="Original text"
            rows={16}
          />
        </ToolPanel>
        <ToolPanel title="Changed">
          <ToolTextArea
            value={right}
            onChange={setRight}
            ariaLabel="Changed text"
            rows={16}
          />
        </ToolPanel>
      </div>
      <ToolPanel title="Diff result" actions={<><ToolButton variant="quiet" onClick={() => { setLeft("toolmd\nmd2pdf\nmd2word"); setRight("toolmd\nmd2pdf\nmd2pptx"); }}>{t("reset")}</ToolButton><CopyButton value={diffText} /></>}>
        <div className={toolStyles.diffOutput}>
          {rows.length ? rows.map((row, index) => (
            <div className={`whitespace-pre-wrap px-2 ${row.type === "added" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : row.type === "removed" ? "bg-orange-50 text-[#b34835] dark:bg-orange-950/40 dark:text-orange-300" : "text-slate-600 dark:text-slate-300"}`} key={`${index}-${row.text}`}>
              <span className="mr-3 inline-block w-4 text-slate-400">
                {row.type === "added"
                  ? "+"
                  : row.type === "removed"
                    ? "-"
                    : " "}
              </span>
              {row.text || " "}
            </div>
          )) : <ToolNotice>{t("emptyInput")}</ToolNotice>}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

export function RegexTesterTool() {
  const { t } = useI18n();
  const [pattern, setPattern] = useState("\\b(toolmd|md2pdf)\\b");
  const [flags, setFlags] = useState("gi");
  const [value, setValue] = useState("Build md2pdf and md2word inside toolmd.");
  const result = useMemo(() => {
    try {
      const regex = new RegExp(pattern, flags);
      const matches = flags.includes("g")
        ? Array.from(value.matchAll(regex)).map((match) => match[0])
        : (value.match(regex) || []).slice(0, 1);
      return { matches, error: "" };
    } catch (error) {
      return {
        matches: [],
        error: t("invalidRegex", { message: error instanceof Error ? error.message : "parse error" }),
      };
    }
  }, [flags, pattern, t, value]);
  return (
    <ToolPage slug="regex-tester">
      <ToolPanel title="Regular expression">
        <div className={toolStyles.inlineFields}>
          <label className={toolStyles.label}>
            <ToolLabel>Pattern</ToolLabel>
            <input
              className={toolStyles.input}
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
            />
          </label>
          <label className={toolStyles.label}>
            <ToolLabel>Flags</ToolLabel>
            <input
              className={toolStyles.input}
              value={flags}
              onChange={(event) => setFlags(event.target.value)}
            />
          </label>
        </div>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Regex test text"
          rows={10}
        />
      </ToolPanel>
      <ToolPanel title="Matches" actions={<ToolButton variant="quiet" onClick={() => { setPattern("\\b(toolmd|md2pdf)\\b"); setFlags("gi"); setValue("Build md2pdf and md2word inside toolmd."); }}>{t("reset")}</ToolButton>}>
        {result.error ? (
          <ToolNotice variant="error">{result.error}</ToolNotice>
        ) : result.matches.length ? (
          <>
            <div className={toolStyles.matchSummary}>
              {t("matchCount", { count: result.matches.length })}
            </div>
            <div className={toolStyles.chipList}>
              {result.matches.map((match, index) => (
                <code className="rounded bg-orange-50 px-2.5 py-1.5 font-mono text-sm text-[#bd4d32] dark:bg-orange-950/50 dark:text-orange-300" key={`${match}-${index}`}>
                  {match}
                </code>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={toolStyles.matchSummary}>{t("matchCount", { count: 0 })}</div>
            <div className="mt-4"><ToolNotice>{t("noMatches")}</ToolNotice></div>
          </>
        )}
        <div className={toolStyles.panelActions}>
          <CopyButton value={result.matches.join("\n")} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}
function decodeBase64(value: string): string {
  const normalized = value.trim();
  if (
    !normalized ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized) ||
    normalized.length % 4 === 1
  )
    throw new Error("Invalid Base64 input");
  const binary = atob(normalized);
  const canonical = btoa(binary).replace(/=+$/, "");
  if (canonical !== normalized.replace(/=+$/, ""))
    throw new Error("Invalid Base64 input");
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function Base64Tool() {
  const { t } = useI18n();
  const [value, setValue] = useState("Xin chào toolmd");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const result = useMemo((): { output: string; error: string } => {
    if (!value.trim()) return { output: "", error: t("emptyInput") };
    try {
      return {
        output: direction === "encode" ? encodeBase64(value) : decodeBase64(value),
        error: "",
      };
    } catch {
      return { output: "", error: t("invalidBase64") };
    }
  }, [direction, t, value]);
  return (
    <ToolPage slug="base64">
      <ToolPanel title="Base64 converter" actions={<ToolButton variant="quiet" onClick={() => { setValue("Xin chào toolmd"); setDirection("encode"); }}>{t("reset")}</ToolButton>}>
        <div className={toolStyles.segmented}>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "encode" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
            onClick={() => setDirection("encode")}
          >
            <ToolLabel>Encode</ToolLabel>
          </button>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${direction === "decode" ? "bg-white text-[#f2633d] shadow-sm dark:bg-slate-900" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"}`}
            onClick={() => setDirection("decode")}
          >
            <ToolLabel>Decode</ToolLabel>
          </button>
        </div>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Base64 input"
          rows={12}
        />
        <div className="mt-5 flex items-start gap-3">
          {result.error ? <ToolNotice variant="error">{result.error}</ToolNotice> : <pre className={`${toolStyles.codeOutput} min-w-0 flex-1`}>{result.output}</pre>}
          <CopyButton value={result.output} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function words(value: string): string[] {
  return value
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
function convertCase(value: string, mode: string): string {
  const tokens = words(value);
  if (mode === "upper") return value.toUpperCase();
  if (mode === "lower") return value.toLowerCase();
  if (mode === "title")
    return tokens
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  if (mode === "camel")
    return tokens
      .map((word, index) =>
        index
          ? word[0].toUpperCase() + word.slice(1).toLowerCase()
          : word.toLowerCase(),
      )
      .join("");
  if (mode === "snake")
    return tokens.map((word) => word.toLowerCase()).join("_");
  if (mode === "kebab")
    return tokens.map((word) => word.toLowerCase()).join("-");
  return value;
}

export function CaseConverterTool() {
  const { language, t } = useI18n();
  const [value, setValue] = useState("A Focused Markdown Workspace");
  const [mode, setMode] = useState("title");
  const output = useMemo(() => convertCase(value, mode), [mode, value]);
  return (
    <ToolPage slug="case-converter">
      <ToolPanel title="Convert text" actions={<ToolButton variant="quiet" onClick={() => { setValue("A Focused Markdown Workspace"); setMode("title"); }}>{t("reset")}</ToolButton>}>
        <select
          className={toolStyles.select}
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          <option value="upper">{literal("UPPERCASE", language)}</option>
          <option value="lower">{literal("lowercase", language)}</option>
          <option value="title">{literal("Title Case", language)}</option>
          <option value="camel">{literal("camelCase", language)}</option>
          <option value="snake">{literal("snake_case", language)}</option>
          <option value="kebab">{literal("kebab-case", language)}</option>
        </select>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Text case input"
          rows={8}
        />
        <div className="mt-5 flex items-start gap-3">
          <pre className={`${toolStyles.codeOutput} min-w-0 flex-1`}>{output}</pre>
          <CopyButton value={output} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function toSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SlugGeneratorTool() {
  const { t } = useI18n();
  const [value, setValue] = useState("Markdown, ready to print!");
  const output = useMemo(() => toSlug(value), [value]);
  return (
    <ToolPage slug="slug-generator">
      <ToolPanel title="URL slug" actions={<ToolButton variant="quiet" onClick={() => setValue("Markdown, ready to print!")}>{t("reset")}</ToolButton>}>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Slug source text"
          rows={6}
        />
        <div className="mt-5 flex items-start gap-3">
          <pre className={`${toolStyles.codeOutput} min-w-0 flex-1`}>{output}</pre>
          <CopyButton value={output} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

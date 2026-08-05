import { useMemo, useState } from "react";
import {
  CopyButton,
  ToolButton,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "../components/ToolUI";

export function TextDiffTool() {
  const [left, setLeft] = useState("toolmd\nmd2pdf\nmd2word");
  const [right, setRight] = useState("toolmd\nmd2pdf\nmd2pptx");
  const rows = useMemo(() => diffLines(left, right), [left, right]);
  return (
    <ToolPage slug="text-diff">
      <div className="toolmd-split-layout">
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
      <ToolPanel title="Diff result">
        <div className="toolmd-diff-output">
          {rows.map((row, index) => (
            <div className={row.type} key={`${index}-${row.text}`}>
              <span>
                {row.type === "added"
                  ? "+"
                  : row.type === "removed"
                    ? "-"
                    : " "}
              </span>
              {row.text || " "}
            </div>
          ))}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function diffLines(
  left: string,
  right: string,
): Array<{ type: "added" | "removed" | "same"; text: string }> {
  const a = left.split(/\r?\n/);
  const b = right.split(/\r?\n/);
  const rows: Array<{ type: "added" | "removed" | "same"; text: string }> = [];
  const max = Math.max(a.length, b.length);
  for (let index = 0; index < max; index += 1) {
    if (a[index] === b[index])
      rows.push({ type: "same", text: a[index] || "" });
    else {
      if (a[index] !== undefined)
        rows.push({ type: "removed", text: a[index] });
      if (b[index] !== undefined) rows.push({ type: "added", text: b[index] });
    }
  }
  return rows;
}

export function RegexTesterTool() {
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
        error: error instanceof Error ? error.message : "Invalid regex",
      };
    }
  }, [flags, pattern, value]);
  return (
    <ToolPage slug="regex-tester">
      <ToolPanel title="Regular expression">
        <div className="toolmd-inline-fields">
          <label className="toolmd-label">
            Pattern
            <input
              className="toolmd-input"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
            />
          </label>
          <label className="toolmd-label">
            Flags
            <input
              className="toolmd-input"
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
      <ToolPanel title="Matches">
        <div className={`toolmd-match-summary ${result.error ? "error" : ""}`}>
          {result.error ||
            `${result.matches.length} match${result.matches.length === 1 ? "" : "es"}`}
        </div>
        <div className="toolmd-chip-list">
          {result.matches.map((match, index) => (
            <code key={`${match}-${index}`}>{match}</code>
          ))}
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
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function Base64Tool() {
  const [value, setValue] = useState("Xin chào toolmd");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const result = useMemo(() => {
    try {
      return direction === "encode" ? encodeBase64(value) : decodeBase64(value);
    } catch {
      return "Invalid Base64 input";
    }
  }, [direction, value]);
  return (
    <ToolPage slug="base64">
      <ToolPanel title="Base64 converter">
        <div className="toolmd-segmented">
          <button
            className={direction === "encode" ? "selected" : ""}
            onClick={() => setDirection("encode")}
          >
            Encode
          </button>
          <button
            className={direction === "decode" ? "selected" : ""}
            onClick={() => setDirection("decode")}
          >
            Decode
          </button>
        </div>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Base64 input"
          rows={12}
        />
        <div className="toolmd-result-row">
          <pre className="toolmd-code-output">{result}</pre>
          <CopyButton value={result} />
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
  const [value, setValue] = useState("A Focused Markdown Workspace");
  const [mode, setMode] = useState("title");
  const output = useMemo(() => convertCase(value, mode), [mode, value]);
  return (
    <ToolPage slug="case-converter">
      <ToolPanel title="Convert text">
        <select
          className="toolmd-select"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          <option value="upper">UPPERCASE</option>
          <option value="lower">lowercase</option>
          <option value="title">Title Case</option>
          <option value="camel">camelCase</option>
          <option value="snake">snake_case</option>
          <option value="kebab">kebab-case</option>
        </select>
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Text case input"
          rows={8}
        />
        <div className="toolmd-result-row">
          <pre className="toolmd-code-output">{output}</pre>
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
  const [value, setValue] = useState("Markdown, ready to print!");
  const output = useMemo(() => toSlug(value), [value]);
  return (
    <ToolPage slug="slug-generator">
      <ToolPanel title="URL slug">
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Slug source text"
          rows={6}
        />
        <div className="toolmd-result-row">
          <pre className="toolmd-code-output">{output}</pre>
          <CopyButton value={output} />
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

import { useMemo, useState } from "react";
import { literal, useI18n } from "@/i18n";
import { downloadFile } from "@/lib/download";
import { listCaseVariants } from "@/lib/case";
import { slugify } from "@/lib/slug";
import {
  encodeBase64,
  decodeBase64,
  type Base64Variant,
} from "@/lib/base64";
import {
  encodeUrl,
  decodeUrl,
  parseQueryString,
  rowsToQuery,
  type UrlMode,
} from "@/lib/url";
import { computeDiff, type DiffMode } from "@/lib/textDiff";
import { evaluateRegex, REGEX_FLAGS } from "@/lib/regex";
import {
  CopyButton,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import { ToolExamples } from "@/components/ToolSupport";
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

const DIFF_SAMPLES = [
  {
    label: "Release notes",
    description: "Two versions of a changelog",
    left: "toolmd 1.0\n- md2pdf\n- md2word",
    right: "toolmd 1.1\n- md2pdf\n- md2word\n- md2pptx",
  },
  {
    label: "API JSON",
    description: "Before / after refactor",
    left: '{\n  "id": 1,\n  "name": "toolmd"\n}',
    right: '{\n  "id": 1,\n  "name": "toolmd",\n  "version": "1.1"\n}',
  },
];

export function TextDiffTool() {
  const { t } = useI18n();
  const initial = DIFF_SAMPLES[0];
  const [left, setLeft] = useState(initial.left);
  const [right, setRight] = useState(initial.right);
  const [mode, setMode] = useState<DiffMode>("line");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const rows = useMemo(
    () =>
      computeDiff(left, right, mode, { ignoreCase, ignoreWhitespace }),
    [ignoreCase, ignoreWhitespace, left, mode, right],
  );
  const diffText = rows
    .map((row) => `${row.type === "added" ? "+" : row.type === "removed" ? "-" : " "} ${row.text}`)
    .join("\n");
  return (
    <ToolPage slug="text-diff">
      <div className={gridSplit}>
        <ToolPanel
          title="Original"
          actions={
            <OutputActions
              onReset={() => {
                setLeft(initial.left);
                setRight(initial.right);
              }}
              onClear={() => setLeft("")}
              onCopy={async () => {
                await navigator.clipboard.writeText(left);
              }}
            />
          }
        >
          <ToolTextArea
            value={left}
            onChange={setLeft}
            ariaLabel="Original text"
            rows={16}
          />
        </ToolPanel>
        <ToolPanel
          title="Changed"
          actions={
            <OutputActions
              onReset={() => {
                setLeft(initial.left);
                setRight(initial.right);
              }}
              onSwap={() => {
                const oldLeft = left;
                setLeft(right);
                setRight(oldLeft);
              }}
              onClear={() => setRight("")}
              onCopy={async () => {
                await navigator.clipboard.writeText(right);
              }}
            />
          }
        >
          <ToolTextArea
            value={right}
            onChange={setRight}
            ariaLabel="Changed text"
            rows={16}
          />
        </ToolPanel>
      </div>
      <ToolPanel
        title="Diff result"
        actions={
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Field label="Mode">
              <Select value={mode} onValueChange={(v: string) => setMode(v as DiffMode)}>
                <SelectTrigger className="h-8 w-[120px] font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="word">Word</SelectItem>
                  <SelectItem value="char">Character</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={ignoreCase}
                onCheckedChange={(value) => setIgnoreCase(Boolean(value))}
              />
              Ignore case
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={ignoreWhitespace}
                onCheckedChange={(value) => setIgnoreWhitespace(Boolean(value))}
              />
              Ignore whitespace
            </label>
            <CopyButton value={diffText} />
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadFile("diff.txt", diffText, "text/plain;charset=utf-8")
              }
            >
              Download
            </Button>
          </div>
        }
      >
        <div className={toolStyles.diffOutput}>
          {rows.length ? (
            rows.map((row, index) => (
              <div
                className={cn(
                  "whitespace-pre-wrap px-2 font-mono text-sm",
                  row.type === "added" &&
                    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                  row.type === "removed" &&
                    "bg-primary/10 text-destructive dark:bg-primary/10 dark:text-primary",
                  row.type === "unchanged" && "text-foreground",
                )}
                key={`${index}-${row.text}`}
              >
                <span className="mr-3 inline-block w-4 text-muted-foreground">
                  {row.type === "added"
                    ? "+"
                    : row.type === "removed"
                      ? "-"
                      : " "}
                </span>
                {row.text || " "}
              </div>
            ))
          ) : (
            <ToolNotice>{t("emptyInput")}</ToolNotice>
          )}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

const REGEX_SAMPLES = [
  {
    label: "Word boundary",
    description: "Match whole words like toolmd",
    pattern: "\\b(toolmd|md2pdf)\\b",
    value: "Build md2pdf and md2word inside toolmd.",
  },
  {
    label: "Email",
    description: "Loose RFC-5322-ish check",
    pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+",
    value: "Email support@toolmd.pages.dev or sales@toolmd.dev",
  },
  {
    label: "Hex color",
    description: "3, 4, 6 or 8 digit hex codes",
    pattern: "#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b",
    value: "Brand #F2633D, accent #1f1, code #1A2B3C4D",
  },
];

export function RegexTesterTool() {
  const { t } = useI18n();
  const initial = REGEX_SAMPLES[0];
  const [pattern, setPattern] = useState(initial.pattern);
  const [selectedFlags, setSelectedFlags] = useState<string[]>(["g", "i"]);
  const [value, setValue] = useState(initial.value);
  const flags = selectedFlags.join("");
  const result = useMemo(
    () => evaluateRegex(pattern, flags, value),
    [flags, pattern, value],
  );
  function toggleFlag(flag: string, enabled: boolean): void {
    setSelectedFlags((current) => {
      if (enabled) {
        return current.includes(flag) ? current : [...current, flag];
      }
      return current.filter((entry) => entry !== flag);
    });
  }
  return (
    <ToolPage slug="regex-tester">
      <ToolPanel
        title="Regular expression"
        actions={
          <OutputActions
            onReset={() => {
              setPattern(initial.pattern);
              setValue(initial.value);
              setSelectedFlags(["g", "i"]);
            }}
            onCopy={async () => {
              await navigator.clipboard.writeText(value);
            }}
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pattern">
            <Input
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              className="h-9 font-mono"
            />
          </Field>
          <Field label="Flags" hint="Tap to toggle supported flags">
            <div className="flex flex-wrap gap-2">
              {REGEX_FLAGS.map((entry) => {
                const enabled = selectedFlags.includes(entry.flag);
                return (
                  <button
                    type="button"
                    key={entry.flag}
                    onClick={() => toggleFlag(entry.flag, !enabled)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-mono",
                      enabled
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input bg-background text-muted-foreground",
                    )}
                    aria-pressed={enabled}
                    title={entry.description}
                  >
                    {entry.flag}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>
        <ToolTextArea
          className="mt-4"
          value={value}
          onChange={setValue}
          ariaLabel="Regex test text"
          rows={10}
        />
        <ToolExamples
          className="mt-3"
          examples={REGEX_SAMPLES.map((sample) => ({
            label: sample.label,
            description: sample.description,
            value: sample.value,
          }))}
          onSelect={(next) => {
            const sample = REGEX_SAMPLES.find((entry) => entry.value === next);
            if (sample) {
              setPattern(sample.pattern);
              setValue(sample.value);
            } else {
              setValue(next);
            }
          }}
        />
      </ToolPanel>
      <ToolPanel
        title="Matches"
        actions={
          <CopyButton
            value={result.matches
              .map((match) => match.match)
              .join("\n")}
          />
        }
      >
        {result.error ? (
          <ToolNotice variant="error">{result.error.message}</ToolNotice>
        ) : result.matches.length ? (
          <div className="space-y-2">
            <div className={toolStyles.matchSummary}>
              {t("matchCount", { count: result.matches.length })}
            </div>
            <ul className="space-y-1.5 font-mono text-sm">
              {result.matches.map((match, index) => (
                <li
                  key={`${match.index}-${index}`}
                  className="rounded-md border border-border bg-muted/30 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-primary">
                      {match.match || "∅"}
                    </code>
                    <span className="text-[11px] text-muted-foreground">
                      [{match.index}–{match.end}]
                    </span>
                  </div>
                  {match.groups.length > 0 && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Groups:{" "}
                      {match.groups
                        .map((group, groupIndex) => `$${groupIndex + 1}=${group.value || "∅"}`)
                        .join(" · ")}
                    </div>
                  )}
                  {Object.keys(match.namedGroups).length > 0 && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Named:{" "}
                      {Object.entries(match.namedGroups)
                        .map(([name, value]) => `${name}=${value || "∅"}`)
                        .join(" · ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ToolNotice>{t("noMatches")}</ToolNotice>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

const BASE64_SAMPLES = [
  { label: "Vietnamese", description: "Xin chào toolmd", value: "Xin chào toolmd" },
  { label: "URL", description: "Encode a URL", value: "https://toolmd.pages.dev/md2pdf/?q=markdown" },
  { label: "Long", description: "Lorem ipsum paragraph", value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
];

export function Base64Tool() {
  const { t } = useI18n();
  const [value, setValue] = useState("Xin chào toolmd");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const result = useMemo<{ ok: boolean; value: string; error: string }>(() => {
    if (!value.trim()) return { ok: false, value: "", error: t("emptyInput") };
    const r = direction === "encode"
      ? encodeBase64(value, variant)
      : decodeBase64(value, variant);
    if (r.ok) return { ok: true, value: r.value, error: "" };
    return { ok: false, value: "", error: r.error };
  }, [direction, t, value, variant]);
  const output = result.value;
  return (
    <ToolPage slug="base64">
      <ToolPanel
        title="Base64 converter"
        actions={
          <OutputActions
            onReset={() => {
              setValue("Xin chào toolmd");
              setDirection("encode");
              setVariant("standard");
            }}
            onSwap={() => {
              if (!output) return;
              setDirection((d) => (d === "encode" ? "decode" : "encode"));
              setValue(output);
            }}
            onClear={() => setValue("")}
            onCopy={async () => {
              await navigator.clipboard.writeText(output);
            }}
            onDownload={() =>
              downloadFile("base64.txt", output, "text/plain;charset=utf-8")
            }
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Direction">
            <div className="inline-flex h-9 w-full overflow-hidden rounded-md border border-input">
              <button
                type="button"
                onClick={() => setDirection("encode")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "encode"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                Encode
              </button>
              <button
                type="button"
                onClick={() => setDirection("decode")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "decode"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                Decode
              </button>
            </div>
          </Field>
          <Field label="Variant">
            <Select
              value={variant}
              onValueChange={(v: string) => setVariant(v as Base64Variant)}
            >
              <SelectTrigger className="h-9 w-full font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="url">Base64URL (padded)</SelectItem>
                <SelectItem value="url-nopad">Base64URL (unpadded)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <ToolTextArea
          className="mt-4"
          value={value}
          onChange={setValue}
          ariaLabel="Base64 input"
          rows={10}
        />
        <div className="mt-4 flex items-start gap-3">
          {result.ok ? (
            <pre className={cn(toolStyles.codeOutput, "min-w-0 flex-1")}>
              {output || " "}
            </pre>
          ) : (
            <ToolNotice variant="error">{result.error}</ToolNotice>
          )}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

const CASE_SAMPLES = [
  { label: "Sentence", description: "Mixed English sentence", value: "A focused markdown workspace" },
  { label: "CamelCase", description: "Already a JavaScript identifier", value: "getUserById" },
  { label: "API path", description: "URL-style snake/kebab mix", value: "toolmd/md2pdf/v1" },
];

export function CaseConverterTool() {
  const { language, t } = useI18n();
  const [value, setValue] = useState("A Focused Markdown Workspace");
  const variants = useMemo(() => listCaseVariants(value), [value]);
  return (
    <ToolPage slug="case-converter">
      <ToolPanel
        title="Convert text"
        actions={
          <OutputActions
            onReset={() => setValue("A Focused Markdown Workspace")}
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
          ariaLabel="Text case input"
          rows={6}
        />
        <ToolExamples
          className="mt-3"
          examples={CASE_SAMPLES}
          onSelect={setValue}
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-sm"
            >
              <span className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {variant.label}
                </span>
                <code className="truncate text-foreground">{variant.value || "—"}</code>
              </span>
              <CopyButton value={variant.value} label="Copy" />
            </div>
          ))}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

export function SlugGeneratorTool() {
  const { t } = useI18n();
  const [value, setValue] = useState("Markdown, ready to print!");
  const [separator, setSeparator] = useState("-");
  const [maxLength, setMaxLength] = useState(80);
  const [lowercase, setLowercase] = useState(true);
  const [preserveUnicode, setPreserveUnicode] = useState(false);
  const output = useMemo(
    () => slugify(value, { separator, maxLength, lowercase, preserveUnicode }),
    [lowercase, maxLength, preserveUnicode, separator, value],
  );
  return (
    <ToolPage slug="slug-generator">
      <ToolPanel
        title="URL slug"
        actions={
          <OutputActions
            onReset={() => {
              setValue("Markdown, ready to print!");
              setSeparator("-");
              setMaxLength(80);
              setLowercase(true);
              setPreserveUnicode(false);
            }}
            onClear={() => setValue("")}
            onCopy={async () => {
              await navigator.clipboard.writeText(output);
            }}
          />
        }
      >
        <ToolTextArea
          value={value}
          onChange={setValue}
          ariaLabel="Slug source text"
          rows={6}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Separator">
            <Select value={separator} onValueChange={setSeparator}>
              <SelectTrigger className="h-9 w-full font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Hyphen -</SelectItem>
                <SelectItem value="_">Underscore _</SelectItem>
                <SelectItem value=".">Dot .</SelectItem>
                <SelectItem value="+">Plus +</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Max length">
            <Input
              type="number"
              min={1}
              max={500}
              value={maxLength}
              onChange={(event) =>
                setMaxLength(Math.max(1, Math.min(500, Number(event.target.value) || 80)))
              }
              className="h-9 font-mono"
            />
          </Field>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={lowercase}
              onCheckedChange={(value) => setLowercase(Boolean(value))}
            />
            Lowercase
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={preserveUnicode}
              onCheckedChange={(value) => setPreserveUnicode(Boolean(value))}
            />
            Preserve Unicode letters
          </label>
        </div>
        <div className="mt-4 flex items-start gap-3">
          <pre className={cn(toolStyles.codeOutput, "min-w-0 flex-1")}>
            {output || "—"}
          </pre>
        </div>
        {!output && value && (
          <ToolNotice variant="warning">
            No slug produced. Try enabling 'Preserve Unicode' or use Latin characters.
          </ToolNotice>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

export function UrlCodecTool() {
  const { t } = useI18n();
  const [value, setValue] = useState("https://toolmd.pages.dev/md2pdf/?q=markdown & more");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [mode, setMode] = useState<UrlMode>("component");
  const result = useMemo<{ ok: boolean; value: string; error: string }>(() => {
    if (!value.trim()) return { ok: false, value: "", error: t("emptyInput") };
    if (direction === "encode") {
      return { ok: true, value: encodeUrl(value, mode), error: "" };
    }
    const r = decodeUrl(value, mode);
    if (r.ok) return { ok: true, value: r.value, error: "" };
    return { ok: false, value: "", error: r.error };
  }, [direction, mode, t, value]);
  const output = result.value;
  const rows = useMemo(
    () => (mode === "form" && direction === "decode" ? parseQueryString(value) : []),
    [direction, mode, value],
  );
  return (
    <ToolPage slug="url-codec">
      <ToolPanel
        title="URL encoder / decoder"
        actions={
          <OutputActions
            onReset={() => {
              setValue("https://toolmd.pages.dev/md2pdf/?q=markdown & more");
              setDirection("encode");
              setMode("component");
            }}
            onSwap={() => {
              if (!output) return;
              setDirection((d) => (d === "encode" ? "decode" : "encode"));
              setValue(output);
            }}
            onClear={() => setValue("")}
            onCopy={async () => {
              await navigator.clipboard.writeText(output);
            }}
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Direction">
            <div className="inline-flex h-9 w-full overflow-hidden rounded-md border border-input">
              <button
                type="button"
                onClick={() => setDirection("encode")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "encode"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                Encode
              </button>
              <button
                type="button"
                onClick={() => setDirection("decode")}
                className={cn(
                  "flex-1 text-sm transition-colors",
                  direction === "decode"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                Decode
              </button>
            </div>
          </Field>
          <Field label="Mode">
            <Select
              value={mode}
              onValueChange={(v: string) => setMode(v as UrlMode)}
            >
              <SelectTrigger className="h-9 w-full font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="component">Component</SelectItem>
                <SelectItem value="full">Full URL</SelectItem>
                <SelectItem value="form">Form (application/x-www-form-urlencoded)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <ToolTextArea
          className="mt-4"
          value={value}
          onChange={setValue}
          ariaLabel="URL input"
          rows={6}
        />
        {!result.ok && result.error && (
          <ToolNotice variant="error">{result.error}</ToolNotice>
        )}
        <pre className={cn(toolStyles.codeOutput, "mt-4 min-w-0")}>
          {output || " "}
        </pre>
        {rows.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-mono text-xs text-muted-foreground">
              Parsed query parameters
            </p>
            <div className="overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Key</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Raw</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="even:bg-muted/20">
                      <td className="px-3 py-1.5 font-mono">{row.key}</td>
                      <td className="px-3 py-1.5 font-mono">{row.value}</td>
                      <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">
                        {row.encodedKey}={row.encodedValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => {
                setValue(rowsToQuery(rows));
                setDirection("encode");
              }}
            >
              Rebuild from rows
            </Button>
          </div>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

const gridSplit = "grid gap-4 lg:grid-cols-2";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
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

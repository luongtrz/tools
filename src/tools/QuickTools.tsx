import { useEffect, useMemo, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { literal, useI18n } from "@/i18n";
import {
  CopyButton,
  ToolNotice,
  ToolPage,
  ToolPanel,
  ToolTextArea,
} from "@/components/ToolUI";
import { OutputActions } from "@/components/OutputActions";
import { downloadFile } from "@/lib/download";
import { generateUUID, formatUuidList, type UuidFormat } from "@/lib/uuid";
import {
  buildCharset,
  generatePassword,
  passwordStrengthLabel,
  type PasswordOptions,
} from "@/lib/password";
import {
  contrastRatio,
  hexToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
} from "@/lib/color";
import { QR_PRESETS } from "@/lib/qrPresets";
import { ToolExamples } from "@/components/ToolSupport";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QrGeneratorTool() {
  const { language, t } = useI18n();
  const initialValue = "https://toolmd.pages.dev/md2pdf/";
  const [value, setValue] = useState(initialValue);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [size, setSize] = useState(320);
  const [margin, setMargin] = useState(2);
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("M");
  const [darkColor, setDarkColor] = useState("#172235");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [svgString, setSvgString] = useState("");

  useEffect(() => {
    let active = true;
    if (!value.trim()) {
      setDataUrl("");
      setSvgString("");
      setError(t("qrEmpty"));
      setBusy(false);
      return () => {
        active = false;
      };
    }
    setDataUrl("");
    setSvgString("");
    setBusy(true);
    setError("");
    Promise.all([
      QRCode.toDataURL(value || " ", {
        width: size,
        margin,
        errorCorrectionLevel: ecc,
        color: { dark: darkColor, light: lightColor },
      }),
      QRCode.toString(value || " ", {
        type: "svg",
        margin,
        errorCorrectionLevel: ecc,
        color: { dark: darkColor, light: lightColor },
      }),
    ])
      .then(([png, svg]) => {
        if (active) {
          setDataUrl(png);
          setSvgString(svg);
          setBusy(false);
        }
      })
      .catch(() => {
        if (active) {
          setDataUrl("");
          setSvgString("");
          setError(t("qrFailed"));
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [darkColor, ecc, lightColor, margin, size, t, value]);

  function downloadPng(): void {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "toolmd-qr.png";
    link.click();
  }

  function downloadSvg(): void {
    if (!svgString) return;
    downloadFile("toolmd-qr.svg", svgString, "image/svg+xml;charset=utf-8");
  }

  return (
    <ToolPage slug="qr-generator">
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel title="Text or URL">
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="QR content"
            rows={8}
          />
          <ToolExamples
            className="mt-4"
            examples={QR_PRESETS.map((preset) => ({
              label: preset.label,
              description: "Apply preset",
              value: preset.toString(),
            }))}
            onSelect={setValue}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Size (px)"
              value={size}
              min={120}
              max={1024}
              step={20}
              onChange={setSize}
            />
            <NumberField
              label="Margin"
              value={margin}
              min={0}
              max={8}
              step={1}
              onChange={setMargin}
            />
            <Field label="Error correction">
              <Select value={ecc} onValueChange={(v: string) => setEcc(v as typeof ecc)}>
                <SelectTrigger className="h-9 w-full font-mono text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">L (7%)</SelectItem>
                  <SelectItem value="M">M (15%)</SelectItem>
                  <SelectItem value="Q">Q (25%)</SelectItem>
                  <SelectItem value="H">H (30%)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Dark color">
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-1"
              />
            </Field>
            <Field label="Light color">
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-1"
              />
            </Field>
          </div>
        </ToolPanel>
        <ToolPanel
          title="QR preview"
          actions={
            <OutputActions
              onReset={() => setValue(initialValue)}
              onCopy={async () => {
                await navigator.clipboard.writeText(value);
              }}
              onDownload={downloadPng}
              downloadLabel="PNG"
            />
          }
        >
          <div className="grid place-items-center rounded-md border border-border bg-background p-6">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={literal("Generated QR code", language)}
                className="h-auto w-full max-w-[360px]"
              />
            ) : (
              <ToolNotice>{error || t("processing")}</ToolNotice>
            )}
          </div>
          {dataUrl && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {busy ? t("processing") : `PNG + SVG ready`}
              </span>
              <Button variant="ghost" size="sm" onClick={downloadSvg}>
                Download SVG
              </Button>
            </div>
          )}
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

const MAX_UUIDS = 200;

export function UuidGeneratorTool() {
  const { t } = useI18n();
  const [countInput, setCountInput] = useState("5");
  const count = useMemo(() => {
    const n = Number(countInput);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(MAX_UUIDS, Math.floor(n)));
  }, [countInput]);
  const [values, setValues] = useState<string[]>(() => generateUUID(5));
  const [format, setFormat] = useState<UuidFormat>("lines");

  function generate(): void {
    setValues(generateUUID(count));
  }

  function handleReset(): void {
    setCountInput("5");
    setFormat("lines");
    setValues(generateUUID(5));
  }

  const output = useMemo(() => formatUuidList(values, format), [values, format]);
  const countError =
    Number(countInput) > MAX_UUIDS
      ? `Limited to ${MAX_UUIDS} per batch`
      : null;

  return (
    <ToolPage slug="uuid-generator">
      <ToolPanel
        title="UUID v4 generator"
        actions={
          <OutputActions
            onReset={handleReset}
            onCopy={async () => {
              await navigator.clipboard.writeText(output);
            }}
            onDownload={() => {
              const ext =
                format === "json" ? "json" : format === "csv" ? "csv" : "txt";
              const mime =
                format === "json"
                  ? "application/json"
                  : format === "csv"
                    ? "text/csv"
                    : "text/plain";
              downloadFile(`uuids.${ext}`, output, `${mime};charset=utf-8`);
            }}
            downloadLabel={`Download ${format.toUpperCase()}`}
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="Count"
            value={count}
            min={1}
            max={MAX_UUIDS}
            step={1}
            onChange={(v: number) => setCountInput(String(v))}
            hint={countError ?? `${count} UUID${count === 1 ? "" : "s"}`}
          />
          <Field label="Output format">
            <Select value={format} onValueChange={(v: string) => setFormat(v as UuidFormat)}>
              <SelectTrigger className="h-9 w-full font-mono text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lines">Lines</SelectItem>
                <SelectItem value="json">JSON array</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="sql">SQL IN list</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-4">
          <Button onClick={generate} className="w-full sm:w-auto">
            Generate UUIDs
          </Button>
        </div>
        <div className="mt-4 max-h-[420px] overflow-auto rounded-md border border-border bg-muted/30 font-mono text-sm">
          {values.length ? (
            format === "json" ? (
              <pre className="whitespace-pre-wrap p-4 text-foreground">
                {output}
              </pre>
            ) : format === "csv" ? (
              <pre className="whitespace-pre-wrap p-4 text-foreground">
                {output}
              </pre>
            ) : format === "sql" ? (
              <pre className="whitespace-pre-wrap p-4 text-foreground">
                {output}
              </pre>
            ) : (
              <ul className="divide-y divide-border">
                {values.map((value) => (
                  <li
                    className="flex items-center justify-between gap-3 px-4 py-2"
                    key={value}
                  >
                    <code className="text-foreground">{value}</code>
                    <CopyButton value={value} label="Copy" />
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className="p-4 text-muted-foreground">No UUIDs yet.</p>
          )}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

const DEFAULT_PASSWORD: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  customSymbols: "!@#$%^&*()-_=+[]{};:,.<>/?",
  excludeAmbiguous: true,
};

export function PasswordGeneratorTool() {
  const { t } = useI18n();
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD);
  const [history, setHistory] = useState<string[]>([]);
  const generated = useMemo(() => generatePassword(options), [options]);
  const strength = passwordStrengthLabel(generated.entropy);
  const charset = buildCharset(options);
  const noCharset = charset.length === 0;

  function generate(): void {
    if (noCharset) return;
    setOptions((prev) => {
      const result = generatePassword(prev);
      setHistory((existing) => [result.password, ...existing].slice(0, 5));
      return prev;
    });
  }

  function update<K extends keyof PasswordOptions>(
    key: K,
    value: PasswordOptions[K],
  ): void {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <ToolPage slug="password-generator">
      <ToolPanel
        title="Secure password"
        actions={
          <OutputActions
            onReset={() => setOptions(DEFAULT_PASSWORD)}
            onCopy={async () => {
              await navigator.clipboard.writeText(generated.password);
            }}
            onDownload={() =>
              downloadFile(
                "password.txt",
                generated.password,
                "text/plain;charset=utf-8",
              )
            }
            downloadLabel="Download"
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            label="Length"
            value={options.length}
            min={4}
            max={128}
            step={1}
            onChange={(v) => update("length", v)}
          />
          <ToggleField
            label="Uppercase A-Z"
            checked={options.uppercase}
            onChange={(v) => update("uppercase", v)}
          />
          <ToggleField
            label="Lowercase a-z"
            checked={options.lowercase}
            onChange={(v) => update("lowercase", v)}
          />
          <ToggleField
            label="Numbers 0-9"
            checked={options.numbers}
            onChange={(v) => update("numbers", v)}
          />
          <ToggleField
            label="Symbols"
            checked={options.symbols}
            onChange={(v) => update("symbols", v)}
          />
          <ToggleField
            label="Exclude ambiguous (I1lO0)"
            checked={options.excludeAmbiguous}
            onChange={(v) => update("excludeAmbiguous", v)}
          />
        </div>
        {options.symbols && (
          <Field
            label="Custom symbol set"
            hint="Used when Symbols is on. Falls back to defaults if empty."
          >
            <Input
              value={options.customSymbols}
              onChange={(event) =>
                update("customSymbols", event.target.value)
              }
              className="h-9 font-mono"
              placeholder="!@#$%^&*"
            />
          </Field>
        )}
        {noCharset && (
          <ToolNotice variant="warning">
            Enable at least one character class.
          </ToolNotice>
        )}
        <div className="mt-4 rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-base text-foreground">
          {noCharset ? "—" : generated.password}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-medium",
              strength.tone === "weak" &&
                "bg-destructive/10 text-destructive",
              strength.tone === "fair" &&
                "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
              strength.tone === "good" &&
                "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
              strength.tone === "strong" &&
                "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
            )}
          >
            {strength.label}
          </span>
          <span className="font-mono text-muted-foreground">
            {generated.entropy.toFixed(1)} bits · {charset.length} chars
          </span>
          <Button onClick={generate} disabled={noCharset}>
            Generate password
          </Button>
        </div>
        {history.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-mono text-xs text-muted-foreground">
              Recent (kept in memory only)
            </p>
            <ul className="space-y-1 font-mono text-xs">
              {history.map((entry, index) => (
                <li
                  key={`${entry}-${index}`}
                  className="flex items-center justify-between gap-2 rounded border border-border bg-background px-3 py-1.5"
                >
                  <code className="truncate text-foreground">{entry}</code>
                  <CopyButton value={entry} label="Copy" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </ToolPanel>
    </ToolPage>
  );
}

const COLOR_PRESETS = [
  { label: "Brand orange", value: "#F2633D" },
  { label: "Slate", value: "#475569" },
  { label: "Forest", value: "#16A34A" },
  { label: "Sky", value: "#0EA5E9" },
  { label: "Violet", value: "#7C3AED" },
  { label: "Coal", value: "#111B2C" },
];

export function ColorPickerTool() {
  const { t } = useI18n();
  const [hex, setHex] = useState("#F2633D");
  const [alpha, setAlpha] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [background, setBackground] = useState("#FFFFFF");
  const [backgroundDark, setBackgroundDark] = useState("#0F1724");

  const rgb = useMemo(() => {
    const parsed = parseColor(hex) ?? hexToRgb(`#${hex.replace("#", "").padEnd(6, "0").slice(0, 6)}`);
    if (!parsed) return null;
    return { ...parsed, a: alpha };
  }, [alpha, hex]);

  useEffect(() => {
    const parsed = parseColor(hex);
    if (!parsed && hex) {
      setError("Enter a valid HEX (3/4/6/8) or rgb()/hsl() value");
    } else {
      setError(null);
    }
  }, [hex]);

  const values = useMemo(() => {
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b, rgb.a),
      hexNoAlpha: rgbToHex(rgb.r, rgb.g, rgb.b, 1),
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`,
      hsl: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
      hsla: `hsla(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%, ${alpha.toFixed(2)})`,
    };
  }, [alpha, rgb]);

  const contrast = useMemo(() => {
    if (!rgb) return null;
    return {
      light: contrastRatio(rgb, parseColor(background) ?? { r: 255, g: 255, b: 255 }),
      dark: contrastRatio(rgb, parseColor(backgroundDark) ?? { r: 15, g: 23, b: 36 }),
    };
  }, [background, backgroundDark, rgb]);

  function setFromHex(value: string): void {
    setHex(value);
  }

  function setFromRgb(red: number, green: number, blue: number, a = 1): void {
    setHex(rgbToHex(red, green, blue, a));
    setAlpha(a);
  }

  return (
    <ToolPage slug="color-picker">
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel title="Pick a color" actions={
          <OutputActions
            onReset={() => {
              setHex("#F2633D");
              setAlpha(1);
            }}
            onCopy={async () => {
              if (values) await navigator.clipboard.writeText(values.hex);
            }}
          />
        }>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={hex.slice(0, 7)}
              onChange={(event) => setFromHex(event.target.value)}
              className="h-12 w-12 cursor-pointer rounded-md border border-input"
              aria-label="Color picker"
            />
            <div
              className="size-16 rounded-md border border-border"
              style={{ background: hex }}
              aria-hidden="true"
            />
            <Input
              value={hex}
              onChange={(event) => setHex(event.target.value)}
              className="h-9 max-w-[180px] font-mono"
              aria-label="Color value"
              spellCheck={false}
            />
            <Input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(event) => setAlpha(Math.min(1, Math.max(0, Number(event.target.value))))}
              className="h-9 max-w-[80px] font-mono"
              aria-label="Alpha"
            />
          </div>
          {error && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setFromHex(preset.value)}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs hover:border-primary/40"
              >
                <span
                  className="size-3 rounded-sm border border-border"
                  style={{ background: preset.value }}
                />
                {preset.label}
              </button>
            ))}
          </div>
          {values && (
            <div className="mt-4 grid gap-2">
              <ColorRow label="HEX" value={values.hex} onPick={setFromHex} />
              <ColorRow label="HEX (no alpha)" value={values.hexNoAlpha} onPick={setFromHex} />
              <ColorRow
                label="RGB"
                value={values.rgb}
                onPick={(v) => {
                  const parsed = parseColor(v);
                  if (parsed) setFromRgb(parsed.r, parsed.g, parsed.b, parsed.a);
                }}
              />
              <ColorRow label="RGBA" value={values.rgba} onPick={setFromHex} />
              <ColorRow label="HSL" value={values.hsl} onPick={setFromHex} />
              <ColorRow label="HSLA" value={values.hsla} onPick={setFromHex} />
            </div>
          )}
        </ToolPanel>
        <ToolPanel title="Accessibility">
          {contrast ? (
            <div className="grid gap-3">
              <ContrastRow
                label="On white"
                background={background}
                onBackgroundChange={setBackground}
                ratio={contrast.light}
                color={hex}
              />
              <ContrastRow
                label="On dark"
                background={backgroundDark}
                onBackgroundChange={setBackgroundDark}
                ratio={contrast.dark}
                color={hex}
              />
              <p className="font-mono text-xs text-muted-foreground">
                WCAG AA needs ≥ 4.5 for text, AAA needs ≥ 7.0.
              </p>
            </div>
          ) : (
            <ToolNotice>Enter a valid color to see contrast.</ToolNotice>
          )}
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

function ColorRow({
  label,
  value,
  onPick,
}: {
  label: string;
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(value)}
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-left font-mono text-sm hover:border-primary/40"
    >
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span className="flex-1 truncate text-foreground">{value}</span>
      <CopyButton value={value} label="Copy" />
    </button>
  );
}

function ContrastRow({
  label,
  background,
  onBackgroundChange,
  ratio,
  color,
}: {
  label: string;
  background: string;
  onBackgroundChange: (v: string) => void;
  ratio: number;
  color: string;
}) {
  const aa = ratio >= 4.5;
  const aaa = ratio >= 7;
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-mono text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">
          {ratio.toFixed(2)}:1
        </span>
      </div>
      <div
        className="mt-2 rounded-md p-3 text-sm font-medium"
        style={{ background, color }}
      >
        Aa Bb Cc 123
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <input
          type="color"
          value={background}
          onChange={(event) => onBackgroundChange(event.target.value)}
          className="h-8 w-12 rounded border border-input"
          aria-label={`${label} background`}
        />
        <div className="flex gap-2 text-[11px]">
          <Pill active={aa}>AA</Pill>
          <Pill active={aaa}>AAA</Pill>
        </div>
      </div>
    </div>
  );
}

function Pill({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
        active
          ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
          : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
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
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 font-mono"
      />
    </Field>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-9 items-center justify-between gap-2 rounded-md border px-3 text-sm transition-colors",
        checked
          ? "border-primary bg-primary/10 text-foreground"
          : "border-input bg-background text-muted-foreground hover:border-primary/40",
      )}
      role="switch"
      aria-checked={checked}
    >
      <span className="truncate text-left text-sm">{label}</span>
      <span
        className={cn(
          "size-4 rounded-full border-2 transition-colors",
          checked
            ? "border-primary bg-primary"
            : "border-input bg-background",
        )}
      />
    </button>
  );
}

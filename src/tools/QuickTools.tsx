import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useI18n } from "../i18n";
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

export function QrGeneratorTool() {
  const { t } = useI18n();
  const initialValue = "https://toolmd.pages.dev/md2pdf/";
  const [value, setValue] = useState(initialValue);
  const [dataUrl, setDataUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (!value.trim()) {
      setDataUrl("");
      setError(t("qrEmpty"));
      setBusy(false);
      return () => {
        active = false;
      };
    }
    setDataUrl("");
    setBusy(true);
    setError("");
    QRCode.toDataURL(value || " ", {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#172235", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setBusy(false);
        }
      })
      .catch(() => {
        if (active) {
          setDataUrl("");
          setError(t("qrFailed"));
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, [t, value]);
  function download(): void {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "toolmd-qr.png";
    link.click();
  }
  return (
    <ToolPage slug="qr-generator">
      <div className={toolStyles.splitLayout}>
        <ToolPanel title="Text or URL">
          <ToolTextArea
            value={value}
            onChange={setValue}
            ariaLabel="QR content"
            rows={9}
          />
        </ToolPanel>
        <ToolPanel
          title="QR preview"
          actions={
            <div className="flex flex-wrap gap-2">
              <ToolButton variant="quiet" onClick={() => setValue(initialValue)}>{t("reset")}</ToolButton>
              <CopyButton value={value} />
              <ToolButton onClick={download} disabled={!dataUrl} busy={busy}>
                {busy ? t("processing") : "Download PNG"}
              </ToolButton>
            </div>
          }
        >
          <div className={toolStyles.qrPreview}>
            {dataUrl ? <img src={dataUrl} alt="Generated QR code" /> : <ToolNotice>{error || t("processing")}</ToolNotice>}
          </div>
        </ToolPanel>
      </div>
    </ToolPage>
  );
}

function createUuid(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function UuidGeneratorTool() {
  const { t } = useI18n();
  const [count, setCount] = useState(5);
  const [values, setValues] = useState<string[]>(() =>
    Array.from({ length: 5 }, createUuid),
  );
  function generate(): void {
    const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(50, count)) : 1;
    setValues(
      Array.from({ length: safeCount }, createUuid),
    );
  }
  return (
    <ToolPage slug="uuid-generator">
      <ToolPanel title="UUID v4 generator" actions={<ToolButton variant="quiet" onClick={() => { setCount(5); setValues(Array.from({ length: 5 }, createUuid)); }}>{t("reset")}</ToolButton>}>
        <div className={toolStyles.panelActions}>
          <label className={toolStyles.label}>
            <ToolLabel>Count</ToolLabel>
            <input
              className={toolStyles.input}
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(event) => setCount(Number(event.target.value) || 1)}
            />
          </label>
          <ToolButton onClick={generate}>Generate UUIDs</ToolButton>
        </div>
        <div className={toolStyles.listOutput}>
          {values.map((value) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" key={value}>
              <code className="min-w-0 overflow-auto font-mono text-sm text-slate-700 dark:text-slate-200">{value}</code>
              <CopyButton value={value} />
            </div>
          ))}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function generatePassword(length: number, symbols: boolean): string {
  const alphabet = `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789${symbols ? "!@#$%^&*_-+=" : ""}`;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function PasswordGeneratorTool() {
  const { t } = useI18n();
  const [length, setLength] = useState(20);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState(() => generatePassword(20, true));
  const passwordStrength = password.length >= 24 && symbols ? t("strong") : password.length >= 16 ? t("medium") : t("weak");
  function generate(): void {
    setPassword(generatePassword(Math.max(8, Math.min(128, length)), symbols));
  }
  return (
    <ToolPage slug="password-generator">
      <ToolPanel title="Secure password" actions={<ToolButton variant="quiet" onClick={() => { setLength(20); setSymbols(true); setPassword(generatePassword(20, true)); }}>{t("reset")}</ToolButton>}>
        <div className={toolStyles.inlineFields}>
          <label className={toolStyles.label}>
            <ToolLabel>Length</ToolLabel>
            <input
              className={toolStyles.input}
              type="number"
              min="8"
              max="128"
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
            />
          </label>
          <label className={toolStyles.check}>
            <input
              type="checkbox"
              checked={symbols}
              onChange={(event) => setSymbols(event.target.checked)}
            />{" "}
            <ToolLabel>Include symbols</ToolLabel>
          </label>
        </div>
        <div className={toolStyles.passwordOutput}>
          <code className="min-w-0 overflow-auto text-slate-800 dark:text-slate-200">{password}</code>
          <CopyButton value={password} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{t("strength")}: <strong className="text-emerald-600 dark:text-emerald-400">{passwordStrength}</strong></span>
          <ToolButton onClick={generate}>Generate password</ToolButton>
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}
function rgbToHsl([red, green, blue]: [number, number, number]): string {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = (g - b) / delta + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ColorPickerTool() {
  const { t } = useI18n();
  const [color, setColor] = useState("#F2633D");
  const rgb = useMemo(() => hexToRgb(color), [color]);
  const values = {
    hex: color.toUpperCase(),
    rgb: `rgb(${rgb.join(", ")})`,
    hsl: `hsl(${rgbToHsl(rgb)})`,
  };
  return (
    <ToolPage slug="color-picker">
      <ToolPanel title="Pick a color" actions={<ToolButton variant="quiet" onClick={() => setColor("#F2633D")}>{t("reset")}</ToolButton>}>
        <div className={toolStyles.colorPicker}>
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
          <div className="size-16 rounded-xl border border-slate-200" style={{ background: color }} />
          <strong className="font-mono text-xl font-semibold text-slate-800 dark:text-slate-100">{values.hex}</strong>
        </div>
        <div className={toolStyles.listOutput}>
          {Object.entries(values).map(([label, value]) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-950" key={label}>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{label.toUpperCase()}</span>
              <code className="ml-auto font-mono text-sm text-slate-800 dark:text-slate-200">{value}</code>
              <CopyButton value={value} />
            </div>
          ))}
        </div>
      </ToolPanel>
    </ToolPage>
  );
}

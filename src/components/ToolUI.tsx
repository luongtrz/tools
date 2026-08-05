import { useState, type ReactNode } from "react";
import { categoryLabel, literal, localizedTool, useI18n } from "../i18n";
import { getTool } from "../toolRegistry";
import ToolNavbar from "./ToolNavbar";
import { toolStyles } from "./toolStyles";

interface ToolShellProps {
  activeSlug?: string;
  children: ReactNode;
}

export function ToolShell({ activeSlug, children }: ToolShellProps) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-slate-800 dark:bg-[#0f1724] dark:text-slate-100">
      <ToolNavbar activeSlug={activeSlug} />
      <main className="mx-auto min-w-0 w-full max-w-[1600px] px-4 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-12">{children}</main>
      <footer className="mx-auto flex max-w-[1600px] justify-between px-4 pb-8 pt-6 font-mono text-xs text-slate-400 dark:text-slate-500 sm:px-8 lg:px-12">
        <span>
          toolmd <i>/</i> {t("footerDescription")}
        </span>
        <span>{t("footerBuilt")}</span>
      </footer>
    </div>
  );
}

interface ToolPageProps {
  slug: string;
  eyebrow?: string;
  children: ReactNode;
}

export function ToolPage({ slug, eyebrow, children }: ToolPageProps) {
  const { language, t } = useI18n();
  const tool = getTool(slug);
  if (!tool) return null;
  const localized = localizedTool(tool, language);
  return (
    <ToolShell activeSlug={slug}>
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:mb-16 sm:flex-row">
        <div>
            <a className="mb-8 inline-block font-mono text-sm font-medium text-slate-500 no-underline hover:text-[#f2633d] dark:text-slate-400 dark:hover:text-orange-300" href="/">
            {t("backAllTools")}
          </a>
          <p className="mb-4 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">
            {eyebrow ? literal(eyebrow, language) : categoryLabel(tool.category, language).toUpperCase()}
          </p>
          <h1 className="mb-4 font-display text-[clamp(38px,4vw,58px)] font-bold leading-[.98] tracking-[-3px] text-slate-800 dark:text-slate-100">{localized.title}</h1>
          <p className="m-0 max-w-[600px] text-base leading-7 text-slate-500 dark:text-slate-400">{localized.description}</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-400 dark:bg-slate-800 dark:text-slate-500">/{tool.slug}</span>
      </div>
      {children}
    </ToolShell>
  );
}

interface PanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ToolPanel({
  title,
  description,
  children,
  actions,
  className = "",
}: PanelProps) {
  const { language } = useI18n();
  return (
    <section className={`mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20 sm:p-7 ${className}`}>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{literal(title, language)}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{literal(description, language)}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "quiet" | "danger";
  disabled?: boolean;
  busy?: boolean;
}

export function ToolButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  busy = false,
}: ButtonProps) {
  const { language } = useI18n();
  const variantClasses = {
    primary: "bg-[#f2633d] text-white shadow-lg shadow-orange-100 hover:bg-[#d95132]",
    quiet: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
    danger: "bg-[#fff0eb] text-[#b34835] hover:bg-orange-100 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/60",
  };
  return (
    <button
      className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]}`}
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      {typeof children === "string" ? literal(children, language) : children}
    </button>
  );
}

export function ToolTextArea({
  value,
  onChange,
  placeholder,
  rows = 14,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel: string;
}) {
  const { language } = useI18n();
  return (
    <textarea
      className={toolStyles.textarea}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={literal(placeholder, language)}
      rows={rows}
      aria-label={literal(ariaLabel, language)}
      spellCheck={false}
    />
  );
}

export function ToolLabel({ children }: { children: string }) {
  const { language } = useI18n();
  return <>{literal(children, language)}</>;
}

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const { language, t } = useI18n();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy(): Promise<void> {
    let succeeded = false;
    try {
      await navigator.clipboard.writeText(value);
      succeeded = true;
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = value;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        succeeded = document.execCommand("copy");
        area.remove();
      } catch {
        succeeded = false;
      }
    }
    if (!succeeded) {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1600);
      return;
    }
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  return (
    <ToolButton
      variant="quiet"
      onClick={() => void handleCopy()}
      disabled={!value}
    >
      {copyState === "copied" ? t("copied") : copyState === "failed" ? t("copyFailed") : literal(label, language)}
    </ToolButton>
  );
}

export function ToolNotice({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
}) {
  const variantClasses = {
    info: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
    error: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${variantClasses[variant]}`} role={variant === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={toolStyles.empty}>{children}</div>;
}

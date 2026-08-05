import type { ReactNode } from "react";
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
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-slate-800">
      <ToolNavbar activeSlug={activeSlug} />
      <main className="mx-auto min-w-0 w-full max-w-[1600px] px-4 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-12">{children}</main>
      <footer className="mx-auto flex max-w-[1600px] justify-between px-4 pb-8 pt-6 font-mono text-xs text-slate-400 sm:px-8 lg:px-12">
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
          <a className="mb-8 inline-block font-mono text-sm font-medium text-slate-500 no-underline hover:text-[#f2633d]" href="/">
            {t("backAllTools")}
          </a>
          <p className="mb-4 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">
            {eyebrow ? literal(eyebrow, language) : categoryLabel(tool.category, language).toUpperCase()}
          </p>
          <h1 className="mb-4 font-display text-[clamp(38px,4vw,58px)] font-bold leading-[.98] tracking-[-3px] text-slate-800">{localized.title}</h1>
          <p className="m-0 max-w-[600px] text-base leading-7 text-slate-500">{localized.description}</p>
        </div>
        <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-400">/{tool.slug}</span>
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
    <section className={`mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 ${className}`}>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800">{literal(title, language)}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{literal(description, language)}</p>}
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
}

export function ToolButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
}: ButtonProps) {
  const { language } = useI18n();
  const variantClasses = {
    primary: "bg-[#f2633d] text-white shadow-lg shadow-orange-100 hover:bg-[#d95132]",
    quiet: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    danger: "bg-[#fff0eb] text-[#b34835] hover:bg-orange-100",
  };
  return (
    <button
      className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40 ${variantClasses[variant]}`}
      type={type}
      onClick={onClick}
      disabled={disabled}
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

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const { language } = useI18n();
  return (
    <ToolButton
      variant="quiet"
      onClick={() => navigator.clipboard.writeText(value)}
    >
      {literal(label, language)}
    </ToolButton>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={toolStyles.empty}>{children}</div>;
}

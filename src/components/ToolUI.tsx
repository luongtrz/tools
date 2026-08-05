import type { ReactNode } from "react";
import {
  getTool,
  TOOL_CATEGORIES,
  TOOL_REGISTRY,
} from "../toolRegistry";
import { toolStyles } from "./toolStyles";

interface ToolShellProps {
  activeSlug?: string;
  children: ReactNode;
}

export function ToolShell({ activeSlug, children }: ToolShellProps) {
  const activeTool = activeSlug ? getTool(activeSlug) : undefined;
  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex min-h-[76px] max-w-[1440px] flex-wrap items-center gap-3 py-3 lg:flex-nowrap lg:gap-8 lg:py-0">
          <a className="inline-flex w-max shrink-0 items-center gap-2.5 font-display text-[23px] font-bold tracking-tight text-slate-800 no-underline" href="/" aria-label="toolmd home">
            <span className="grid size-9 place-items-center rounded-xl bg-[#fff0eb] text-[25px] leading-none text-[#f2633d]">⌁</span>
            <span>
              tool<span className="text-[#f2633d]">md</span>
            </span>
          </a>
          <nav className="order-3 flex w-full min-w-0 items-center gap-1 overflow-x-auto border-t border-slate-100 pt-2 lg:order-none lg:w-auto lg:flex-1 lg:overflow-visible lg:border-0 lg:pt-0" aria-label="Tool categories">
            <a className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3.5 text-sm font-medium no-underline transition hover:bg-orange-50 hover:text-[#f2633d] ${!activeSlug ? "bg-orange-50 text-[#f2633d]" : "text-slate-500"}`} href="/">
              Home
            </a>
            {TOOL_CATEGORIES.map((category) => {
              const categoryTools = TOOL_REGISTRY.filter(
                (tool) => tool.category === category,
              );
              const isActive = activeTool?.category === category;
              return (
                <details className="group relative shrink-0" key={category}>
                  <summary className={`inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition hover:bg-orange-50 hover:text-[#f2633d] [&::-webkit-details-marker]:hidden ${isActive ? "bg-orange-50 text-[#f2633d]" : "text-slate-500"}`}>
                    {category}
                    <span className="text-xs text-slate-400" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="absolute left-0 top-[calc(100%+10px)] z-20 hidden w-[320px] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(24,38,61,.14)] group-open:block lg:left-1/2 lg:-translate-x-1/2">
                    <a
                      className="mb-1 flex flex-row items-center justify-between rounded-xl border-b border-slate-100 px-3.5 py-3 pb-3 text-sm font-semibold text-[#d95132] no-underline hover:bg-orange-50"
                      href={`/?category=${encodeURIComponent(category)}`}
                    >
                      <span>View all {category}</span>
                      <small className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-medium text-[#d95132]">{categoryTools.length} tools</small>
                    </a>
                    {categoryTools.map((tool) => (
                      <a className="flex flex-col gap-1 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-700 no-underline transition hover:bg-orange-50 hover:text-[#d95132]" href={`/${tool.slug}/`} key={tool.slug}>
                        <span>{tool.title}</span>
                        <small className="text-xs font-normal leading-snug text-slate-400">{tool.description}</small>
                      </a>
                    ))}
                  </div>
                </details>
              );
            })}
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-5">
            <div className="hidden items-center gap-2 font-mono text-[11px] font-medium text-slate-400 xl:flex">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(98,189,138,.14)]" /> Runs in your browser
            </div>
            <a className="whitespace-nowrap font-mono text-xs font-medium text-slate-500 no-underline hover:text-[#f2633d]" href="/">
              All tools <span>⌘K</span>
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto min-w-0 w-full max-w-[1320px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">{children}</main>
      <footer className="mx-auto flex max-w-[1320px] justify-between px-5 pb-8 pt-6 font-mono text-xs text-slate-400 sm:px-8">
        <span>
          toolmd <i>/</i> a small collection of useful tools
        </span>
        <span>Built for focused work</span>
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
  const tool = getTool(slug);
  if (!tool) return null;
  return (
    <ToolShell activeSlug={slug}>
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:mb-14 sm:flex-row">
        <div>
          <a className="mb-8 inline-block font-mono text-sm font-medium text-slate-500 no-underline hover:text-[#f2633d]" href="/">
            ← All tools
          </a>
          <p className="mb-4 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">
            {eyebrow || tool.category.toUpperCase()}
          </p>
          <h1 className="mb-4 font-display text-[clamp(38px,4vw,58px)] font-bold leading-[.98] tracking-[-3px] text-slate-800">{tool.title}</h1>
          <p className="m-0 max-w-[600px] text-base leading-7 text-slate-500">{tool.description}</p>
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
  return (
    <section className={`mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 ${className}`}>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800">{title}</h2>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
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
      {children}
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
  return (
    <textarea
      className={toolStyles.textarea}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
      spellCheck={false}
    />
  );
}

export function CopyButton({ value }: { value: string }) {
  return (
    <ToolButton
      variant="quiet"
      onClick={() => navigator.clipboard.writeText(value)}
    >
      Copy
    </ToolButton>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={toolStyles.empty}>{children}</div>;
}

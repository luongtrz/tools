import type { ReactNode } from "react";
import { getTool, type ToolCategory } from "../toolRegistry";

interface ToolShellProps {
  activeSlug?: string;
  children: ReactNode;
}

export function ToolShell({ activeSlug, children }: ToolShellProps) {
  const activeTool = activeSlug ? getTool(activeSlug) : undefined;
  return (
    <div className="toolmd-shell">
      <header className="toolmd-header">
        <a className="toolmd-brand" href="/" aria-label="toolmd home">
          <span className="toolmd-brand-mark">⌁</span>
          <span>
            tool<span>md</span>
          </span>
        </a>
        <div className="toolmd-header-meta">
          <span>PRIVATE BROWSER TOOLS</span>
          <span className="toolmd-live-dot" /> Everything runs locally
        </div>
        <a className="toolmd-all-link" href="/">
          All tools <span>⌘K</span>
        </a>
      </header>
      <div className="toolmd-layout">
        <aside className="toolmd-sidebar">
          <a
            className={`toolmd-side-link ${!activeSlug ? "active" : ""}`}
            href="/"
          >
            ⌂ <span>All tools</span>
          </a>
          <div className="toolmd-side-label">COLLECTIONS</div>
          {(
            [
              "Document",
              "Markdown",
              "Developer data",
              "Text utility",
              "Quick tools",
            ] as ToolCategory[]
          ).map((category) => (
            <a
              className={`toolmd-side-link ${activeTool?.category === category ? "active" : ""}`}
              href={`/?category=${encodeURIComponent(category)}`}
              key={category}
            >
              <span className="toolmd-side-icon">
                {category === "Document"
                  ? "▣"
                  : category === "Markdown"
                    ? "✎"
                    : category === "Developer data"
                      ? "{}"
                      : category === "Text utility"
                        ? "Aa"
                        : "✦"}
              </span>
              <span>{category}</span>
            </a>
          ))}
          <div className="toolmd-side-note">
            <strong>Local by default.</strong>
            <br />
            No pasted content is uploaded to a server.
          </div>
        </aside>
        <main className="toolmd-main">{children}</main>
      </div>
      <footer className="toolmd-footer">
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
      <div className="toolmd-page-heading">
        <div>
          <a className="toolmd-back" href="/">
            ← All tools
          </a>
          <p className="toolmd-eyebrow">
            {eyebrow || tool.category.toUpperCase()}
          </p>
          <h1>{tool.title}</h1>
          <p className="toolmd-page-copy">{tool.description}</p>
        </div>
        <span className="toolmd-route">/{tool.slug}</span>
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
    <section className={`toolmd-panel ${className}`}>
      <div className="toolmd-panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
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
  return (
    <button
      className={`toolmd-button ${variant}`}
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
      className="toolmd-textarea"
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
  return <div className="toolmd-empty">{children}</div>;
}

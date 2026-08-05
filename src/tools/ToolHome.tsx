import { useMemo, useState } from "react";
import {
  TOOL_CATEGORIES,
  TOOL_REGISTRY,
  type ToolCategory,
} from "../toolRegistry";
import { ToolShell } from "../components/ToolUI";

function initialQuery(): string {
  return new URLSearchParams(window.location.search).get("q") || "";
}

function initialCategory(): ToolCategory | "All" {
  const value = new URLSearchParams(window.location.search).get("category");
  return value && TOOL_CATEGORIES.includes(value as ToolCategory)
    ? (value as ToolCategory)
    : "All";
}

export default function ToolHome() {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<ToolCategory | "All">(
    initialCategory,
  );
  const visibleTools = useMemo(
    () =>
      TOOL_REGISTRY.filter((tool) => {
        const matchesCategory =
          category === "All" || tool.category === category;
        const haystack =
          `${tool.title} ${tool.description} ${tool.category}`.toLowerCase();
        return matchesCategory && haystack.includes(query.trim().toLowerCase());
      }),
    [category, query],
  );
  const featured = visibleTools.filter((tool) => tool.featured);

  return (
    <ToolShell>
      <section className="toolmd-home-hero">
        <div>
          <p className="toolmd-eyebrow">A SMALL, FOCUSED TOOLBOX</p>
          <h1>
            Useful tools,
            <br />
            <em>without the noise.</em>
          </h1>
          <p className="toolmd-home-copy">
            Markdown, document and developer utilities that run in your browser.
            Pick one thing, finish it, move on.
          </p>
        </div>
        <div className="toolmd-hero-stat">
          <strong>{TOOL_REGISTRY.length}</strong>
          <span>
            curated tools
            <br />
            and growing
          </span>
        </div>
      </section>
      <div className="toolmd-search-row">
        <label className="toolmd-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools by name or purpose…"
            aria-label="Search tools"
          />
          <kbd>⌘ K</kbd>
        </label>
        <div className="toolmd-search-meta">
          <span>
            {category === "All" ? "All tools" : category}
            {query ? ` · ${visibleTools.length} results` : ""}
          </span>
          {category !== "All" && (
            <button type="button" onClick={() => setCategory("All")}>
              Clear filter
            </button>
          )}
        </div>
      </div>
      {featured.length > 0 && category === "All" && !query && (
        <section className="toolmd-section">
          <div className="toolmd-section-heading">
            <div>
              <p className="toolmd-eyebrow">START HERE</p>
              <h2>Most useful first</h2>
            </div>
            <span>For everyday work</span>
          </div>
          <div className="toolmd-feature-grid">
            {featured.map((tool) => (
              <ToolCard key={tool.slug} {...tool} featured />
            ))}
          </div>
        </section>
      )}
      {TOOL_CATEGORIES.map((item) => {
        const tools = visibleTools.filter(
          (tool) =>
            tool.category === item &&
            (category !== "All" || query.trim() || !tool.featured),
        );
        if (!tools.length) return null;
        return (
          <section className="toolmd-section" key={item}>
            <div className="toolmd-section-heading">
              <div>
                <p className="toolmd-eyebrow">{item.toUpperCase()}</p>
                <h2>
                  {item === "Developer data"
                    ? "Make data readable"
                    : item === "Text utility"
                      ? "Shape your text"
                      : item}
                </h2>
              </div>
              <span>{tools.length} tools</span>
            </div>
            <div className="toolmd-card-grid">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} {...tool} />
              ))}
            </div>
          </section>
        );
      })}
      {!visibleTools.length && (
        <div className="toolmd-empty">
          No tools matched “{query}”. Try a shorter search.
        </div>
      )}
    </ToolShell>
  );
}

function ToolCard({
  slug,
  title,
  description,
  category,
  featured,
}: {
  slug: string;
  title: string;
  description: string;
  category: ToolCategory;
  featured?: boolean;
}) {
  return (
    <a
      className={`toolmd-card ${featured ? "featured" : ""}`}
      href={`/${slug}/`}
    >
      <span className="toolmd-card-icon">
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
      <div>
        <span className="toolmd-card-category">{category}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <span className="toolmd-card-arrow">↗</span>
    </a>
  );
}

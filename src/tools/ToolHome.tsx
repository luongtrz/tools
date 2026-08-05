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
      <section className="mb-14 flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
        <div>
          <p className="mb-4 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">A SMALL, FOCUSED TOOLBOX</p>
          <h1 className="mb-4 font-display text-[clamp(42px,5vw,70px)] font-bold leading-[.98] tracking-[-3px] text-slate-800">
            Useful tools,
            <br />
            <em className="not-italic text-[#f2633d]">without the noise.</em>
          </h1>
          <p className="m-0 max-w-[600px] text-base leading-7 text-slate-500">
            Markdown, document and developer utilities that run in your browser.
            Pick one thing, finish it, move on.
          </p>
        </div>
        <div className="flex items-baseline gap-3 pb-2 font-mono text-sm leading-snug text-slate-400 sm:text-right">
          <strong className="font-display text-[54px] font-bold leading-none tracking-[-2px] text-slate-800">{TOOL_REGISTRY.length}</strong>
          <span>
            curated tools
            <br />
            and growing
          </span>
        </div>
      </section>
      <div className="mb-14 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
        <label className="flex h-14 w-full max-w-[520px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-slate-400 shadow-sm focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100">
          <span className="text-xl">⌕</span>
          <input
            className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-slate-800 outline-none"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools by name or purpose…"
            aria-label="Search tools"
          />
          <kbd className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-400">⌘ K</kbd>
        </label>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span>
            {category === "All" ? "All tools" : category}
            {query ? ` · ${visibleTools.length} results` : ""}
          </span>
          {category !== "All" && (
            <button className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-orange-50 hover:text-[#f2633d]" type="button" onClick={() => setCategory("All")}>
              Clear filter
            </button>
          )}
        </div>
      </div>
      {featured.length > 0 && category === "All" && !query && (
        <section className="mt-16">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="mb-3 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">START HERE</p>
              <h2 className="m-0 font-display text-[28px] font-bold tracking-tight text-slate-800">Most useful first</h2>
            </div>
            <span>For everyday work</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <section className="mt-16" key={item}>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="mb-3 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">{item.toUpperCase()}</p>
                <h2 className="m-0 font-display text-[28px] font-bold tracking-tight text-slate-800">
                  {item === "Developer data"
                    ? "Make data readable"
                    : item === "Text utility"
                      ? "Shape your text"
                      : item}
                </h2>
              </div>
              <span>{tools.length} tools</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} {...tool} />
              ))}
            </div>
          </section>
        );
      })}
      {!visibleTools.length && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-base text-slate-500">
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
      className={`relative flex min-h-[176px] items-start gap-4 rounded-2xl border bg-white p-6 text-slate-800 no-underline shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl ${featured ? "min-h-[194px] border-orange-100 bg-orange-50/30" : "border-slate-200"}`}
      href={`/${slug}/`}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#fff0eb] font-mono text-sm font-semibold text-[#f2633d]">
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
        <span className="font-mono text-[11px] font-medium tracking-wide text-slate-400">{category}</span>
        <h3 className="mb-2 mr-5 mt-2 font-display text-lg font-semibold leading-tight text-slate-800">{title}</h3>
        <p className="m-0 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      <span className="absolute right-5 top-5 text-lg text-slate-400">↗</span>
    </a>
  );
}

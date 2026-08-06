import { useEffect, useMemo, useRef, useState } from "react";
import { categoryLabel, localizedTool, useI18n } from "../i18n";
import { TOOL_REGISTRY, type ToolDefinition } from "../toolRegistry";

interface ToolSearchProps {
  className?: string;
}

export default function ToolSearch({ className = "" }: ToolSearchProps) {
  const { language, t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return TOOL_REGISTRY.filter((tool) => {
      if (!normalizedQuery) return true;
      const localized = localizedTool(tool, language);
      const haystack = [
        localized.title,
        localized.description,
        localized.slug,
        categoryLabel(tool.category, language),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    }).slice(0, 12);
  }, [language, query]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && results[activeIndex]) {
      window.location.href = `/${results[activeIndex].slug}/`;
    }
  }

  function openSearch(): void {
    setOpen(true);
  }

  return (
    <>
      <button
        className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 font-mono text-[11px] font-semibold text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#f2633d] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-400/60 dark:hover:bg-slate-800 dark:hover:text-orange-300 ${className}`}
        type="button"
        onClick={openSearch}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("searchToolsLabel")}
      >
        <span className="text-base" aria-hidden="true">⌕</span>
        <span className="hidden sm:inline">{t("searchToolsShort")}</span>
        <kbd className="hidden rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">Ctrl K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/45 px-4 pt-[12vh] backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-label={t("searchToolsLabel")}
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
              <span className="text-xl text-slate-400" aria-hidden="true">⌕</span>
              <input
                ref={inputRef}
                className="h-14 min-w-0 flex-1 bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("searchTools")}
                aria-label={t("searchToolsLabel")}
                role="combobox"
                aria-expanded="true"
                aria-controls="tool-search-results"
                aria-activedescendant={results[activeIndex] ? `tool-result-${results[activeIndex].slug}` : undefined}
              />
              <button
                className="grid size-8 place-items-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("closeWindow")}
              >
                ×
              </button>
            </div>
            <div className="max-h-[min(60vh,480px)] overflow-y-auto p-2" id="tool-search-results" role="listbox">
              {results.length ? (
                results.map((tool, index) => (
                  <SearchResult
                    key={tool.slug}
                    tool={tool}
                    language={language}
                    active={index === activeIndex}
                    onSelect={() => { window.location.href = `/${tool.slug}/`; }}
                    onHover={() => setActiveIndex(index)}
                  />
                ))
              ) : (
                <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  {t("noToolsMatched", { query })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 font-mono text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-500">
              <span>↑ ↓ {t("navigateSearch")}</span>
              <span>Enter {t("openSearchResult")}</span>
              <span>Esc {t("closeWindow")}</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function SearchResult({
  tool,
  language,
  active,
  onSelect,
  onHover,
}: {
  tool: ToolDefinition;
  language: "vi" | "en";
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const localized = localizedTool(tool, language);
  return (
    <a
      className={`block rounded-xl px-4 py-3 no-underline transition ${active ? "bg-orange-50 dark:bg-orange-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
      href={`/${tool.slug}/`}
      id={`tool-result-${tool.slug}`}
      role="option"
      aria-selected={active}
      onClick={(event) => {
        event.preventDefault();
        onSelect();
      }}
      onMouseEnter={onHover}
    >
      <div className="flex items-center justify-between gap-3">
        <strong className={`text-sm ${active ? "text-[#d95132] dark:text-orange-300" : "text-slate-800 dark:text-slate-100"}`}>
          {localized.title}
        </strong>
        <span className="font-mono text-[10px] text-slate-400">/{tool.slug}</span>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{localized.description}</p>
    </a>
  );
}

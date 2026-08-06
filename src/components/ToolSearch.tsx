import { useEffect, useMemo, useRef, useState } from "react";
import { categoryLabel, localizedTool, useI18n } from "@/i18n";
import { TOOL_REGISTRY, type ToolDefinition } from "@/toolRegistry";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";

interface ToolSearchProps {
  className?: string;
}

export default function ToolSearch({ className = "" }: ToolSearchProps) {
  const { language, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const grouped = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return TOOL_REGISTRY.reduce<Record<string, ToolDefinition[]>>(
      (acc, tool) => {
        if (normalizedQuery) {
          const localized = localizedTool(tool, language);
          const haystack = [
            localized.title,
            localized.description,
            localized.slug,
            categoryLabel(tool.category, language),
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(normalizedQuery)) return acc;
        }
        if (!acc[tool.category]) acc[tool.category] = [];
        acc[tool.category].push(tool);
        return acc;
      },
      {},
    );
  }, [language, query]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  function selectTool(slug: string): void {
    setOpen(false);
    window.location.href = `/${slug}/`;
  }

  return (
    <>
      <button
        className={`inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${className}`}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("searchToolsLabel")}
      >
        <span className="text-base" aria-hidden="true">
          ⌕
        </span>
        <span className="hidden sm:inline">{t("searchToolsShort")}</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("searchToolsLabel")}
        description={t("searchTools")}
        className="max-w-2xl"
      >
        <CommandInput
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder={t("searchTools")}
          aria-label={t("searchToolsLabel")}
        />
        <CommandList>
          {Object.keys(grouped).length === 0 ? (
            <CommandEmpty>
              {t("noToolsMatched", { query })}
            </CommandEmpty>
          ) : (
            Object.entries(grouped).map(([category, tools], index) => (
              <div key={category}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup
                  heading={categoryLabel(category as never, language)}
                >
                  {tools.map((tool) => {
                    const localized = localizedTool(tool, language);
                    return (
                      <CommandItem
                        key={tool.slug}
                        value={`${localized.title} ${localized.description} ${category}`}
                        onSelect={() => selectTool(tool.slug)}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">
                            {localized.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /{tool.slug}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))
          )}
        </CommandList>
        <div className="flex flex-wrap justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
          <span>↑ ↓ {t("navigateSearch")}</span>
          <span>Enter {t("openSearchResult")}</span>
          <span>Esc {t("closeWindow")}</span>
        </div>
      </CommandDialog>
    </>
  );
}

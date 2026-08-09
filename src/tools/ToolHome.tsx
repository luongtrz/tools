import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { categoryLabel, localizedTool, useI18n } from "@/i18n";
import {
  TOOL_CATEGORIES,
  TOOL_REGISTRY,
  type ToolCategory,
  type ToolDefinition,
} from "@/toolRegistry";
import { ToolShell } from "@/components/ToolUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
  const { language, t } = useI18n();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<ToolCategory | "All">(
    initialCategory,
  );
  const visibleTools = useMemo(
    () =>
      TOOL_REGISTRY.filter((tool) => {
        const matchesCategory =
          category === "All" || tool.category === category;
        const localized = localizedTool(tool, language);
        const haystack =
          `${localized.title} ${localized.description} ${categoryLabel(tool.category, language)}`.toLowerCase();
        return matchesCategory && haystack.includes(query.trim().toLowerCase());
      }),
    [category, language, query],
  );
  const featured = visibleTools.filter((tool) => tool.featured);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = query.trim();
    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");
    if (category === "All") params.delete("category");
    else params.set("category", category);
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) window.history.replaceState({}, "", nextUrl);
  }, [category, query]);

  return (
    <ToolShell>
      <section className="mb-12 flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary">
            {t("heroEyebrow")}
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {t("heroTitleLead")}
            {t("heroTitleAccent") && (
              <>
                <br />
                <span className="text-primary">{t("heroTitleAccent")}</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {t("heroDescription")}
          </p>
        </div>
        <Card className="shrink-0">
          <CardContent className="flex items-baseline gap-3 p-5">
            <span className="font-display text-4xl font-bold leading-none tracking-tight">
              {TOOL_REGISTRY.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("curatedTools")}
              <br />
              {t("andGrowing")}
            </span>
          </CardContent>
        </Card>
      </section>

      <div className="mb-10 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("searchTools")}
            aria-label={t("searchToolsLabel")}
            className="h-11 pl-9 pr-16 font-mono text-sm"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
            Ctrl K
          </kbd>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {category === "All" ? t("allTools") : categoryLabel(category, language)}
            {query ? ` · ${t("resultsCount", { count: visibleTools.length })}` : ""}
          </span>
          {category !== "All" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCategory("All")}
            >
              {t("clearFilter")}
            </Button>
          )}
        </div>
      </div>

      {featured.length > 0 && category === "All" && !query && (
        <section className="mb-12">
          <SectionHeader
            eyebrow={t("startHere")}
            title={t("mostUsefulFirst")}
            note={t("everydayWork")}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <section className="mb-12" key={item}>
            <SectionHeader
              eyebrow={categoryLabel(item, language).toUpperCase()}
              title={
                item === "Developer data"
                  ? t("makeDataReadable")
                  : item === "Text utility"
                    ? t("shapeYourText")
                    : categoryLabel(item, language)
              }
              note={t("toolsCount", { count: tools.length })}
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} {...tool} />
              ))}
            </div>
          </section>
        );
      })}

      {!visibleTools.length && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("noToolsMatched", { query })}
          </CardContent>
        </Card>
      )}
    </ToolShell>
  );
}

function SectionHeader({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="mb-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>
      {note && (
        <span className="text-sm text-muted-foreground sm:shrink-0">{note}</span>
      )}
    </div>
  );
}

function ToolCard({
  slug,
  title,
  description,
  category,
  featured,
}: ToolDefinition & { featured?: boolean }) {
  const { language } = useI18n();
  const localized = localizedTool({ slug, title, description, category }, language);
  return (
    <a
      href={`/${slug}/`}
      className="group block focus:outline-none"
      aria-label={localized.title}
    >
      <Card
        className={cn(
          "h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/50 group-hover:shadow-md",
          featured && "border-primary/40 bg-primary/5",
        )}
      >
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className="mb-2 font-mono text-[10px] font-medium uppercase tracking-wider"
            >
              {categoryLabel(category, language)}
            </Badge>
            <CardTitle className="break-words text-base leading-snug">
              {localized.title}
            </CardTitle>
          </div>
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-3 text-sm leading-6">
            {localized.description}
          </CardDescription>
        </CardContent>
      </Card>
    </a>
  );
}

import type { ReactNode } from "react";
import { categoryLabel, localizedTool, useI18n } from "../i18n";
import { TOOL_CATEGORIES, TOOL_REGISTRY, getTool } from "../toolRegistry";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";

interface ToolNavbarProps {
  activeSlug?: string;
  rightSlot?: ReactNode;
}

export default function ToolNavbar({ activeSlug, rightSlot }: ToolNavbarProps) {
  const { language, t } = useI18n();
  const activeTool = activeSlug ? getTool(activeSlug) : undefined;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-8">
      <div className="mx-auto flex min-h-[76px] max-w-[1440px] flex-wrap items-center gap-3 py-3 lg:flex-nowrap lg:gap-8 lg:py-0">
        <a
          className="inline-flex w-max shrink-0 items-center gap-2.5 font-display text-[23px] font-bold tracking-tight text-slate-800 no-underline dark:text-slate-100"
          href="/"
          aria-label={`${t("home")} toolmd`}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#fff0eb] text-[25px] leading-none text-[#f2633d]">
            ⌁
          </span>
          <span>
            tool<span className="text-[#f2633d]">md</span>
          </span>
        </a>
        <nav
          className="order-3 flex w-full min-w-0 flex-wrap items-center gap-1 overflow-visible border-t border-slate-100 pt-2 dark:border-slate-800 lg:order-none lg:w-auto lg:flex-1 lg:flex-nowrap lg:border-0 lg:pt-0"
          aria-label={t("toolCategories")}
        >
          <a
            className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3.5 text-sm font-medium no-underline transition hover:bg-orange-50 hover:text-[#f2633d] dark:hover:bg-slate-800 dark:hover:text-orange-300 ${!activeSlug ? "bg-orange-50 text-[#f2633d] dark:bg-orange-950/50 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}
            href="/"
            aria-current={!activeSlug ? "page" : undefined}
          >
            {t("home")}
          </a>
          <a
            className={`inline-flex min-h-10 shrink-0 items-center rounded-lg px-3.5 text-sm font-medium no-underline transition hover:bg-orange-50 hover:text-[#f2633d] dark:hover:bg-slate-800 dark:hover:text-orange-300 ${activeSlug === "mcp" ? "bg-orange-50 text-[#f2633d] dark:bg-orange-950/50 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}
            href="/mcp/"
            aria-current={activeSlug === "mcp" ? "page" : undefined}
          >
            {t("mcp")}
          </a>
          {TOOL_CATEGORIES.map((category) => {
            const categoryTools = TOOL_REGISTRY.filter(
              (tool) => tool.category === category,
            );
            const isActive = activeTool?.category === category;
            return (
              <details className="group relative shrink-0" key={category}>
                <summary
                    className={`inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition hover:bg-orange-50 hover:text-[#f2633d] dark:hover:bg-slate-800 dark:hover:text-orange-300 [&::-webkit-details-marker]:hidden ${isActive ? "bg-orange-50 text-[#f2633d] dark:bg-orange-950/50 dark:text-orange-300" : "text-slate-500 dark:text-slate-400"}`}
                >
                  {categoryLabel(category, language)}
                  <span className="text-xs text-slate-400" aria-hidden="true">
                    ⌄
                  </span>
                </summary>
                <div className="absolute left-0 top-[calc(100%+10px)] z-20 hidden w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(24,38,61,.14)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_20px_60px_rgba(0,0,0,.35)] group-open:block lg:left-1/2 lg:-translate-x-1/2">
                  <a
                    className="mb-1 flex flex-row items-center justify-between rounded-xl border-b border-slate-100 px-3.5 py-3 pb-3 text-sm font-semibold text-[#d95132] no-underline hover:bg-orange-50 dark:border-slate-800 dark:text-orange-300 dark:hover:bg-slate-800"
                    href={`/?category=${encodeURIComponent(category)}`}
                  >
                    <span>{t("viewAll", { category: categoryLabel(category, language) })}</span>
                    <small className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-medium text-[#d95132]">
                      {t("toolsCount", { count: categoryTools.length })}
                    </small>
                  </a>
                  {categoryTools.map((tool) => (
                    <a
                      className="flex flex-col gap-1 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-700 no-underline transition hover:bg-orange-50 hover:text-[#d95132] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-orange-300"
                      href={`/${tool.slug}/`}
                      aria-current={activeSlug === tool.slug ? "page" : undefined}
                      key={tool.slug}
                    >
                      <span>{localizedTool(tool, language).title}</span>
                      <small className="text-xs font-normal leading-snug text-slate-400">
                        {localizedTool(tool, language).description}
                      </small>
                    </a>
                  ))}
                </div>
              </details>
            );
          })}
        </nav>
        {rightSlot || (
          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
            <LanguageToggle />
            <ThemeToggle />
            <div className="hidden items-center gap-2 font-mono text-[11px] font-medium text-slate-400 xl:flex">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(98,189,138,.14)]" />
              {t("runsInBrowser")}
            </div>
            <a
              className="hidden whitespace-nowrap font-mono text-xs font-medium text-slate-500 no-underline hover:text-[#f2633d] dark:text-slate-400 dark:hover:text-orange-300 sm:inline"
              href="/"
            >
              {t("allTools")} <span className="ml-2 rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] text-slate-400">Ctrl K</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}

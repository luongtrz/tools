import type { ReactNode } from "react";
import { categoryLabel, localizedTool, useI18n } from "@/i18n";
import { TOOL_CATEGORIES, TOOL_REGISTRY, getTool } from "@/toolRegistry";
import SettingsMenu from "./SettingsMenu";
import ToolSearch from "./ToolSearch";
import Icon from "./Icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

interface ToolNavbarProps {
  activeSlug?: string;
  rightSlot?: ReactNode;
}

export default function ToolNavbar({ activeSlug, rightSlot }: ToolNavbarProps) {
  const { language, t } = useI18n();
  const activeTool = activeSlug ? getTool(activeSlug) : undefined;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-2 px-4 sm:px-6 lg:gap-3 lg:px-8">
        <a
          className="inline-flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-tight text-foreground no-underline"
          href="/"
          aria-label={`${t("home")} toolmd`}
        >
          <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon name="brand" className="size-4" />
          </span>
          <span>
            tool<span className="text-primary">md</span>
          </span>
        </a>

        <Separator
          orientation="vertical"
          className="hidden h-6 md:block"
        />

        <nav
          className="hidden min-w-0 flex-1 items-center gap-1 md:flex"
          aria-label={t("toolCategories")}
        >
          <NavLink href="/" active={!activeSlug}>
            {t("home")}
          </NavLink>
          <NavLink href="/mcp/" active={activeSlug === "mcp"}>
            {t("mcp")}
          </NavLink>
          {TOOL_CATEGORIES.map((category) => {
            const categoryTools = TOOL_REGISTRY.filter(
              (tool) => tool.category === category,
            );
            const isActive = activeTool?.category === category;
            return (
              <DropdownMenu key={category}>
                <DropdownMenuTrigger
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
                    "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
                  )}
                >
                  {categoryLabel(category, language)}
                  <span aria-hidden="true" className="text-xs">
                    ⌄
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[320px] p-1"
                >
                  <DropdownMenuLabel className="flex items-center justify-between gap-2 px-2 py-2">
                    <a
                      href={`/?category=${encodeURIComponent(category)}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {t("viewAll", {
                        category: categoryLabel(category, language),
                      })}
                    </a>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {t("toolsCount", { count: categoryTools.length })}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categoryTools.map((tool) => {
                    const localized = localizedTool(tool, language);
                    return (
                      <DropdownMenuItem
                        key={tool.slug}
                        asChild
                        className="cursor-pointer"
                      >
                        <a
                          href={`/${tool.slug}/`}
                          aria-current={
                            activeSlug === tool.slug ? "page" : undefined
                          }
                          className="flex flex-col items-start gap-0.5 py-2"
                        >
                          <span className="text-sm font-medium">
                            {localized.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {localized.description}
                          </span>
                        </a>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        <MobileMenu
          activeSlug={activeSlug}
          activeToolCategory={activeTool?.category}
        />

        <div className="ml-auto flex items-center gap-2">
          <ToolSearch />
          {rightSlot || <SettingsMenu />}
        </div>
      </div>
    </header>
  );
}

function MobileMenu({
  activeSlug,
  activeToolCategory,
}: {
  activeSlug?: string;
  activeToolCategory?: string;
}) {
  const { language, t } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
        aria-label={t("toolCategories")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] p-1 md:hidden">
        <DropdownMenuItem asChild>
          <a
            href="/"
            aria-current={!activeSlug ? "page" : undefined}
            className="font-medium"
          >
            {t("home")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href="/mcp/"
            aria-current={activeSlug === "mcp" ? "page" : undefined}
            className="font-medium"
          >
            {t("mcp")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {TOOL_CATEGORIES.map((category) => {
          const categoryTools = TOOL_REGISTRY.filter(
            (tool) => tool.category === category,
          );
          const isActive = activeToolCategory === category;
          return (
            <DropdownMenuItem
              key={category}
              asChild
              className="flex flex-col items-start gap-0.5 py-2"
            >
              <a
                href={`/?category=${encodeURIComponent(category)}`}
                className={cn(
                  "flex w-full flex-col items-start gap-0.5",
                  isActive && "text-primary",
                )}
              >
                <span className="text-sm font-medium">
                  {categoryLabel(category, language)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("toolsCount", { count: categoryTools.length })}
                </span>
              </a>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium no-underline transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {children}
    </a>
  );
}

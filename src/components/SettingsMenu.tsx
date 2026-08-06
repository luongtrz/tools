import { Moon, Sun, Languages } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function SettingsMenu() {
  const { language, toggleLanguage, theme, toggleTheme, t } = useI18n();
  const nextLanguage = language === "vi" ? "EN" : "VI";
  const nextThemeLabel = theme === "dark" ? t("lightMode") : t("darkMode");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("settings")}
          title={t("settings")}
        >
          <SettingsIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1">
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground">
          <SettingsIcon className="size-3.5" />
          {t("settings")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            toggleLanguage();
          }}
          className="flex items-center justify-between gap-2 py-2"
        >
          <span className="flex items-center gap-2">
            <Languages className="size-4 text-muted-foreground" />
            {t("language")}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
              {language.toUpperCase()}
            </span>
            <span aria-hidden="true" className="text-muted-foreground">
              →
            </span>
            <span>{nextLanguage}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            toggleTheme();
          }}
          className="flex items-center justify-between gap-2 py-2"
        >
          <span className="flex items-center gap-2">
            {theme === "dark" ? (
              <Sun className="size-4 text-muted-foreground" />
            ) : (
              <Moon className="size-4 text-muted-foreground" />
            )}
            {t("theme")}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {nextThemeLabel}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingsIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.13 16.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 4.08l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.04-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.04H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04Z" />
    </svg>
  );
}

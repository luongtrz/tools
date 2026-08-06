import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, toggleTheme, t } = useI18n();
  const label = theme === "dark" ? t("lightMode") : t("darkMode");

  return (
    <button
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      )}
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={t("toggleTheme")}
    >
      <span aria-hidden="true" className="text-sm">
        {theme === "dark" ? "☼" : "☾"}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

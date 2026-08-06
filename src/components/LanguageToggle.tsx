import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useI18n();
  const nextLanguage = language === "vi" ? "EN" : "VI";

  return (
    <button
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-2 font-mono text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      )}
      type="button"
      onClick={toggleLanguage}
      title={t("changeLanguage")}
      aria-label={t("changeLanguage")}
    >
      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-primary">
        {language.toUpperCase()}
      </span>
      <span aria-hidden="true">→</span>
      <span>{nextLanguage}</span>
    </button>
  );
}

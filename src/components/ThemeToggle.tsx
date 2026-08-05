import { useI18n } from "../i18n";

export default function ThemeToggle() {
  const { theme, toggleTheme, t } = useI18n();
  const label = theme === "dark" ? t("lightMode") : t("darkMode");

  return (
    <button
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 font-mono text-[11px] font-semibold text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#f2633d] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-400/60 dark:hover:bg-slate-800 dark:hover:text-orange-300"
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

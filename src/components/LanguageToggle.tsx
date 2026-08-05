import { useI18n } from "../i18n";

export default function LanguageToggle() {
  const { language, toggleLanguage, t } = useI18n();
  const nextLanguage = language === "vi" ? "EN" : "VI";

  return (
    <button
      className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 font-mono text-[11px] font-semibold text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#f2633d] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-orange-400/60 dark:hover:bg-slate-800 dark:hover:text-orange-300"
      type="button"
      onClick={toggleLanguage}
      title={t("changeLanguage")}
      aria-label={t("changeLanguage")}
    >
      <span className="rounded-md bg-[#fff0eb] px-1.5 py-1 text-[#d95132]">
        {language.toUpperCase()}
      </span>
      <span aria-hidden="true">→</span>
      <span>{nextLanguage}</span>
    </button>
  );
}

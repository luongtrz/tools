import Icon from "./Icon";
import LanguageToggle from "./LanguageToggle";
import ThemeToggle from "./ThemeToggle";
import ToolNavbar from "./ToolNavbar";
import { useI18n } from "../i18n";

interface TopBarProps {
  onReset: () => void;
}

export default function TopBar({ onReset }: TopBarProps) {
  const { t } = useI18n();
  return (
    <ToolNavbar
      activeSlug="md2pdf"
      rightSlot={
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-2 font-mono text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(96,188,135,.14)]" />
            wkhtmltopdf core
          </div>
          <LanguageToggle />
          <ThemeToggle />
          <button
            className="grid size-10 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            type="button"
            title={t("restoreSample")}
            aria-label={t("restoreSample")}
            onClick={onReset}
          >
            <Icon name="reset" />
          </button>
          <button
            className="grid size-10 place-items-center rounded-xl bg-[#111b2c] text-sm font-semibold text-white dark:bg-orange-500 dark:text-slate-950"
            type="button"
            title={t("workspace")}
          >
            A
          </button>
        </div>
      }
    />
  );
}

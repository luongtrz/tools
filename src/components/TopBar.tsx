import Icon from "./Icon";
import SettingsMenu from "./SettingsMenu";
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
        <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-3 sm:gap-5 2xl:w-auto">
          <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 font-mono text-xs text-muted-foreground dark:border-border  sm:flex">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(96,188,135,.14)]" />
            {t("browserPrint")}
          </div>
          <SettingsMenu />
          <button
            className="grid size-10 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted/50 hover:text-foreground  dark:hover:bg-muted dark:hover:text-foreground"
            type="button"
            title={t("restoreSample")}
            aria-label={t("restoreSample")}
            onClick={onReset}
          >
            <Icon name="reset" />
          </button>
          <span
            className="hidden size-10 place-items-center rounded-xl bg-foreground text-sm font-semibold text-primary-foreground dark:bg-primary dark:text-primary-foreground sm:grid"
            title={t("workspace")}
            aria-label={t("workspace")}
          >
            A
          </span>
        </div>
      }
    />
  );
}

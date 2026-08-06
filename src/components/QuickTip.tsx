import { useI18n } from "@/i18n";

export default function QuickTip() {
  const { t } = useI18n();
  return (
    <aside className="relative overflow-hidden rounded-2xl border border-foreground/20 bg-foreground p-6 text-primary-foreground sm:p-7">
      <span className="absolute right-6 top-5 text-xl text-primary">✦</span>
      <p className="mb-3 font-mono text-xs font-medium tracking-[0.18em] text-primary">
        {t("quickTip")}
      </p>
      <h2 className="font-display text-2xl font-bold leading-tight">
        {t("designedFor")}
        <br />
        <em className="not-italic text-primary">{t("cleanExports")}</em>
      </h2>
      <p className="my-5 max-w-[280px] text-sm leading-6 text-primary-foreground/70">
        {t("quickTipDescription")}
      </p>
      <a
        href="/mcp/"
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs font-medium text-primary no-underline"
      >
        {t("viewWkhtmltopdfDocs")} <span>↗</span>
      </a>
    </aside>
  );
}

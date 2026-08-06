import { useI18n } from "../i18n";

export default function QuickTip() {
  const { t } = useI18n();
  return (
    <aside className="relative rounded-2xl border border-[#111b2c] bg-foreground p-6 text-foreground sm:p-7">
      <span className="absolute right-6 top-5 text-xl text-[#f27d5d]">✦</span>
      <p className="mb-3 font-mono text-xs font-medium tracking-[1.5px] text-[#f79a7d]">{t("quickTip")}</p>
      <h2 className="font-display text-2xl font-bold leading-tight text-primary-foreground">
        {t("designedFor")}
        <br />
        <em className="not-italic text-[#f79a7d]">{t("cleanExports")}</em>
      </h2>
      <p className="my-5 max-w-[280px] text-sm leading-6 text-muted-foreground">
        {t("quickTipDescription")}
      </p>
      <a
        href="/mcp/"
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs font-medium text-[#f79a7d] no-underline"
      >
        {t("viewWkhtmltopdfDocs")} <span>↗</span>
      </a>
    </aside>
  );
}

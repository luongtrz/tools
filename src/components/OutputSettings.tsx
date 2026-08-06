import { literal, useI18n } from "../i18n";

interface OutputSettingsProps {
  pageSize: string;
  orientation: string;
  margins: string;
  outputName: string;
  onPageSizeChange: (value: string) => void;
  onOrientationChange: (value: string) => void;
  onMarginsChange: (value: string) => void;
  onOutputNameChange: (value: string) => void;
  command: string;
  onCopyCommand: () => void;
}

export default function OutputSettings({
  pageSize,
  orientation,
  margins,
  outputName,
  onPageSizeChange,
  onOrientationChange,
  onMarginsChange,
  onOutputNameChange,
  command,
  onCopyCommand,
}: OutputSettingsProps) {
  const { language, t } = useI18n();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm dark:border-border dark:bg-card dark:shadow-black/20 sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-3 font-mono text-xs font-medium tracking-[1.5px] text-primary">{t("outputSettings")}</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground ">{t("pdfOutput")}</h2>
        </div>
        <span className="text-xl text-muted-foreground" aria-hidden="true">
          ⚙
        </span>
      </div>
      <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2 font-mono text-xs text-muted-foreground ">
          {t("pageSize")}
          <select className="h-11 w-full rounded-lg border border-border bg-muted/30 px-3 font-mono text-sm text-foreground outline-none focus:border-primary/60 focus:ring-4 focus-visible:ring-1 focus-visible:ring-ring dark:border-border dark:bg-muted/30  dark:focus-visible:border-ring dark:focus-visible:ring-1 focus-visible:ring-ring"
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
          >
            <option value="A4">A4 · 210 × 297 mm</option>
            <option value="Letter">Letter · 8.5 × 11 in</option>
            <option value="A5">A5 · 148 × 210 mm</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-muted-foreground ">
          {t("orientation")}
          <select className="h-11 w-full rounded-lg border border-border bg-muted/30 px-3 font-mono text-sm text-foreground outline-none focus:border-primary/60 focus:ring-4 focus-visible:ring-1 focus-visible:ring-ring dark:border-border dark:bg-muted/30  dark:focus-visible:border-ring dark:focus-visible:ring-1 focus-visible:ring-ring"
            value={orientation}
            onChange={(event) => onOrientationChange(event.target.value)}
          >
            <option value="Portrait">{literal("Portrait", language)}</option>
            <option value="Landscape">{literal("Landscape", language)}</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-muted-foreground ">
          {t("margins")}
          <select className="h-11 w-full rounded-lg border border-border bg-muted/30 px-3 font-mono text-sm text-foreground outline-none focus:border-primary/60 focus:ring-4 focus-visible:ring-1 focus-visible:ring-ring dark:border-border dark:bg-muted/30  dark:focus-visible:border-ring dark:focus-visible:ring-1 focus-visible:ring-ring"
            value={margins}
            onChange={(event) => onMarginsChange(event.target.value)}
          >
            <option value="18">{t("standard")} · 18 mm</option>
            <option value="10">{t("narrow")} · 10 mm</option>
            <option value="25">{t("wide")} · 25 mm</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-muted-foreground ">
          {t("fileName")}
          <div className="relative">
            <input
              className="h-11 w-full rounded-lg border border-border bg-muted/30 px-3 pr-12 font-mono text-sm text-foreground outline-none focus:border-primary/60 focus:ring-4 focus-visible:ring-1 focus-visible:ring-ring dark:border-border dark:bg-muted/30  dark:focus-visible:border-ring dark:focus-visible:ring-1 focus-visible:ring-ring"
              value={outputName}
              onChange={(event) => onOutputNameChange(event.target.value)}
            />
            <span className="absolute right-3 top-3 text-xs text-muted-foreground">.pdf</span>
          </div>
        </label>
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 dark:border-border dark:bg-muted/30">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <span className="size-2 shrink-0 rounded-full bg-red-400" />
          <span className="size-2 shrink-0 rounded-full bg-amber-400" />
          <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
          <code className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-muted-foreground ">{command}</code>
        </div>
        <button className="shrink-0 rounded px-2 py-1 font-mono text-xs font-medium text-primary hover:bg-accent" type="button" onClick={onCopyCommand}>
          {t("copy")}
        </button>
      </div>
    </div>
  );
}

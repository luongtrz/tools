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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20 sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-3 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">{t("outputSettings")}</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#111b2c] dark:text-slate-100">{t("pdfOutput")}</h2>
        </div>
        <span className="text-xl text-slate-400" aria-hidden="true">
          ⚙
        </span>
      </div>
      <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {t("pageSize")}
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-orange-400 dark:focus:ring-orange-950/50"
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
          >
            <option value="A4">A4 · 210 × 297 mm</option>
            <option value="Letter">Letter · 8.5 × 11 in</option>
            <option value="A5">A5 · 148 × 210 mm</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {t("orientation")}
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-orange-400 dark:focus:ring-orange-950/50"
            value={orientation}
            onChange={(event) => onOrientationChange(event.target.value)}
          >
            <option value="Portrait">{literal("Portrait", language)}</option>
            <option value="Landscape">{literal("Landscape", language)}</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {t("margins")}
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-orange-400 dark:focus:ring-orange-950/50"
            value={margins}
            onChange={(event) => onMarginsChange(event.target.value)}
          >
            <option value="18">{t("standard")} · 18 mm</option>
            <option value="10">{t("narrow")} · 10 mm</option>
            <option value="25">{t("wide")} · 25 mm</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500 dark:text-slate-400">
          {t("fileName")}
          <div className="relative">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-12 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-orange-400 dark:focus:ring-orange-950/50"
              value={outputName}
              onChange={(event) => onOutputNameChange(event.target.value)}
            />
            <span className="absolute right-3 top-3 text-xs text-slate-400">.pdf</span>
          </div>
        </label>
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-950">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <span className="size-2 shrink-0 rounded-full bg-red-400" />
          <span className="size-2 shrink-0 rounded-full bg-amber-400" />
          <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
          <code className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">{command}</code>
        </div>
        <button className="shrink-0 rounded px-2 py-1 font-mono text-xs font-medium text-[#d95132] hover:bg-orange-50" type="button" onClick={onCopyCommand}>
          {t("copy")}
        </button>
      </div>
    </div>
  );
}

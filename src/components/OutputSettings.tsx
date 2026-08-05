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
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-3 font-mono text-xs font-medium tracking-[1.5px] text-[#f2633d]">OUTPUT SETTINGS</p>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#111b2c]">PDF output</h2>
        </div>
        <span className="text-xl text-slate-400" aria-hidden="true">
          ⚙
        </span>
      </div>
      <div className="my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500">
          Page size
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            value={pageSize}
            onChange={(event) => onPageSizeChange(event.target.value)}
          >
            <option value="A4">A4 · 210 × 297 mm</option>
            <option value="Letter">Letter · 8.5 × 11 in</option>
            <option value="A5">A5 · 148 × 210 mm</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500">
          Orientation
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            value={orientation}
            onChange={(event) => onOrientationChange(event.target.value)}
          >
            <option value="Portrait">Portrait</option>
            <option value="Landscape">Landscape</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500">
          Margins
          <select className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            value={margins}
            onChange={(event) => onMarginsChange(event.target.value)}
          >
            <option value="18">Standard · 18 mm</option>
            <option value="10">Narrow · 10 mm</option>
            <option value="25">Wide · 25 mm</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 font-mono text-xs text-slate-500">
          File name
          <div className="relative">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 pr-12 font-mono text-sm text-slate-600 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              value={outputName}
              onChange={(event) => onOutputNameChange(event.target.value)}
            />
            <span className="absolute right-3 top-3 text-xs text-slate-400">.pdf</span>
          </div>
        </label>
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <span className="size-2 shrink-0 rounded-full bg-red-400" />
          <span className="size-2 shrink-0 rounded-full bg-amber-400" />
          <span className="size-2 shrink-0 rounded-full bg-emerald-400" />
          <code className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-slate-500">{command}</code>
        </div>
        <button className="shrink-0 rounded px-2 py-1 font-mono text-xs font-medium text-[#d95132] hover:bg-orange-50" type="button" onClick={onCopyCommand}>
          Copy
        </button>
      </div>
    </div>
  );
}

export const toolStyles = {
  splitLayout: "grid gap-6 lg:grid-cols-2",
  panelActions: "mt-6 flex flex-wrap items-center justify-end gap-3",
  textarea:
    "block min-h-[340px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100",
  input:
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100",
  select:
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100",
  label: "mb-5 flex flex-col gap-2.5 font-mono text-xs text-slate-500",
  codeOutput:
    "min-h-[340px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-7 text-slate-600",
  documentPreview:
    "min-h-[340px] rounded-xl border border-slate-100 bg-white p-7 text-sm leading-7 text-slate-600 [&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-800 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-800 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-800 [&_code]:rounded [&_code]:bg-orange-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#bd4d32] [&_pre]:my-4 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-slate-800 [&_pre]:p-4 [&_pre]:text-slate-100",
  filePicker:
    "mb-5 flex min-h-[160px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 px-5 text-center text-sm font-semibold text-[#f2633d] transition hover:bg-orange-50",
  fileList: "mb-5 grid gap-2",
  selectedFile: "mb-5 font-mono text-sm text-slate-500",
  hint: "mt-3 text-sm leading-6 text-slate-500",
  segmented: "mb-5 flex w-max max-w-full gap-1 rounded-xl bg-slate-100 p-1",
  statGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
  stat: "flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5",
  inlineFields: "grid gap-4 sm:grid-cols-2",
  check: "mb-5 flex flex-row items-center gap-2 font-mono text-sm text-slate-500",
  listOutput: "my-5 grid gap-2",
  passwordOutput:
    "my-5 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-500",
  qrPreview:
    "grid min-h-[400px] place-items-center rounded-xl bg-slate-50 p-7 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-[360px] [&_img]:bg-white",
  colorPicker: "mb-6 flex items-center gap-4",
  diffOutput:
    "overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-7",
  matchSummary:
    "rounded-lg bg-emerald-50 p-4 font-mono text-sm leading-6 text-emerald-700",
  chipList: "mt-4 flex flex-wrap gap-2",
  empty:
    "rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-base text-slate-500",
} as const;

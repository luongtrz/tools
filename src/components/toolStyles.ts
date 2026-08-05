export const toolStyles = {
  splitLayout: "grid gap-6 lg:grid-cols-2",
  panelActions: "mt-6 flex flex-wrap items-center justify-end gap-3",
  textarea:
    "block min-h-[340px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:border-orange-400 dark:focus:ring-orange-950/50",
  input:
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-orange-400 dark:focus:ring-orange-950/50",
  select:
    "h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-600 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-orange-400 dark:focus:ring-orange-950/50",
  label: "mb-5 flex flex-col gap-2.5 font-mono text-xs text-slate-500 dark:text-slate-400",
  codeOutput:
    "min-h-[340px] overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm leading-7 text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300",
  documentPreview:
    "min-h-[340px] rounded-xl border border-slate-100 bg-white p-7 text-sm leading-7 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 [&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-800 dark:[&_h1]:text-slate-100 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-800 dark:[&_h2]:text-slate-100 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-slate-800 dark:[&_h3]:text-slate-100 [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:font-display [&_h4]:font-bold [&_h5]:mb-2 [&_h5]:mt-4 [&_h5]:font-display [&_h5]:font-bold [&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:font-display [&_h6]:font-bold [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold dark:[&_th]:border-slate-700 dark:[&_th]:bg-slate-900 [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 dark:[&_td]:border-slate-700 [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-0 [&_.task-list-item]:list-none [&_.task-list-item]:pl-0 [&_.task-list-item-checkbox]:mr-2 [&_.task-list-item-checkbox]:align-middle [&_code]:rounded [&_code]:bg-orange-50 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#bd4d32] dark:[&_code]:bg-orange-950/50 dark:[&_code]:text-orange-300 [&_pre]:my-4 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-slate-800 [&_pre]:p-4 [&_pre]:text-slate-100",
  filePicker:
    "mb-5 flex min-h-[160px] cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 px-5 text-center text-sm font-semibold text-[#f2633d] transition hover:bg-orange-50 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300 dark:hover:bg-orange-950/50",
  fileList: "mb-5 grid gap-2",
  selectedFile: "mb-5 font-mono text-sm text-slate-500 dark:text-slate-400",
  hint: "mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400",
  segmented: "mb-5 flex w-max max-w-full gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800",
  statGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
  stat: "flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900",
  inlineFields: "grid gap-4 sm:grid-cols-2",
  check: "mb-5 flex flex-row items-center gap-2 font-mono text-sm text-slate-500 dark:text-slate-400",
  listOutput: "my-5 grid gap-2",
  passwordOutput:
    "my-5 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400",
  qrPreview:
    "grid min-h-[400px] place-items-center rounded-xl bg-slate-50 p-7 dark:bg-slate-950 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-[360px] [&_img]:bg-white",
  colorPicker: "mb-6 flex items-center gap-4",
  diffOutput:
    "overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-7 dark:border-slate-700 dark:bg-slate-950",
  matchSummary:
    "rounded-lg bg-emerald-50 p-4 font-mono text-sm leading-6 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  chipList: "mt-4 flex flex-wrap gap-2",
  empty:
    "rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-base text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
} as const;

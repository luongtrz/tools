export const toolStyles = {
  splitLayout: "grid min-w-0 gap-4 lg:grid-cols-2 [&>*]:min-w-0",
  panelActions: "mt-4 flex flex-wrap items-center justify-end gap-2",
  textarea:
    "min-h-[340px] w-full resize-y rounded-md border border-input bg-muted/30 px-4 py-3 font-mono text-sm leading-7 text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
  input:
    "h-9 w-full rounded-md border border-input bg-muted/30 px-3 font-mono text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
  select:
    "h-9 w-full rounded-md border border-input bg-muted/30 px-3 font-mono text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring",
  label: "mb-4 flex flex-col gap-2 font-mono text-xs text-muted-foreground",
  codeOutput:
    "min-h-[340px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 font-mono text-sm leading-7 text-foreground",
  documentPreview:
    "min-h-[340px] rounded-md border border-border bg-background p-6 text-sm leading-7 text-foreground [&_h1]:mb-4 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_h4]:mb-2 [&_h4]:mt-4 [&_h4]:font-display [&_h4]:font-bold [&_h5]:mb-2 [&_h5]:mt-4 [&_h5]:font-display [&_h5]:font-bold [&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:font-display [&_h6]:font-bold [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_.contains-task-list]:list-none [&_.contains-task-list]:pl-0 [&_.task-list-item]:list-none [&_.task-list-item]:pl-0 [&_.task-list-item-checkbox]:mr-2 [&_.task-list-item-checkbox]:align-middle [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-foreground [&_pre]:my-4 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:text-foreground",
  filePicker:
    "mb-4 flex min-h-[160px] cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-primary/40 bg-primary/5 px-5 text-center text-sm font-medium text-primary transition hover:bg-primary/10",
  fileList: "mb-4 grid gap-2",
  selectedFile: "mb-4 font-mono text-sm text-muted-foreground",
  hint: "mt-3 text-sm leading-6 text-muted-foreground",
  segmented: "mb-4 inline-flex w-max max-w-full gap-1 rounded-md bg-muted p-1",
  statGrid: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
  stat: "rounded-md border border-border bg-card p-4",
  inlineFields: "grid gap-4 sm:grid-cols-2",
  check: "mb-4 flex flex-row items-center gap-2 font-mono text-sm text-muted-foreground",
  listOutput: "my-4 grid gap-2",
  passwordOutput:
    "my-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-4 py-3 font-mono text-sm text-foreground",
  qrPreview:
    "grid min-h-[400px] place-items-center rounded-md bg-muted/30 p-7 [&_img]:h-auto [&_img]:w-full [&_img]:max-w-[360px] [&_img]:bg-white",
  colorPicker: "mb-5 flex items-center gap-4",
  diffOutput:
    "overflow-auto rounded-md border border-border bg-muted/30 p-3 font-mono text-sm leading-7",
  matchSummary:
    "rounded-md border border-emerald-200 bg-emerald-50 p-4 font-mono text-sm leading-6 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  chipList: "mt-3 flex flex-wrap gap-2",
  empty:
    "rounded-md border border-dashed border-border bg-card p-12 text-center text-base text-muted-foreground",
} as const;

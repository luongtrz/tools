import { useState, type ReactNode } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { literal, useI18n } from "@/i18n";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export interface ToolExample {
  label: string;
  description?: string;
  value: string;
}

interface ToolExamplesProps {
  examples: ToolExample[];
  onSelect: (value: string) => void;
  className?: string;
}

export function ToolExamples({
  examples,
  onSelect,
  className,
}: ToolExamplesProps) {
  const { language } = useI18n();
  const [open, setOpen] = useState(false);
  if (!examples.length) return null;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        aria-expanded={open}
      >
        <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
        <span>
          {literal(open ? "Hide examples" : "Show examples", language)}
        </span>
        <ChevronRight
          className={cn(
            "size-3 transition-transform",
            open && "rotate-90",
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <Button
              key={example.label}
              type="button"
              variant="outline"
              onClick={() => onSelect(example.value)}
              className="h-auto min-w-0 max-w-full justify-between whitespace-normal px-3 py-2 text-left text-xs"
            >
              <span className="flex min-w-0 flex-col items-start gap-0.5 break-words">
                <span className="text-sm font-medium text-foreground">
                  {example.label}
                </span>
                {example.description && (
                  <span className="font-normal text-muted-foreground">
                    {example.description}
                  </span>
                )}
              </span>
              <ChevronRight
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ToolStat {
  label: string;
  value: ReactNode;
  hint?: string;
}

interface ToolStatsProps {
  items: ToolStat[];
  className?: string;
}

export function ToolStats({ items, className }: ToolStatsProps) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-border bg-card p-4"
        >
          <div className="font-mono text-xs text-muted-foreground">
            {item.label}
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">
            {item.value}
          </div>
          {item.hint && (
            <div className="mt-1 text-xs text-muted-foreground">
              {item.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export interface DroppedFile {
  name: string;
  size: number;
  text: () => Promise<string>;
  blob: () => Promise<Blob>;
}

interface FileDropZoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: DroppedFile[]) => void;
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
  maxSizeBytes?: number;
}

export function FileDropZone({
  accept,
  multiple = false,
  onFiles,
  className,
  label,
  description,
  maxSizeBytes = 20 * 1024 * 1024,
}: FileDropZoneProps) {
  const { language, t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFiles(list: FileList | null): void {
    if (!list || !list.length) return;
    const files = Array.from(list);
    if (!multiple && files.length > 1) {
      setError(t("dropOneFile"));
      return;
    }
    const invalidType = files.find((file) => !matchesAccept(file, accept));
    if (invalidType) {
      setError(t("invalidFileType"));
      return;
    }
    const tooLarge = files.find((file) => file.size > maxSizeBytes);
    if (tooLarge) {
      setError(t("fileTooLarge", {
        name: tooLarge.name,
        max: formatBytes(maxSizeBytes),
      }));
      return;
    }
    setError(null);
    onFiles(
      files.map((file) => ({
        name: file.name,
        size: file.size,
        text: () => file.text(),
        blob: () => Promise.resolve(file),
      })),
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label
        className={cn(
          "flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-muted/30 px-4 text-center text-sm font-medium transition-colors",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/40 hover:bg-primary/5",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          pickFiles(event.dataTransfer.files);
        }}
      >
        {label ?? (
          <span className="text-foreground">
            {literal("Drop a file or click to browse", language)}
          </span>
        )}
        {description && (
          <span className="font-normal text-xs text-muted-foreground">
            {typeof description === "string"
              ? literal(description, language)
              : description}
          </span>
        )}
        <input
          className="sr-only"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            pickFiles(event.target.files);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  return accept.split(",").some((entry) => {
    const token = entry.trim().toLowerCase();
    if (!token) return false;
    if (token.startsWith(".")) return file.name.toLowerCase().endsWith(token);
    if (token.endsWith("/*")) return file.type.toLowerCase().startsWith(token.slice(0, -1));
    return file.type.toLowerCase() === token;
  });
}

interface ErrorLineProps {
  text: string;
  error: { message: string; line?: number; column?: number };
  className?: string;
}

export function ErrorLine({ text, error, className }: ErrorLineProps) {
  const lines = text.split("\n");
  const errorLine = error.line ?? 1;
  const context = lines.map((line, index) => ({
    number: index + 1,
    content: line,
    isError: index + 1 === errorLine,
  }));
  return (
    <div
      className={cn(
        "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm",
        className,
      )}
      role="alert"
    >
      <div className="mb-2 font-mono text-xs text-destructive">
        {error.column
          ? `Line ${errorLine}, column ${error.column}`
          : `Line ${errorLine}`}
        : {error.message}
      </div>
      <pre className="overflow-auto rounded-md bg-background p-3 font-mono text-xs leading-6 text-foreground">
        {context.slice(Math.max(0, errorLine - 3), errorLine + 2).map((row) => (
          <div
            key={row.number}
            className={cn(
              "flex gap-3",
              row.isError && "bg-destructive/10 text-destructive",
            )}
          >
            <span className="w-8 shrink-0 text-right text-muted-foreground">
              {row.number}
            </span>
            <span className="whitespace-pre-wrap break-all">
              {row.content || " "}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024)
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

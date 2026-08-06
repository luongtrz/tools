import { useState, type ReactNode } from "react";
import { categoryLabel, literal, localizedTool, useI18n } from "@/i18n";
import { getTool } from "@/toolRegistry";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import ToolNavbar from "./ToolNavbar";
import { toolStyles } from "./toolStyles";
import { Badge } from "./ui/badge";
import { Button, type ButtonProps } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

interface ToolShellProps {
  activeSlug?: string;
  children: ReactNode;
}

export function ToolShell({ activeSlug, children }: ToolShellProps) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <ToolNavbar activeSlug={activeSlug} />
      <main className="mx-auto w-full max-w-[1600px] px-4 pb-20 pt-8 sm:px-8 sm:pt-10 lg:px-12">
        {children}
      </main>
      <footer className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 pb-8 pt-6 font-mono text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-8 lg:px-12">
        <span>
          toolmd <span className="mx-2 text-border">/</span> {t("footerDescription")}
        </span>
        <span>{t("footerBuilt")}</span>
      </footer>
    </div>
  );
}

interface ToolPageProps {
  slug: string;
  eyebrow?: string;
  children: ReactNode;
}

export function ToolPage({ slug, eyebrow, children }: ToolPageProps) {
  const { language, t } = useI18n();
  const tool = getTool(slug);
  if (!tool) return null;
  const localized = localizedTool(tool, language);
  return (
    <ToolShell activeSlug={slug}>
      <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:mb-12 sm:flex-row">
        <div className="max-w-2xl">
          <a
            className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
            href="/"
          >
            {t("backAllTools")}
          </a>
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            {eyebrow
              ? literal(eyebrow, language)
              : categoryLabel(tool.category, language).toUpperCase()}
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            {localized.title}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
            {localized.description}
          </p>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          /{tool.slug}
        </Badge>
      </div>
      {children}
    </ToolShell>
  );
}

interface PanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ToolPanel({
  title,
  description,
  children,
  actions,
  className = "",
}: PanelProps) {
  const { language } = useI18n();
  return (
    <Card className={cn("mb-4", className)}>
      <CardHeader className="flex flex-col items-start justify-between gap-3 space-y-0 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <CardTitle className="text-lg">{literal(title, language)}</CardTitle>
          {description && (
            <CardDescription className="max-w-2xl">
              {literal(description, language)}
            </CardDescription>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

interface ButtonOwnProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "quiet" | "danger";
  disabled?: boolean;
  busy?: boolean;
}

type ToolButtonProps = ButtonOwnProps &
  Omit<ButtonProps, "children" | "onClick" | "type" | "variant" | "disabled">;

export function ToolButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  busy = false,
  ...rest
}: ToolButtonProps) {
  const { language } = useI18n();
  const shadcnVariant: ButtonProps["variant"] =
    variant === "primary"
      ? "default"
      : variant === "danger"
        ? "destructive"
        : "outline";
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy}
      variant={shadcnVariant}
      {...rest}
    >
      {typeof children === "string" ? literal(children, language) : children}
    </Button>
  );
}

export function ToolTextArea({
  value,
  onChange,
  placeholder,
  rows = 14,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel: string;
  className?: string;
}) {
  const { language } = useI18n();
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={literal(placeholder, language)}
      rows={rows}
      aria-label={literal(ariaLabel, language)}
      spellCheck={false}
      className={cn(toolStyles.textarea, "font-mono text-sm", className)}
    />
  );
}

export function ToolLabel({ children }: { children: string }) {
  const { language } = useI18n();
  return <>{literal(children, language)}</>;
}

export function FormLabel({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
      {children}
    </Label>
  );
}

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const { language, t } = useI18n();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy(): Promise<void> {
    const succeeded = await copyText(value);
    if (!succeeded) {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1600);
      return;
    }
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void handleCopy()}
      disabled={!value}
    >
      {copyState === "copied"
        ? t("copied")
        : copyState === "failed"
          ? t("copyFailed")
          : literal(label, language)}
    </Button>
  );
}

export function ToolNotice({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
}) {
  const variantClasses = {
    info: "border-border bg-muted/40 text-muted-foreground",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    error:
      "border-destructive/40 bg-destructive/10 text-destructive dark:bg-destructive/20",
  };
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm leading-6",
        variantClasses[variant],
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

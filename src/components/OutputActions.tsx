import { type ReactNode } from "react";
import { ArrowLeftRight, Copy, Download, RotateCcw, Trash2 } from "lucide-react";
import { literal, useI18n } from "@/i18n";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface OutputActionsProps {
  onCopy?: () => void;
  onDownload?: () => void;
  onReset?: () => void;
  onSwap?: () => void;
  onClear?: () => void;
  downloadLabel?: string;
  copyLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function OutputActions({
  onCopy,
  onDownload,
  onReset,
  onSwap,
  onClear,
  downloadLabel = "Download",
  copyLabel = "Copy",
  className,
  children,
}: OutputActionsProps) {
  const { language } = useI18n();
  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-wrap items-center justify-end gap-2 lg:w-auto",
        className,
      )}
    >
      {children}
      {onClear && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="size-3.5" />
          {literal("Clear", language)}
        </Button>
      )}
      {onReset && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          {literal("Reset", language)}
        </Button>
      )}
      {onSwap && (
        <Button type="button" variant="outline" size="sm" onClick={onSwap}>
          <ArrowLeftRight className="size-3.5" />
          {literal("Swap", language)}
        </Button>
      )}
      {onCopy && (
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="size-3.5" />
          {literal(copyLabel, language)}
        </Button>
      )}
      {onDownload && (
        <Button type="button" size="sm" onClick={onDownload}>
          <Download className="size-3.5" />
          {literal(downloadLabel, language)}
        </Button>
      )}
    </div>
  );
}

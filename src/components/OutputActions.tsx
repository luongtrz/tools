import { type ReactNode } from "react";
import { ArrowLeftRight, Copy, Download, RotateCcw, Trash2 } from "lucide-react";
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
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        className,
      )}
    >
      {children}
      {onClear && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="size-3.5" />
          Clear
        </Button>
      )}
      {onReset && (
        <Button type="button" variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      )}
      {onSwap && (
        <Button type="button" variant="outline" size="sm" onClick={onSwap}>
          <ArrowLeftRight className="size-3.5" />
          Swap
        </Button>
      )}
      {onCopy && (
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="size-3.5" />
          {copyLabel}
        </Button>
      )}
      {onDownload && (
        <Button type="button" size="sm" onClick={onDownload}>
          <Download className="size-3.5" />
          {downloadLabel}
        </Button>
      )}
    </div>
  );
}

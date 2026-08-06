import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked === "indeterminate" ? "mixed" : checked}
        data-state={checked === "indeterminate" ? "indeterminate" : checked ? "checked" : "unchecked"}
        disabled={disabled}
        id={id}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "grid size-4 place-items-center rounded-sm border border-input bg-background transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          checked && "border-primary bg-primary text-primary-foreground",
          className,
        )}
        {...props}
      >
        {checked === "indeterminate" ? (
          <Minus className="size-3" />
        ) : checked ? (
          <Check className="size-3" />
        ) : null}
      </button>
    );
  },
);
Checkbox.displayName = "Checkbox";

import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-eyebrow",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        secondary: "bg-primary/18 text-primary",
        success: "bg-success/18 text-success",
        warning: "bg-warning/18 text-warning",
        destructive: "bg-destructive/18 text-destructive",
        outline: "border border-border bg-transparent text-foreground"
      }
    },
    defaultVariants: {
      variant: "neutral"
    }
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ className, variant }))} {...props} />;
}

export { badgeVariants };

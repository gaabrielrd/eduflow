import type { HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted/80 shadow-sm", className)}
      {...props}
    />
  );
}

"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import type * as React from "react";
import { forwardRef } from "react";

import { cn } from "../../lib/cn";

export const Progress = forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value = 0, ...props }, ref) => {
  const numericValue = value ?? 0;

  return (
    <ProgressPrimitive.Root
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-muted", className)}
      ref={ref}
      value={numericValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary transition-all"
        style={{ transform: `translateX(-${100 - numericValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

Progress.displayName = ProgressPrimitive.Root.displayName;

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-md",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("flex flex-col gap-2 p-5", className)} ref={ref} {...props} />
));

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    className={cn("text-lg font-semibold tracking-tight text-card-foreground", className)}
    ref={ref}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p className={cn("text-sm leading-6 text-muted-foreground", className)} ref={ref} {...props} />
));

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("px-5 pb-5", className)} ref={ref} {...props} />
));

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("flex items-center gap-3 px-5 pb-5 pt-0", className)}
    ref={ref}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

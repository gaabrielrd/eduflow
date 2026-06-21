import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        "rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]",
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
  <div className={cn("flex flex-col gap-2 p-6", className)} ref={ref} {...props} />
));

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    className={cn("text-lg font-semibold tracking-[-0.03em] text-slate-950", className)}
    ref={ref}
    {...props}
  />
));

CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p className={cn("text-sm leading-6 text-slate-600", className)} ref={ref} {...props} />
));

CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("px-6 pb-6", className)} ref={ref} {...props} />
));

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn("flex items-center gap-3 px-6 pb-6 pt-0", className)}
    ref={ref}
    {...props}
  />
));

CardFooter.displayName = "CardFooter";

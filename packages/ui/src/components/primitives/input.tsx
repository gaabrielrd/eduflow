import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-card px-4 py-2 text-sm text-card-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          className
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

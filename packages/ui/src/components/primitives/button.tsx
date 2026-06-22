import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  type ReactNode
} from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110 disabled:bg-primary",
        secondary: "bg-muted text-foreground hover:bg-accent disabled:bg-muted",
        outline:
          "border border-border bg-transparent text-foreground hover:border-input hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-105 disabled:bg-destructive"
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 rounded-md p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
  readonly loading?: boolean;
  readonly leadingIcon?: ReactNode;
  readonly trailingIcon?: ReactNode;
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      children,
      disabled,
      leadingIcon,
      loading = false,
      size,
      trailingIcon,
      type = "button",
      variant,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ className, size, variant }))}
        disabled={disabled || loading}
        ref={ref}
        type={type}
        {...props}
      >
        {loading ? <Spinner /> : leadingIcon}
        <Slottable>{children}</Slottable>
        {!loading ? trailingIcon : null}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };

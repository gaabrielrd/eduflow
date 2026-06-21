import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import {
  type ButtonHTMLAttributes,
  forwardRef,
  type ReactNode
} from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-slate-950 text-white hover:bg-slate-800 disabled:bg-slate-950",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:bg-slate-100",
        outline:
          "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-950",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-600"
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10 rounded-full p-0"
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

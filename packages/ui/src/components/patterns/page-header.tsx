import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface PageHeaderProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  readonly eyebrow?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
}

export function PageHeader({
  actions,
  className,
  description,
  eyebrow,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn("flex flex-wrap items-end justify-between gap-4", className)}
      {...props}
    >
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-tighter text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

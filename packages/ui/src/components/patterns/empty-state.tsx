import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface EmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
  readonly icon?: ReactNode;
}

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border bg-card/88 p-8 text-center shadow-md",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon ?? (
            <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 7V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
              />
            </svg>
          )}
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-card-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

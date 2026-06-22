import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface LoadingStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
}

export function LoadingState({
  className,
  description = "Aguarde enquanto preparamos a proxima etapa.",
  title = "Carregando",
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/88 p-8 text-center shadow-md",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <span
          aria-hidden="true"
          className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-muted border-r-primary"
        />
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-card-foreground">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

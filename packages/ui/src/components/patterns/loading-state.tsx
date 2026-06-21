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
        "rounded-[1.75rem] border border-slate-200 bg-white/80 p-8 text-center shadow-sm",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <span
          aria-hidden="true"
          className="inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-slate-300 border-r-slate-950"
        />
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../../lib/cn";

export interface ErrorStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly action?: ReactNode;
}

export function ErrorState({
  action,
  className,
  description = "Nao foi possivel concluir esta etapa agora. Tente novamente em instantes.",
  title = "Algo saiu do esperado",
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/35 bg-destructive/12 p-8 text-center shadow-md",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-destructive/18 text-destructive">
          <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 8V12M12 16H12.01M10.289 3.859L1.82 18C1.64575 18.3021 1.55408 18.6448 1.5542 18.9935C1.55433 19.3422 1.64625 19.6848 1.82071 19.9868C1.99518 20.2889 2.24616 20.5399 2.54822 20.7144C2.85028 20.8888 3.19297 20.9807 3.54166 20.9808H20.4583C20.807 20.9807 21.1497 20.8888 21.4518 20.7144C21.7538 20.5399 22.0048 20.2889 22.1793 19.9868C22.3538 19.6848 22.4457 19.3422 22.4458 18.9935C22.4459 18.6448 22.3543 18.3021 22.18 18L13.711 3.859C13.5365 3.55775 13.2859 3.30757 12.9843 3.13363C12.6828 2.95968 12.3408 2.86816 11.9927 2.86816C11.6445 2.86816 11.3026 2.95968 11.001 3.13363C10.6994 3.30757 10.4488 3.55775 10.2743 3.859"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-card-foreground">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  );
}

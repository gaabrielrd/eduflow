import Link from "next/link";
import type { ReactNode } from "react";

import { appRoutes } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-7xl gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[1.75rem] border border-border bg-card p-6 text-card-foreground shadow-lg">
          <Link href="/" className="block">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              EduFlow
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
              Workspace web
            </h1>
          </Link>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Base inicial da area autenticada futura com navegacao clara e
            espaco para crescimento modular.
          </p>

          <nav className="mt-10 space-y-2">
            {appRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="flex items-center justify-between rounded-2xl border border-border/70 px-4 py-3 text-sm text-muted-foreground transition hover:border-input hover:bg-accent hover:text-foreground"
              >
                <span>{route.label}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                  go
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="rounded-[1.75rem] border border-border bg-card/88 p-6 shadow-lg backdrop-blur sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Application shell
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Preparado para auth, tenancy e fluxos principais do produto.
              </p>
            </div>
            <div className="rounded-full bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Sprint foundation
            </div>
          </header>

          <main className="pt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

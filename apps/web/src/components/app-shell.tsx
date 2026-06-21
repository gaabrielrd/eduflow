import Link from "next/link";
import type { ReactNode } from "react";

import { appRoutes } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-7xl gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]">
          <Link href="/" className="block">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              EduFlow
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.05em]">
              Workspace web
            </h1>
          </Link>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            Base inicial da area autenticada futura com navegacao clara e
            espaco para crescimento modular.
          </p>

          <nav className="mt-10 space-y-2">
            {appRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/6 hover:text-white"
              >
                <span>{route.label}</span>
                <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  go
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="rounded-[1.75rem] border border-white/60 bg-white/82 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Application shell
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Preparado para auth, tenancy e fluxos principais do produto.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
              Sprint foundation
            </div>
          </header>

          <main className="pt-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

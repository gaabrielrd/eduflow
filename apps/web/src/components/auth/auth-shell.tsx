import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function AuthShell({
  children,
  description,
  eyebrow,
  title
}: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/82 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <section className="relative flex flex-col justify-between bg-slate-950 px-7 py-8 text-white sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.18),transparent_28%)]" />
          <div className="relative flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-300"
            >
              EduFlow
            </Link>
            <div className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
              Auth flow
            </div>
          </div>

          <div className="relative max-w-xl space-y-8 py-10 lg:py-16">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                {eyebrow}
              </p>
              <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-md text-sm leading-7 text-slate-300 sm:text-base">
                {description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-t border-white/12 pt-4">
                <p className="text-sm font-semibold text-white">Fluxo direto</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Entrar, validar o acesso e continuar sem duplicar regras entre telas.
                </p>
              </div>
              <div className="border-t border-white/12 pt-4">
                <p className="text-sm font-semibold text-white">Base segura</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Tokens apenas em memoria, contexto de organizacao revalidado na API.
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex flex-wrap gap-3 text-sm text-slate-300">
            <Link href="/login" className="transition hover:text-white">
              Login
            </Link>
            <span aria-hidden="true" className="text-slate-500">
              /
            </span>
            <Link href="/register" className="transition hover:text-white">
              Cadastro
            </Link>
          </div>
        </section>

        <section className="flex items-center justify-center bg-[linear-gradient(180deg,rgba(248,250,252,0.9)_0%,rgba(241,245,249,0.95)_100%)] px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}

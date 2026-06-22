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
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-card/88 shadow-lg backdrop-blur lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
        <section className="relative flex flex-col justify-between bg-background px-7 py-8 text-foreground sm:px-10 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-accent/20" />
          <div className="relative flex items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-md text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              EduFlow
            </Link>
            <div className="rounded-full border border-border/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Auth flow
            </div>
          </div>

          <div className="relative max-w-xl space-y-8 py-10 lg:py-16">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                {eyebrow}
              </p>
              <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.06em] text-balance sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border-t border-border/70 pt-4">
                <p className="text-sm font-semibold text-foreground">Fluxo direto</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Entrar, validar o acesso e continuar sem duplicar regras entre telas.
                </p>
              </div>
              <div className="border-t border-border/70 pt-4">
                <p className="text-sm font-semibold text-foreground">Base segura</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Tokens apenas em memoria, contexto de organizacao revalidado na API.
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex flex-wrap gap-3 text-sm text-muted-foreground">
            <Link
              href="/login"
              className="rounded-md outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Login
            </Link>
            <span aria-hidden="true" className="text-muted-foreground/70">
              /
            </span>
            <Link
              href="/register"
              className="rounded-md outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Cadastro
            </Link>
          </div>
        </section>

        <section className="flex items-center justify-center bg-card/60 px-5 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}

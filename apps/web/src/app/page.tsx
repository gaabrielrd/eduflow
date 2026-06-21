import Link from "next/link";

import { SectionLabel } from "@/components/section-label";
import { statusCards } from "@/lib/navigation";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden px-6 py-10 sm:px-10 lg:px-14">
        <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl flex-col justify-between gap-12 rounded-[2rem] border border-white/60 bg-white/72 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10 lg:p-14">
          <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold uppercase tracking-[0.28em] text-slate-500">
                EduFlow
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                Base da plataforma educacional modular pronta para crescer com
                autoria, operacao e experiencia do aluno.
              </p>
            </div>
            <div className="hidden rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white md:block">
              Web online
            </div>
          </div>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:items-end">
            <div className="max-w-3xl">
              <SectionLabel>Plataforma educacional</SectionLabel>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
                O workspace do EduFlow agora tem uma entrada web pronta para
                produto.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Esta sprint entrega a base de App Router, Tailwind, layout raiz
                e rotas iniciais para a area publica e a futura area
                autenticada.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Abrir area do app
                </Link>
                <Link
                  href="/app/dashboard"
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                >
                  Ver dashboard
                </Link>
                <Link
                  href="/status"
                  className="rounded-full border border-transparent bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Ver status
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {statusCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {card.eyebrow}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

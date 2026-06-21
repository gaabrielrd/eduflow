import Link from "next/link";

import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@eduflow/ui";
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
              <PageHeader
                className="block"
                description="Esta sprint entrega a base de App Router, Tailwind, layout raiz e rotas iniciais para a area publica e a futura area autenticada."
                eyebrow="Plataforma educacional"
                title="O workspace do EduFlow agora tem uma entrada web pronta para produto."
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/register">Comecar cadastro</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Fazer login</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/status">Ver status</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {statusCards.map((card) => (
                <Card key={card.title} className="border-slate-200/80 bg-slate-50/80 shadow-none">
                  <CardHeader className="pb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {card.eyebrow}
                    </p>
                    <CardTitle>{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-slate-600">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

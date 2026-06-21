import { SectionLabel } from "@/components/section-label";
import { StatusPill } from "@/components/status-pill";

const dashboardTiles = [
  {
    label: "Cursos ativos",
    value: "00",
    detail: "Placeholder para KPIs de autoria e operacao."
  },
  {
    label: "Publicacoes",
    value: "00",
    detail: "Estrutura pronta para cards de status e versao."
  },
  {
    label: "Alunos",
    value: "00",
    detail: "Espaco reservado para matriculas e progresso."
  }
];

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>Dashboard</SectionLabel>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Placeholder do painel principal
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            O layout foi preparado para receber indicadores, tabelas e fluxos
            operacionais sem depender de uma grade pesada de cards.
          </p>
        </div>
        <StatusPill tone="success">Rota /app/dashboard pronta</StatusPill>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {dashboardTiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {tile.label}
            </p>
            <p className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-slate-950">
              {tile.value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {tile.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

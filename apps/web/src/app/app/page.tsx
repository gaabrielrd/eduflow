import { SectionLabel } from "@/components/section-label";

export default function AppHomePage() {
  return (
    <section className="space-y-6">
      <div>
        <SectionLabel>Workspace</SectionLabel>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Shell inicial da aplicacao
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Esta area sera a base das rotas autenticadas para autores,
          administradores, gestores e alunos. Nesta sprint, ela existe como
          placeholder navegavel e pronta para receber auth e features reais.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-lg font-semibold text-slate-950">
            Proxima camada
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Guards de autenticacao, dados de sessao e estado de organizacao
            entram aqui sem precisar remodelar o shell principal.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
          <h2 className="text-lg font-semibold">Area em construcao</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Use a navegacao lateral para acessar o placeholder do dashboard e a
            rota tecnica de status.
          </p>
        </div>
      </div>
    </section>
  );
}

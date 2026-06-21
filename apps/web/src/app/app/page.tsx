import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader
} from "@eduflow/ui";

export default function AppHomePage() {
  return (
    <section className="space-y-6">
      <PageHeader
        description="Esta area sera a base das rotas autenticadas para autores, administradores, gestores e alunos. Nesta sprint, ela existe como placeholder navegavel e pronta para receber auth e features reais."
        eyebrow="Workspace"
        title="Shell inicial da aplicacao"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Proxima camada</CardTitle>
            <CardDescription>
              Guards de autenticacao, dados de sessao e estado de organizacao entram aqui sem
              precisar remodelar o shell principal.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-slate-900 bg-slate-950 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]">
          <CardHeader>
            <CardTitle className="text-white">Area em construcao</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-300">
              Use a navegacao lateral para acessar o placeholder do dashboard e a rota tecnica de
              status.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

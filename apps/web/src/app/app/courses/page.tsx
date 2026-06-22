import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@eduflow/ui";

export default function CoursesPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        actions={<Badge variant="secondary">Placeholder</Badge>}
        eyebrow="Cursos"
        title="Area inicial de cursos"
        description="Aqui entra a gestao de cursos, modulos e publicacoes assim que o fluxo de autoria for implementado."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Catalogo</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Estrutura preparada para listagem, busca e filtros dos cursos ativos.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pipeline editorial</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Espaco reservado para status de rascunho, revisao e publicacao.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Proximos passos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            CRUD de cursos e versoes deve encaixar aqui sem alterar o shell.
          </CardContent>
        </Card>
      </div>

      <EmptyState
        title="Nenhum curso conectado ainda"
        description="Quando a camada de autoria entrar, esta area exibira cursos, modulos e estados editoriais."
      />
    </section>
  );
}

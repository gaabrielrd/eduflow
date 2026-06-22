import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@eduflow/ui";

export default function MediaPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        actions={<Badge variant="secondary">Placeholder</Badge>}
        eyebrow="Midia"
        title="Biblioteca inicial de midia"
        description="A area de midia sera a base para uploads, organizacao de arquivos e reuso em cursos e experiencias."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Uploads</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Area pronta para receber envio de arquivos e feedback de processamento.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Organizacao</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Pastas, tags e estados de uso podem entrar aqui em futuras sprints.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Governanca</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Espaco reservado para limites, formatos e politicas de acesso.
          </CardContent>
        </Card>
      </div>

      <EmptyState
        title="Nenhum arquivo disponivel"
        description="A biblioteca aparece vazia por enquanto, mas o shell ja suporta essa area como primeira secao de produto."
      />
    </section>
  );
}

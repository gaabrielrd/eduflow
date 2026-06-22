import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@eduflow/ui";

export default function ReportsPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        actions={<Badge variant="secondary">Placeholder</Badge>}
        eyebrow="Relatorios"
        title="Camada inicial de relatorios"
        description="Esta secao sera usada para consolidar metricas de progresso, publicacao e engajamento."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Engajamento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            O shell ja acomoda cards e paines para leituras operacionais futuras.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Conclusao</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Aqui entram taxas de conclusao, gargalos e comparativos por trilha.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operacao</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Estrutura pronta para filtros, exportacao e views futuras.
          </CardContent>
        </Card>
      </div>

      <EmptyState
        title="Nenhum relatorio disponivel"
        description="As visualizacoes analiticas entram em uma sprint futura sem exigir mudancas no layout principal."
      />
    </section>
  );
}

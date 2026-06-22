import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Skeleton
} from "@eduflow/ui";

export default function CoursesPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        actions={<Badge variant="secondary">Placeholder</Badge>}
        eyebrow="Cursos"
        title="Area inicial de cursos"
        description="Aqui entra a gestao de cursos, modulos e publicacoes assim que o fluxo de autoria for implementado."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <LoadingState
          description="Use loading com contexto para explicar que a lista de cursos e o pipeline editorial ainda estao sendo preparados."
          srLabel="Carregando catalogo e pipeline de cursos"
          title="Carregando area de cursos"
        />

        <ErrorState
          action={<Button>Tentar novamente</Button>}
          description="Se a origem falhar, exponha uma mensagem de pagina clara e uma acao objetiva para recarregar."
          title="Nao foi possivel carregar o catalogo"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </CardContent>
        </Card>
      </div>

      <EmptyState
        action={<Button variant="secondary">Criar primeiro curso</Button>}
        title="Nenhum curso conectado ainda"
        description="Quando nao houver dados, o estado vazio deve explicar o motivo e sugerir a proxima acao do fluxo."
      />
    </section>
  );
}

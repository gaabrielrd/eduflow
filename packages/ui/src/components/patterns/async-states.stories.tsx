import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../primitives/button";
import { Card, CardContent, CardHeader } from "../primitives/card";
import { Skeleton } from "../primitives/skeleton";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { LoadingState } from "./loading-state";

const meta = {
  title: "Patterns/AsyncStates",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Async UI patterns
          </p>
          <h1 className="text-3xl font-semibold tracking-tighter">
            Loading, erro, empty, skeleton e retry
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Use loading com contexto textual, erro com descricao acionavel e retry explicito, empty para ausencia de dados e skeleton para preservar layout enquanto o conteudo chega.
          </p>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <LoadingState
            description="Evite spinner solto: sempre explique o que esta sendo carregado."
            srLabel="Carregando lista de cursos"
            title="Buscando cursos"
          />
          <ErrorState
            action={<Button>Tentar novamente</Button>}
            description="Se houver recuperacao possivel, exponha uma acao clara e objetiva."
            title="Falha ao carregar dados"
          />
          <EmptyState
            action={<Button variant="secondary">Criar primeiro item</Button>}
            description="Quando nao houver dados, descreva o proximo passo esperado."
            title="Nenhum resultado encontrado"
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Skeleton composavel</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
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
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-md">
          <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
            Regras de uso
          </h2>
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <p>Loading: titulo e descricao curtos com contexto do que esta sendo preparado.</p>
            <p>Error: mensagem clara, acionavel e retry visivel quando houver tentativa segura.</p>
            <p>Empty: ausencia de dados, nao falha de carregamento.</p>
            <p>Skeleton: preserva layout enquanto o dado ainda nao existe na tela.</p>
            <p>Erro de campo: continua no proprio formulario, ligado ao campo e com `role=\"alert\"`.</p>
            <p>Erro de pagina: use `ErrorState` ou banner equivalente, nao a mensagem de campo.</p>
          </div>
        </section>
      </div>
    </div>
  )
};

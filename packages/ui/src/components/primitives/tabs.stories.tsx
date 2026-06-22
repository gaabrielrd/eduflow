import type { Meta, StoryObj } from "@storybook/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Tabs para alternancia entre paineis relacionados. Teclado: Tab leva ao conjunto de abas e setas horizontais alternam a aba ativa mantendo o foco no trigger selecionado."
      }
    }
  }
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs className="w-full max-w-2xl" defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="content">Conteudo</TabsTrigger>
        <TabsTrigger value="metrics">Metricas</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-md">
          Visao geral da trilha, com objetivo, publico e progresso de setup.
        </div>
      </TabsContent>
      <TabsContent value="content">
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-md">
          Modulos, aulas e recursos associados a esta experiencia de aprendizado.
        </div>
      </TabsContent>
      <TabsContent value="metrics">
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-md">
          Taxa de conclusao, engajamento e principais gargalos de navegacao.
        </div>
      </TabsContent>
    </Tabs>
  )
};

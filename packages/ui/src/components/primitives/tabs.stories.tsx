import type { Meta, StoryObj } from "@storybook/react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  tags: ["autodocs"]
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
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Visao geral da trilha, com objetivo, publico e progresso de setup.
        </div>
      </TabsContent>
      <TabsContent value="content">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Modulos, aulas e recursos associados a esta experiencia de aprendizado.
        </div>
      </TabsContent>
      <TabsContent value="metrics">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Taxa de conclusao, engajamento e principais gargalos de navegacao.
        </div>
      </TabsContent>
    </Tabs>
  )
};

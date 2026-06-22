import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../primitives/button";
import { EmptyState } from "./empty-state";

const meta = {
  title: "Patterns/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Nenhuma trilha publicada ainda"
  },
  render: () => (
    <div className="w-full max-w-2xl">
      <EmptyState
        action={<Button>Criar primeira trilha</Button>}
        description="Comece definindo a primeira jornada para centralizar conteudo, publico e objetivos."
        title="Nenhuma trilha publicada ainda"
      />
    </div>
  )
};

export const WithAction: Story = {
  args: {
    title: "Nenhum registro encontrado"
  },
  render: () => (
    <div className="w-full max-w-2xl">
      <EmptyState
        action={<Button variant="secondary">Criar primeiro item</Button>}
        description="Use este estado quando nao houver dados, mas houver uma acao clara para desbloquear o fluxo."
        title="Nenhum registro encontrado"
      />
    </div>
  )
};

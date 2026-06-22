import type { Meta, StoryObj } from "@storybook/react";

import { LoadingState } from "./loading-state";

const meta = {
  title: "Patterns/LoadingState",
  component: LoadingState,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof LoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <LoadingState
        description="Estamos consolidando metricas, membros e pendencias do workspace."
        title="Sincronizando dados"
      />
    </div>
  )
};

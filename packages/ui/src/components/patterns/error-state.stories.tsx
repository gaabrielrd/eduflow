import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../primitives/button";
import { ErrorState } from "./error-state";

const meta = {
  title: "Patterns/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <ErrorState
        action={<Button variant="secondary">Tentar novamente</Button>}
        description="Nao conseguimos recuperar as configuracoes desta organizacao agora."
        title="Falha ao carregar o workspace"
      />
    </div>
  )
};

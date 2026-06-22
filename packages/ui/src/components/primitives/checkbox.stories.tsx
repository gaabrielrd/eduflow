import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Checkbox } from "./checkbox";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"]
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <label className="flex items-center gap-3 text-sm text-foreground">
        <Checkbox
          checked={checked}
          onCheckedChange={(nextChecked) => setChecked(nextChecked === true)}
        />
        Receber atualizacoes por email
      </label>
    );
  }
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm text-foreground">
      <label className="flex items-center gap-3">
        <Checkbox checked />
        Permissao concedida
      </label>
      <label className="flex items-center gap-3">
        <Checkbox disabled />
        Opcao indisponivel
      </label>
      <label className="flex items-center gap-3">
        <Checkbox checked disabled />
        Opcao bloqueada
      </label>
    </div>
  )
};

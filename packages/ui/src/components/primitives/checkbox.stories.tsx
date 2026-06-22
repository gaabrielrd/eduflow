import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { Checkbox } from "./checkbox";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Checkbox neutro com foco visivel. Deve ser associado a um label visivel e, quando necessario, a texto auxiliar. Teclado: Space alterna o estado quando o controle esta focado."
      }
    }
  }
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

export const WithHintAndError: Story = {
  render: () => (
    <fieldset className="grid max-w-md gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <legend className="text-sm font-semibold text-foreground">
        Preferencias de notificacao
      </legend>
      <label className="flex items-center gap-3 text-sm text-foreground">
        <Checkbox aria-describedby="storybook-checkbox-hint storybook-checkbox-error" />
        Receber alertas de publicacao por email
      </label>
      <p className="text-sm text-muted-foreground" id="storybook-checkbox-hint">
        Enviaremos atualizacoes quando uma nova versao do curso estiver pronta.
      </p>
      <p className="text-sm font-medium text-destructive" id="storybook-checkbox-error">
        Escolha pelo menos um canal de notificacao.
      </p>
    </fieldset>
  )
};

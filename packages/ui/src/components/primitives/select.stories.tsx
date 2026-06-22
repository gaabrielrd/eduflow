import type { Meta, StoryObj } from "@storybook/react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from "./select";

const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Select composto sobre Radix. Deve ser renderizado com label visivel no consumidor. Teclado: Tab leva ao trigger, Enter ou Space abre a lista, setas navegam entre opcoes e Escape fecha o menu."
      }
    }
  }
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-72 gap-2">
      <label className="text-sm font-semibold text-foreground" htmlFor="storybook-role-select">
        Perfil de acesso
      </label>
      <Select defaultValue="admin">
        <SelectTrigger id="storybook-role-select">
          <SelectValue placeholder="Selecione um perfil" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Permissoes</SelectLabel>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Somente leitura</SelectLabel>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Use setas para navegar e Enter para confirmar a opcao destacada.
      </p>
    </div>
  )
};

export const Disabled: Story = {
  render: () => (
    <div className="grid w-72 gap-2">
      <label className="text-sm font-semibold text-foreground" htmlFor="storybook-disabled-role-select">
        Organizacao ativa
      </label>
      <Select defaultValue="viewer" disabled>
        <SelectTrigger id="storybook-disabled-role-select">
          <SelectValue placeholder="Selecione uma organizacao" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="viewer">Workspace principal</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Exemplo de bloqueio temporario enquanto o contexto do usuario e recarregado.
      </p>
    </div>
  )
};

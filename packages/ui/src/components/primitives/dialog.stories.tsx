import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./dialog";

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Dialog modal com foco gerenciado pelo Radix. Teclado: Enter ou Space no trigger abre, Tab percorre o conteudo, Shift+Tab retorna, e Escape fecha devolvendo o foco ao trigger."
      }
    }
  }
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publicar alteracoes</DialogTitle>
          <DialogDescription>
            Revise os ajustes finais antes de disponibilizar esta versao para a equipe.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary">Cancelar</Button>
          <Button>Publicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export const Open: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessao expirada</DialogTitle>
          <DialogDescription>
            Sua autenticacao precisa ser renovada para continuar a edicao deste espaco.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary">Agora nao</Button>
          <Button>Entrar novamente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

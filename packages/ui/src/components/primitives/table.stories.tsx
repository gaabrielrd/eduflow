import type { Meta, StoryObj } from "@storybook/react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "./table";

const meta = {
  title: "Primitives/Table",
  component: Table,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Table className="min-w-[640px]">
      <TableCaption>Resumo das trilhas com maior atividade nesta semana.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Trilha</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Autores</TableHead>
          <TableHead className="text-right">Alunos</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium text-slate-950">Onboarding</TableCell>
          <TableCell>Ativa</TableCell>
          <TableCell>4</TableCell>
          <TableCell className="text-right">182</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-slate-950">Academia de vendas</TableCell>
          <TableCell>Em revisao</TableCell>
          <TableCell>2</TableCell>
          <TableCell className="text-right">96</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-slate-950">Boas praticas LGPD</TableCell>
          <TableCell>Rascunho</TableCell>
          <TableCell>1</TableCell>
          <TableCell className="text-right">41</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total de alunos ativos</TableCell>
          <TableCell />
          <TableCell />
          <TableCell className="text-right">319</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
};

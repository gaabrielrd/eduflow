import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";
import { PageHeader } from "./page-header";

const meta = {
  title: "Patterns/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Workspace de aprendizado corporativo"
  },
  render: () => (
    <PageHeader
      actions={
        <>
          <Button variant="secondary">Salvar rascunho</Button>
          <Button>Publicar</Button>
        </>
      }
      description="Gerencie o posicionamento da jornada, acompanhe pendencias editoriais e oriente as proximas entregas."
      eyebrow={<Badge variant="outline">Design system</Badge>}
      title="Workspace de aprendizado corporativo"
    />
  )
};

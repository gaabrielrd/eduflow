import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "./card";

const meta = {
  title: "Primitives/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <Badge variant="secondary">Workspace</Badge>
        <CardTitle>Equipe de produto</CardTitle>
        <CardDescription>
          Acompanhe o status das entregas e mantenha o contexto centralizado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>12 pessoas ativas</p>
        <p>3 fluxos aguardando revisao</p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Abrir</Button>
        <Button size="sm" variant="secondary">
          Compartilhar
        </Button>
      </CardFooter>
    </Card>
  )
};

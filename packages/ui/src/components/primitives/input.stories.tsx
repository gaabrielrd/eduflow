import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./input";

const meta = {
  title: "Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    placeholder: "nome@empresa.com"
  }
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Types: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-4">
      <Input placeholder="nome@empresa.com" type="email" />
      <Input placeholder="https://eduflow.app" type="url" />
      <Input placeholder="Buscar cursos" type="search" />
    </div>
  )
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "owner@eduflow.app"
  }
};

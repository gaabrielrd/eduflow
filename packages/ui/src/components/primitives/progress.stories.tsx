import type { Meta, StoryObj } from "@storybook/react";

import { Progress } from "./progress";

const meta = {
  title: "Primitives/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: {
    value: 64
  }
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Stages: Story = {
  render: () => (
    <div className="grid w-full min-w-80 gap-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Rascunho</p>
        <Progress value={18} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Revisao</p>
        <Progress value={52} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Publicado</p>
        <Progress value={100} />
      </div>
    </div>
  )
};

import type { Meta, StoryObj } from "@storybook/react";

import { Card, CardContent, CardHeader } from "./card";
import { Skeleton } from "./skeleton";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded"
  }
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primitive: Story = {
  render: () => (
    <div className="grid w-full max-w-xl gap-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
};

export const HeaderComposition: Story = {
  render: () => (
    <div className="grid w-full max-w-3xl gap-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="h-5 w-[32rem] max-w-full" />
    </div>
  )
};

export const CardListComposition: Story = {
  render: () => (
    <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
};

export const TableComposition: Story = {
  render: () => (
    <div className="grid w-full min-w-[640px] gap-3 rounded-xl border border-border bg-card p-5 shadow-md">
      <div className="grid grid-cols-4 gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="grid grid-cols-4 gap-3 border-t border-border/70 pt-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
};

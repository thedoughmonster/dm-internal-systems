import type { Meta, StoryObj } from "@storybook/nextjs"

import { Badge } from "./badge"

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    id: "sb-badge-default",
    children: "Healthy",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Badge is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Badge in product routes. Confirm semantic meaning, text clarity, and readable contrast across variants before shipping changes.",
      },
    },
  },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="grid gap-2">
      <div className="text-xs text-muted-foreground">Status variants</div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge id="sb-badge-variants-default">Healthy</Badge>
        <Badge id="sb-badge-variants-secondary" variant="secondary">
          Queued
        </Badge>
        <Badge id="sb-badge-variants-destructive" variant="destructive">
          Failed
        </Badge>
        <Badge id="sb-badge-variants-outline" variant="outline">
          Neutral
        </Badge>
      </div>
    </div>
  ),
}

export const Default: Story = {}

export const Secondary: Story = {
  args: {
    id: "sb-badge-secondary",
    variant: "secondary",
    children: "Queued",
  },
}

export const Destructive: Story = {
  args: {
    id: "sb-badge-destructive",
    variant: "destructive",
    children: "Failed",
  },
}

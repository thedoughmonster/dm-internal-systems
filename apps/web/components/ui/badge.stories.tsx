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
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

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

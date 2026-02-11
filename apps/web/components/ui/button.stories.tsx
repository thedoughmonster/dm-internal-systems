import type { Meta, StoryObj } from "@storybook/nextjs"

import { Button } from "./button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    id: "sb-button-primary",
    children: "Run task",
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Secondary: Story = {
  args: {
    id: "sb-button-secondary",
    variant: "secondary",
    children: "Secondary action",
  },
}

export const Destructive: Story = {
  args: {
    id: "sb-button-destructive",
    variant: "destructive",
    children: "Delete item",
  },
}

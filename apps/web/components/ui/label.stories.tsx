import type { Meta, StoryObj } from "@storybook/nextjs"

import { Label } from "./label"

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    id: "sb-label-default",
    children: "Environment",
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-md space-y-2">
      <Label {...args} htmlFor="sb-label-input" />
      <input
        id="sb-label-input"
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Production"
      />
    </div>
  ),
}

export const DisabledPeer: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <Label id="sb-label-disabled" htmlFor="sb-label-disabled-input">
        Disabled field
      </Label>
      <input
        id="sb-label-disabled-input"
        className="peer h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        disabled
        placeholder="Read only"
      />
    </div>
  ),
}

import type { Meta, StoryObj } from "@storybook/nextjs"

import { Input } from "./input"
import { Label } from "./label"

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    id: "sb-input-default",
    type: "text",
    placeholder: "server.example.internal",
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ValidationExample: Story = {
  render: (args) => (
    <div className="w-full max-w-md space-y-2">
      <Label id="sb-input-label" htmlFor={args.id}>
        Hostname
      </Label>
      <Input
        {...args}
        id="sb-input-invalid"
        aria-invalid="true"
        className="border-destructive focus-visible:ring-destructive"
      />
      <p className="text-sm text-destructive">Hostname is required.</p>
    </div>
  ),
}

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
  parameters: {
    docs: {
      description: {
        component:
          "Input is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Input in product routes. Validate focus visibility, keyboard behavior, and assistive text in the scenarios below before shipping changes.",
      },
    },
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="grid w-full max-w-md gap-3">
      <Input {...args} id="sb-input-variants-default" />
      <Input
        {...args}
        id="sb-input-variants-invalid"
        aria-invalid="true"
        className="border-destructive focus-visible:ring-destructive"
        defaultValue="bad host"
      />
    </div>
  ),
}

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

export const VisibleBaseline: Story = {
  args: {
    id: "sb-input-visible-baseline",
    type: "text",
    placeholder: "server.example.internal",
  },
}

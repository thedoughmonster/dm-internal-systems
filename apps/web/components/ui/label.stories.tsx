import type { Meta, StoryObj } from "@storybook/nextjs"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground } from "@/lib/storybook/module-playground"
import { Label } from "./label"
import * as ComponentModule from "./label"

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  args: {
    id: "sb-label-default",
    children: "Environment",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Label is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Label in product routes. Confirm semantic labeling, `htmlFor` pairing, and readable text contrast in the scenarios below before shipping changes.",
      },
      page: () => <ModuleDocsPage moduleName="Label" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="Label" moduleExports={ComponentModule} />,
}

export const VisibleBaseline: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      <Label id="sb-label-overview-label" htmlFor="sb-label-overview-input">
        Environment
      </Label>
      <input
        id="sb-label-overview-input"
        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Production"
      />
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-3">
      <div className="space-y-2">
        <Label id="sb-label-variants-default" htmlFor="sb-label-variants-default-input">
          Environment
        </Label>
        <input
          id="sb-label-variants-default-input"
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Production"
        />
      </div>
      <div className="space-y-2">
        <Label id="sb-label-variants-disabled" htmlFor="sb-label-variants-disabled-input">
          Disabled field
        </Label>
        <input
          id="sb-label-variants-disabled-input"
          className="peer h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          disabled
          placeholder="Read only"
        />
      </div>
    </div>
  ),
}

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

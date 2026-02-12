import type { Meta, StoryObj } from "@storybook/nextjs"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground } from "@/lib/storybook/module-playground"
import { Button } from "./button"
import * as ComponentModule from "./button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    id: "sb-button-primary",
    children: "Run task",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Button is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Button in product routes. Validate focus visibility, keyboard behavior, and assistive text in the scenarios below before shipping changes.",
      },
      page: () => <ModuleDocsPage moduleName="Button" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="Button" moduleExports={ComponentModule} />,
}

export const Variants: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="text-xs text-muted-foreground">Visual variants</div>
        <div className="flex flex-wrap gap-2">
          <Button id="sb-button-variants-primary">Run task</Button>
          <Button id="sb-button-variants-secondary" variant="secondary">
            Secondary
          </Button>
          <Button id="sb-button-variants-outline" variant="outline">
            Outline
          </Button>
          <Button id="sb-button-variants-ghost" variant="ghost">
            Ghost
          </Button>
          <Button id="sb-button-variants-destructive" variant="destructive">
            Delete
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="text-xs text-muted-foreground">Size variants</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button id="sb-button-variants-size-sm" size="sm">
            Small
          </Button>
          <Button id="sb-button-variants-size-default">Default</Button>
          <Button id="sb-button-variants-size-lg" size="lg">
            Large
          </Button>
        </div>
      </div>
    </div>
  ),
}

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

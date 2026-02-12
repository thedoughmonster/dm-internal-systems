import type { Meta, StoryObj } from "@storybook/nextjs"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground, ModuleVisibleBaseline } from "@/lib/storybook/module-playground"
import * as ComponentModule from "./checkbox"

const meta = {
  title: "UI/Checkbox",
  tags: ["autodocs"],
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          "Checkbox is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Checkbox in product routes. Validate focus visibility, keyboard behavior, and assistive text in the scenarios below before shipping changes.",
      },
      page: () => <ModuleDocsPage moduleName="Checkbox" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="Checkbox" moduleExports={ComponentModule} />,
  parameters: {
    docs: {
      description: {
        story:
          "Default usage reference for Checkbox. Start here to verify baseline rendering and expected structure.",
      },
    },
  },
}


export const VisibleBaseline: Story = {
  render: () => <ModuleVisibleBaseline moduleName="Checkbox" moduleExports={ComponentModule} />,
  parameters: {
    docs: {
      description: {
        story: "Concrete baseline render for quick visual verification of the primary export.",
      },
    },
  },
}

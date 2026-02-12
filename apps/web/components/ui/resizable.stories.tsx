import type { Meta, StoryObj } from "@storybook/nextjs"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground, ModuleVisibleBaseline } from "@/lib/storybook/module-playground"
import * as ComponentModule from "./resizable"

const meta = {
  title: "UI/Resizable",
  tags: ["autodocs"],
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          "Resizable is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Resizable in product routes. Validate focus visibility, keyboard behavior, and assistive text in the scenarios below before shipping changes.",
      },
      page: () => <ModuleDocsPage moduleName="Resizable" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="Resizable" moduleExports={ComponentModule} />,
  parameters: {
    docs: {
      description: {
        story:
          "Default usage reference for Resizable. Start here to verify baseline rendering and expected structure.",
      },
    },
  },
}


export const VisibleBaseline: Story = {
  render: () => <ModuleVisibleBaseline moduleName="Resizable" moduleExports={ComponentModule} />,
  parameters: {
    docs: {
      description: {
        story: "Concrete baseline render for quick visual verification of the primary export.",
      },
    },
  },
}

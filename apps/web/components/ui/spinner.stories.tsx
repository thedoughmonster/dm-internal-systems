import type { Meta, StoryObj } from "@storybook/nextjs"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground, ModuleVisibleBaseline } from "@/lib/storybook/module-playground"
import * as ComponentModule from "./spinner"

const meta = {
  title: "UI/Spinner",
  tags: ["autodocs"],
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          "Spinner is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing Spinner in product routes. Confirm semantic markup and readable text contrast in the scenarios below before shipping changes.",
      },
      page: () => <ModuleDocsPage moduleName="Spinner" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="Spinner" moduleExports={ComponentModule} />,
  parameters: {
    docs: {
      description: {
        story:
          "Default usage reference for Spinner. Start here to verify baseline rendering and expected structure.",
      },
    },
  },
}


export const VisibleBaseline: Story = {
  render: () => <ModuleVisibleBaseline moduleName="Spinner" moduleExports={ComponentModule} />,
  parameters: {
    docs: {
      description: {
        story: "Concrete baseline render for quick visual verification of the primary export.",
      },
    },
  },
}

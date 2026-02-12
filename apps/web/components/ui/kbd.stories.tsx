import type { Meta, StoryObj } from "@storybook/nextjs"

import { ModuleDocsPage } from "@/lib/storybook/module-docs-page"
import { ModulePlayground } from "@/lib/storybook/module-playground"
import * as ComponentModule from "./kbd"

const meta = {
  title: "UI/KBD",
  tags: ["autodocs"],
  parameters: {
    controls: {
      disable: true,
    },
    docs: {
      description: {
        component:
          "KBD is a DM UI primitive for consistent interface composition. Use this Storybook module as the reference when implementing KBD in product routes. Confirm semantic markup and readable text contrast in the scenarios below before shipping changes.",
      },
      page: () => <ModuleDocsPage moduleName="KBD" moduleExports={ComponentModule} />,
    },
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {
  render: () => <ModulePlayground moduleName="KBD" moduleExports={ComponentModule} />,
  parameters: {
    docs: {
      description: {
        story:
          "Default usage reference for KBD. Start here to verify baseline rendering and expected structure.",
      },
    },
  },
}


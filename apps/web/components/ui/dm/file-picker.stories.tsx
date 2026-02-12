import type { Meta, StoryObj } from "@storybook/nextjs"

import { DmFilePicker } from "./file-picker"

const meta = {
  title: "UI/DM/File Picker",
  component: DmFilePicker,
  tags: ["autodocs"],
  args: {
    id: "sb-dm-file-picker",
    onPickText: async () => {},
  },
  parameters: {
    docs: {
      description: {
        component:
          "DmFilePicker reads a single selected file and returns normalized metadata plus text content through onPickText. Use it when an ingest flow needs client-side file parsing before upload. The picker supports keyboard activation through native button semantics and exposes status with readable text and badge metadata.",
      },
    },
  },
} satisfies Meta<typeof DmFilePicker>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const Disabled: Story = {
  args: {
    id: "sb-dm-file-picker-disabled",
    disabled: true,
    helpText: "Picker disabled until a vendor source is selected.",
  },
}

export const VisibleBaseline: Story = {
  args: {
    id: "sb-dm-file-picker-visible-baseline",
    onPickText: async () => {},
  },
}

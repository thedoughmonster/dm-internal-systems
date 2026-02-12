import type { Meta, StoryObj } from "@storybook/nextjs"

import { DmMultiFilePicker } from "./multi-file-picker"

const meta = {
  title: "UI/DM/Multi File Picker",
  component: DmMultiFilePicker,
  tags: ["autodocs"],
  args: {
    id: "sb-dm-multi-file-picker",
    onPickText: async () => {},
  },
  parameters: {
    docs: {
      description: {
        component:
          "DmMultiFilePicker reads multiple selected files and returns an ordered list of normalized file payloads through onPickText. Use it for batch ingest workflows where operators stage several vendor exports at once. The control keeps keyboard-accessible button actions and exposes clear status states for ready, reading, and error scenarios.",
      },
    },
  },
} satisfies Meta<typeof DmMultiFilePicker>

export default meta

type Story = StoryObj<typeof meta>

export const Overview: Story = {}

export const Disabled: Story = {
  args: {
    id: "sb-dm-multi-file-picker-disabled",
    disabled: true,
    helpText: "Picker disabled until intake mode is set to batch import.",
  },
}

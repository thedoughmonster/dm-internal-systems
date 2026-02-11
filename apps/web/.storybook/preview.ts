import type { Preview } from "@storybook/nextjs"
import { createElement } from "react"
import type { ReactNode } from "react"

import "../app/globals.css"

function ConsistencyFrame({ children }: { children: ReactNode }) {
  return createElement(
    "div",
    {
      className: "min-h-screen bg-background px-6 py-6 text-foreground antialiased",
    },
    createElement(
      "div",
      { className: "mx-auto w-full max-w-6xl" },
      createElement(
        "div",
        { className: "rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm" },
        children
      )
    )
  )
}

const preview: Preview = {
  decorators: [
    (Story) => createElement(ConsistencyFrame, null, createElement(Story)),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "fullscreen",
    backgrounds: {
      default: "app-surface",
      values: [
        {
          name: "app-surface",
          value: "hsl(var(--background))",
        },
      ],
    },
    a11y: {
      test: "todo",
    },
  },
}

export default preview

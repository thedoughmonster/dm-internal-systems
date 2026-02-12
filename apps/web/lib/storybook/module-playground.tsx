import type { ComponentType, ReactNode } from "react"
import { Component } from "react"

type ModuleExports = Record<string, unknown>
type AnyComponent = ComponentType<Record<string, unknown>>

type StoryErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
}

type StoryErrorBoundaryState = {
  hasError: boolean
}

class StoryErrorBoundary extends Component<StoryErrorBoundaryProps, StoryErrorBoundaryState> {
  override state: StoryErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): StoryErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(): void {
    // Storybook surface only: we intentionally render a visible fallback for modules
    // that require richer composition than this auto-playground can infer.
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

function toComponent(value: unknown): AnyComponent | null {
  if (typeof value !== "function") {
    return null
  }
  return value as AnyComponent
}

function isRenderableExport([name, value]: [string, unknown]): boolean {
  if (!/^[A-Z]/.test(name)) {
    return false
  }
  if (name.endsWith("Props")) {
    return false
  }
  return typeof value === "function"
}

function sampleProps(exportName: string): Record<string, unknown> {
  const lower = exportName.toLowerCase()

  if (lower.includes("label")) {
    return { htmlFor: "sb-input" }
  }
  if (lower.includes("input") && !lower.includes("otp")) {
    return { id: "sb-input", placeholder: "Type here" }
  }
  if (lower.includes("textarea")) {
    return { id: "sb-textarea", placeholder: "Add details" }
  }
  if (lower.includes("checkbox") || lower.includes("switch")) {
    return { defaultChecked: true }
  }
  if (lower.includes("accordion") && lower.endsWith("item")) {
    return { value: "item-1" }
  }
  if (lower.includes("accordion") && lower === "accordion") {
    return { type: "single", collapsible: true }
  }
  if (lower.includes("tabs") && lower.endsWith("trigger")) {
    return { value: "tab-1" }
  }
  if (lower.includes("tabs") && lower.endsWith("content")) {
    return { value: "tab-1" }
  }
  if (lower === "tabs") {
    return { defaultValue: "tab-1" }
  }
  if (lower.includes("select") && lower.endsWith("item")) {
    return { value: "item-1" }
  }
  if (lower.includes("radio") && lower.endsWith("item")) {
    return { value: "item-1", id: "radio-item-1" }
  }
  if (lower.includes("toggle") && lower.endsWith("item")) {
    return { value: "item-1" }
  }
  if (lower.includes("dialog") || lower.includes("popover") || lower.includes("hovercard") || lower.includes("dropdown") || lower.includes("menubar") || lower.includes("contextmenu") || lower.includes("navigationmenu") || lower.includes("sheet") || lower.includes("drawer")) {
    return { open: true }
  }
  if (lower.includes("alert") && lower.includes("dialog")) {
    return { open: true }
  }
  if (lower.includes("progress")) {
    return { value: 60 }
  }
  if (lower.includes("slider")) {
    return { defaultValue: [40], max: 100, step: 1 }
  }
  if (lower.includes("separator")) {
    return { orientation: "horizontal" }
  }
  if (lower.includes("badge") || lower.includes("button")) {
    return { type: "button" }
  }
  if (lower.includes("avatarimage")) {
    return {
      src: "https://avatars.githubusercontent.com/u/1?v=4",
      alt: "Avatar",
    }
  }
  if (lower.includes("avatarfallback")) {
    return { delayMs: 0 }
  }
  if (lower.includes("chart")) {
    return { className: "h-48" }
  }

  return {}
}

function sampleChildren(exportName: string): ReactNode {
  const lower = exportName.toLowerCase()

  if (lower.includes("trigger")) {
    return "Open"
  }
  if (lower.includes("title")) {
    return "Title"
  }
  if (lower.includes("description")) {
    return "Description"
  }
  if (lower.includes("header")) {
    return "Header"
  }
  if (lower.includes("footer")) {
    return "Footer"
  }
  if (lower.includes("label")) {
    return "Label"
  }
  if (lower.includes("content")) {
    return "Content"
  }
  if (lower.includes("item")) {
    return "Item"
  }
  if (lower.includes("value")) {
    return "Value"
  }
  if (lower.includes("badge")) {
    return "Badge"
  }
  if (lower.includes("button")) {
    return "Button"
  }
  if (lower.includes("kbd")) {
    return "⌘K"
  }
  if (lower.includes("card")) {
    return "Card"
  }
  if (lower.includes("alert")) {
    return "Alert"
  }
  if (lower.includes("toast") || lower.includes("sonner")) {
    return "Toast"
  }

  return "Preview"
}

type ModulePlaygroundProps = {
  moduleName: string
  moduleExports: ModuleExports
}

export function ModuleVisibleBaseline({ moduleName, moduleExports }: ModulePlaygroundProps) {
  const entries = Object.entries(moduleExports).filter(isRenderableExport)
  const primary = entries[0]

  return (
    <div className="rounded-md border border-border/60 bg-background p-3">
      {primary ? (
        <StoryErrorBoundary
          fallback={
            <p className="text-xs text-muted-foreground">
              Needs composed usage. Add a dedicated scenario for <code>{primary[0]}</code>.
            </p>
          }
        >
          <div className="flex min-h-12 items-center gap-2 overflow-auto">
            {(() => {
              const ExportComponent = toComponent(primary[1])
              if (!ExportComponent) {
                return null
              }
              return (
                <ExportComponent {...sampleProps(primary[0])}>{sampleChildren(primary[0])}</ExportComponent>
              )
            })()}
          </div>
        </StoryErrorBoundary>
      ) : (
        <p className="text-xs text-muted-foreground">
          No renderable component exports detected for <code>{moduleName}</code>.
        </p>
      )}
    </div>
  )
}

export function ModulePlayground({ moduleName, moduleExports }: ModulePlaygroundProps) {
  const entries = Object.entries(moduleExports).filter(isRenderableExport)
  const primary = entries[0]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Auto-preview for <code>{moduleName}</code>. Replace with scenario stories as this component is adopted.
      </p>

      <div className="rounded-md border border-border/60 bg-background p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Primary preview
        </p>
        {primary ? (
          <StoryErrorBoundary
            fallback={
              <p className="text-xs text-muted-foreground">
                Needs composed usage. Add a dedicated scenario for <code>{primary[0]}</code>.
              </p>
            }
          >
            <div className="flex min-h-12 items-center gap-2 overflow-auto">
              {(() => {
                const ExportComponent = toComponent(primary[1])
                if (!ExportComponent) {
                  return null
                }
                return (
                  <ExportComponent {...sampleProps(primary[0])}>
                    {sampleChildren(primary[0])}
                  </ExportComponent>
                )
              })()}
            </div>
          </StoryErrorBoundary>
        ) : (
          <p className="text-xs text-muted-foreground">No renderable component exports detected.</p>
        )}
      </div>

      <div className="rounded-md border border-border/60 bg-background p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Exports</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[300px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2">Kind</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([name]) => (
                <tr key={name} className="border-b border-border/40 align-top">
                  <td className="py-2 pr-4 font-mono text-xs">{name}</td>
                  <td className="py-2 text-xs text-muted-foreground">component</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

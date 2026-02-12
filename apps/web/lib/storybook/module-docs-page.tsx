import type { ReactNode } from "react"

type ModuleExports = Record<string, unknown>

type ModuleDocsPageProps = {
  moduleName: string
  moduleExports: ModuleExports
}

function renderType(value: unknown): ReactNode {
  if (typeof value === "function") {
    return "function"
  }
  if (Array.isArray(value)) {
    return "array"
  }
  if (value === null) {
    return "null"
  }
  return typeof value
}

export function ModuleDocsPage({ moduleName, moduleExports }: ModuleDocsPageProps) {
  const names = Object.keys(moduleExports).sort((a, b) => a.localeCompare(b))

  return (
    <div className="bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <section className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{moduleName}</h1>
          <p className="text-sm text-muted-foreground">
            Storybook reference page for this module. Add and maintain dedicated stories for concrete
            states, interactions, and edge cases as product usage evolves.
          </p>
        </section>

        <section className="rounded-md border border-border/60 bg-card/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Exports</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[360px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody>
                {names.map((name) => (
                  <tr key={name} className="border-b border-border/40 align-top">
                    <td className="py-2 pr-4 font-mono text-xs">{name}</td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {renderType(moduleExports[name])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-md border border-border/60 bg-background p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Next Steps
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Create one story per user-facing state.</li>
            <li>Add interaction examples for interactive components.</li>
            <li>Document accessibility and keyboard behavior where relevant.</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

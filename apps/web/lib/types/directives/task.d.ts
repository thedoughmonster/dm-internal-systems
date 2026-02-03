export type DirectivePriority = "low" | "medium" | "high"
export type DirectiveEffort = "small" | "medium" | "large"

export type DirectiveMeta = {
  id: string
  title: string
  directive: string
  status: string
  owner: string
  assignee: string | null
  priority: DirectivePriority
  session_priority?: DirectivePriority
  auto_run?: boolean
  tags: string[]
  created: string
  updated: string
  bucket: string
  scope: string
  summary: string
  result?: string
  source: string
  effort: DirectiveEffort
  depends_on: string[]
  blocked_by: string[]
  related: string[]
}

export type DirectiveFile = {
  sessionId: string
  filename: string
  kind: "parent" | "task" | "unknown"
  meta: DirectiveMeta
  body: string
}

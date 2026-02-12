import Link from "next/link"

import { listDirectiveFiles } from "../lib/directives-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { DirectiveFile } from "@/lib/types/directives/task"
import DirectivesFiltersPanel from "./DirectivesFiltersPanel"
import type { TagOption } from "./TagsMultiSelect"
import SessionCard from "./SessionCard"
import SessionAutoRunToggle from "./SessionAutoRunToggle"

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  open: "bg-primary/20 text-primary",
  archived: "bg-muted text-muted-foreground",
}

const STATUS_OPTIONS = [
  { label: "Todo", value: "todo" },
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
  { label: "Archived", value: "archived" },
] as const

type DirectivesViewProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

function normalizeParam(value: string | string[] | undefined) {
  if (!value) {
    return ""
  }
  const resolved = Array.isArray(value) ? value[0] ?? "" : value
  return resolved === "__any__" ? "" : resolved
}

function normalizeArrayParam(value: string | string[] | undefined) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function parseUpdatedTimestamp(value: string | undefined) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatShortDate(value: string | undefined) {
  if (!value) return "unknown"
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value
  return new Date(parsed).toISOString().slice(0, 10)
}

function toStatusLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function filterEntries(entries: DirectiveFile[], params: DirectivesViewProps["searchParams"]) {
  const query = normalizeParam(params?.query).toLowerCase()
  const statuses = normalizeArrayParam(params?.status).map((status) =>
    status.toLowerCase()
  )
  const tags = normalizeArrayParam(params?.tags).map((tag) => tag.toLowerCase())
  const showArchived = normalizeParam(params?.show_archived) === "1"

  return entries.filter((entry) => {
    const haystack = [
      entry.meta.title,
      entry.meta.summary,
      entry.meta.directive,
      entry.meta.status,
      entry.meta.owner,
      entry.meta.assignee ?? "",
      entry.filename,
    ]
      .join(" ")
      .toLowerCase()

    if (query && !haystack.includes(query)) {
      return false
    }

    const entryStatus = entry.meta.status.toLowerCase()
    if (!showArchived && entryStatus === "archived") {
      return false
    }

    if (statuses.length > 0) {
      if (!statuses.includes(entryStatus)) {
        return false
      }
    }

    if (tags.length > 0) {
      const entryTags = (entry.meta.tags ?? []).map((tag) => tag.toLowerCase())
      if (!tags.some((tag) => entryTags.includes(tag))) {
        return false
      }
    }

    return true
  })
}

function tagOptions(entries: DirectiveFile[]): TagOption[] {
  const tags = new Set<string>()
  entries.forEach((entry) => {
    ;(entry.meta.tags ?? []).forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).map((tag) => ({ value: tag, label: tag }))
}

export default async function DirectivesView({ searchParams }: DirectivesViewProps) {
  const entries = await listDirectiveFiles()
  const statusOptionsMap = new Map<string, string>(
    STATUS_OPTIONS.map((option) => [option.value, option.label])
  )

  for (const entry of entries) {
    const status = (entry.meta.status ?? "").toLowerCase()
    if (!status || statusOptionsMap.has(status)) {
      continue
    }
    statusOptionsMap.set(status, toStatusLabel(status))
  }

  const statusOptions = Array.from(statusOptionsMap.entries()).map(
    ([value, label]) => ({ value, label })
  )
  const filtered = filterEntries(entries, searchParams)
  const queryValue = normalizeParam(searchParams?.query)
  const statusValues = normalizeArrayParam(searchParams?.status)
  const tagsValue = normalizeArrayParam(searchParams?.tags)
  const tagList = tagOptions(entries)
  const parentTitles = new Map(
    entries
      .filter((entry) => entry.kind === "parent")
      .map((entry) => [entry.sessionId, entry.meta.title])
  )
  const grouped = filtered.reduce((acc, entry) => {
    const existing = acc.get(entry.sessionId)
    if (existing) {
      existing.push(entry)
    } else {
      acc.set(entry.sessionId, [entry])
    }
    return acc
  }, new Map<string, DirectiveFile[]>())
  const orderedGroups = Array.from(grouped.entries()).sort((a, b) => {
    const aParent = a[1].find((entry) => entry.kind === "parent")
    const bParent = b[1].find((entry) => entry.kind === "parent")
    const aUpdated = parseUpdatedTimestamp(aParent?.meta.updated)
    const bUpdated = parseUpdatedTimestamp(bParent?.meta.updated)
    return bUpdated - aUpdated
  })

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Directives</h1>
            <p className="text-sm text-muted-foreground">
              Local only directive tasks and session intake for agent workflows.
            </p>
          </div>
          <Link
            href="/settings"
            className="text-xs text-muted-foreground underline underline-offset-4"
          >
            Settings
          </Link>
        </div>
      </section>

      <Card
        id="directives-list"
        headerTitle="Directive files"
        headerBadges={[
          <Badge key="directives-list-count" id="directives-list-count" variant="outline">
            {filtered.length} files
          </Badge>,
        ]}
      >
        <CardContent id="directives-list-content" className="space-y-6">
          <DirectivesFiltersPanel
            queryValue={queryValue}
            statusValues={statusValues}
            statusOptions={statusOptions}
            tagValues={tagsValue}
            tagOptions={tagList}
          />
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No directives found.</p>
          ) : (
            orderedGroups.map(([sessionId, sessionEntries]) => {
              const title = parentTitles.get(sessionId) ?? "Untitled session"
              const parentEntry = sessionEntries.find((entry) => entry.kind === "parent")
              const sessionDirective = parentEntry?.meta.directive ?? "unknown"
              const sessionStatus = parentEntry?.meta.status ?? "unknown"
              const sessionUpdated = parentEntry?.meta.updated ?? "unknown"
              const taskEntries = sessionEntries
                .filter((entry) => entry.kind !== "parent")
                .sort(
                  (a, b) =>
                    parseUpdatedTimestamp(b.meta.updated) -
                    parseUpdatedTimestamp(a.meta.updated)
                )

              const sessionBadges = [
                <Badge
                  key={`${sessionId}-status`}
                  id={`directives-session-${sessionId}-status`}
                  className={STATUS_COLOR[sessionStatus] ?? ""}
                >
                  {sessionStatus}
                </Badge>,
                <Badge
                  id={`directives-session-${sessionId}-tasks`}
                  key={`${sessionId}-tasks`}
                  variant="outline"
                >
                  {taskEntries.length} tasks
                </Badge>,
              ]

              if (parentEntry) {
                sessionBadges.push(
                  <SessionAutoRunToggle
                    key={`${sessionId}-auto-run`}
                    sessionId={parentEntry.sessionId}
                    filename={parentEntry.filename}
                    autoRun={Boolean(parentEntry.meta.auto_run)}
                  />
                )
              }

              return (
                <SessionCard
                  key={sessionId}
                  id={`directives-session-${sessionId}`}
                  title={title}
                  badges={sessionBadges}
                  meta={[
                    <span key={`${sessionId}-meta-updated`}>
                      Updated: {formatShortDate(sessionUpdated)}
                    </span>,
                  ]}
                >
                  {parentEntry ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">Session: {sessionId}</span>
                          <span className="font-mono">Directive: {sessionDirective}</span>
                        </div>
                        <Button
                          id={`directives-session-${sessionId}-markdown`}
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/directives/session/${sessionId}`}>View markdown</Link>
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {taskEntries.map((entry) => (
                    <Card
                      key={`${entry.sessionId}-${entry.filename}`}
                      id={`directives-entry-${entry.sessionId}-${entry.filename}`}
                      headerTitle={entry.meta.title}
                      headerBadges={[
                        <Badge
                          key={`${entry.sessionId}-${entry.filename}-status`}
                          id={`directives-status-${entry.sessionId}-${entry.filename}`}
                          className={STATUS_COLOR[entry.meta.status] ?? ""}
                        >
                          {entry.meta.status}
                        </Badge>,
                      ]}
                      footerActions={[
                        <Button
                          key={`${entry.sessionId}-${entry.filename}-markdown`}
                          id={`directives-task-${entry.sessionId}-${entry.filename}-markdown`}
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link
                            href={`/directives/session/${entry.sessionId}#session-markdown-${entry.sessionId}-${entry.filename}`}
                          >
                            View markdown
                          </Link>
                        </Button>,
                      ]}
                    >
                      <CardContent
                        id={`directives-entry-${entry.sessionId}-${entry.filename}-content`}
                        className="space-y-3"
                      >
                        <p className="text-sm text-muted-foreground">
                          {entry.meta.summary}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-mono">File: {entry.filename}</span>
                          <span>Updated: {formatShortDate(entry.meta.updated)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </SessionCard>
              )
            })
          )}
        </CardContent>
      </Card>
    </main>
  )
}

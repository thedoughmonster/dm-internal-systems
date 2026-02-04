import Link from "next/link"

import { archiveDirective, completeDirective, createTodo } from "../actions"
import { listDirectiveFiles } from "../lib/directives-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { DirectiveFile } from "@/lib/types/directives/task"
import DirectivesFiltersPanel from "./DirectivesFiltersPanel"
import type { TagOption } from "./TagsMultiSelect"
import type { MultiSelectOption } from "./MultiSelectDropdown"
import SessionCard from "./SessionCard"
import SessionMetaEditor from "./SessionMetaEditor"

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

function relationOptions(
  entries: DirectiveFile[],
  parentTitles: Map<string, string>
): MultiSelectOption[] {
  return entries
    .filter((entry) => Boolean(entry.meta.id))
    .map((entry) => {
      const title = entry.meta.title || entry.filename
      const label =
        entry.kind === "parent"
          ? `Session: ${title}`
          : `Task: ${parentTitles.get(entry.sessionId) ?? "Session"} / ${title}`
      return {
        value: entry.meta.id,
        label,
      }
    })
    .sort((a, b) => a.label.localeCompare(b.label))
}

export default async function DirectivesView({ searchParams }: DirectivesViewProps) {
  const entries = await listDirectiveFiles()
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
  const relationOptionList = relationOptions(entries, parentTitles)
  const grouped = filtered.reduce((acc, entry) => {
    const existing = acc.get(entry.sessionId)
    if (existing) {
      existing.push(entry)
    } else {
      acc.set(entry.sessionId, [entry])
    }
    return acc
  }, new Map<string, DirectiveFile[]>())

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
        id="directives-new-session"
        headerTitle="Create new session"
      >
        <CardContent id="directives-new-session-content">
          <p className="text-xs text-muted-foreground">
            Create a new session and then expand its meta details below.
          </p>
          <form className="mt-3 grid gap-3" action={createTodo}>
            <div className="space-y-2">
              <Label id="directives-new-session-title-label" htmlFor="directives-new-session-title">
                Title
              </Label>
              <Input
                id="directives-new-session-title"
                name="title"
                placeholder="Session title"
              />
            </div>
            <div className="space-y-2">
              <Label id="directives-new-session-summary-label" htmlFor="directives-new-session-summary">
                Summary
              </Label>
              <Textarea
                id="directives-new-session-summary"
                name="summary"
                placeholder="Brief summary"
                rows={2}
              />
            </div>
            <Button id="directives-new-session-submit" type="submit">
              Create session
            </Button>
          </form>
        </CardContent>
      </Card>

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
            statusOptions={[...STATUS_OPTIONS]}
            tagValues={tagsValue}
            tagOptions={tagList}
          />
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No directives found.</p>
          ) : (
            Array.from(grouped.entries()).map(([sessionId, sessionEntries]) => {
              const title = parentTitles.get(sessionId) ?? "Untitled session"
              const parentEntry = sessionEntries.find((entry) => entry.kind === "parent")
              const sessionDirective = parentEntry?.meta.directive ?? "unknown"
              const sessionStatus = parentEntry?.meta.status ?? "unknown"
              const sessionUpdated = parentEntry?.meta.updated ?? "unknown"
              const taskEntries = sessionEntries.filter((entry) => entry.kind !== "parent")
              const sessionMetaEntry = parentEntry
                ? {
                    sessionId: parentEntry.sessionId,
                    filename: parentEntry.filename,
                    status: parentEntry.meta.status,
                    meta: {
                      title: parentEntry.meta.title,
                      summary: parentEntry.meta.summary,
                      tags: parentEntry.meta.tags ?? [],
                      session_priority: parentEntry.meta.session_priority,
                      auto_run: parentEntry.meta.auto_run,
                      depends_on: parentEntry.meta.depends_on ?? [],
                      blocked_by: parentEntry.meta.blocked_by ?? [],
                      related: parentEntry.meta.related ?? [],
                    },
                  }
                : null
              return (
                <SessionCard
                  key={sessionId}
                  id={`directives-session-${sessionId}`}
                  title={title}
                  badges={[
                    <Badge
                      key={`${sessionId}-status`}
                      id={`directives-session-${sessionId}-status`}
                      className={STATUS_COLOR[sessionStatus] ?? ""}
                    >
                      {sessionStatus}
                    </Badge>,
                    <Badge key={`${sessionId}-kind`} id={`directives-session-${sessionId}-kind`}>
                      session
                    </Badge>,
                    <Badge
                      id={`directives-session-${sessionId}-tasks`}
                      key={`${sessionId}-tasks`}
                      variant="outline"
                    >
                      {taskEntries.length} tasks
                    </Badge>,
                    <Button
                      key={`${sessionId}-markdown`}
                      id={`directives-session-${sessionId}-markdown`}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/directives/session/${sessionId}`}>
                        View markdown
                      </Link>
                    </Button>,
                  ]}
                  meta={[
                    <span key={`${sessionId}-meta-session`}>Session: {sessionId}</span>,
                    <span key={`${sessionId}-meta-directive`}>
                      Directive: {sessionDirective}
                    </span>,
                    <span key={`${sessionId}-meta-updated`}>Updated: {sessionUpdated}</span>,
                  ]}
                >
                  {parentEntry ? (
                    <div className="space-y-2">
                      {sessionMetaEntry ? (
                        <SessionMetaEditor
                          entry={sessionMetaEntry}
                          tagOptions={tagList}
                          relationOptions={relationOptionList}
                          onArchive={
                            parentEntry.meta.status === "todo" ? (
                              <form action={archiveDirective}>
                                <input
                                  id={`directives-archive-${sessionId}-session`}
                                  type="hidden"
                                  name="sessionId"
                                  value={parentEntry.sessionId}
                                />
                                <input
                                  id={`directives-archive-${sessionId}-filename`}
                                  type="hidden"
                                  name="filename"
                                  value={parentEntry.filename}
                                />
                                <Button
                                  id={`directives-archive-${sessionId}`}
                                  type="submit"
                                  variant="secondary"
                                >
                                  Archive todo
                                </Button>
                              </form>
                            ) : null
                          }
                        />
                      ) : null}
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
                        <Badge
                          key={`${entry.sessionId}-${entry.filename}-kind`}
                          id={`directives-kind-${entry.sessionId}-${entry.filename}`}
                        >
                          {entry.kind}
                        </Badge>,
                      ]}
                      headerMeta={[
                        <span key={`${entry.sessionId}-${entry.filename}-meta-id`}>
                          Id: {entry.meta.id}
                        </span>,
                        <span key={`${entry.sessionId}-${entry.filename}-meta-file`}>
                          File: {entry.filename}
                        </span>,
                        <span key={`${entry.sessionId}-${entry.filename}-meta-updated`}>
                          Updated: {entry.meta.updated}
                        </span>,
                      ]}
                      footerActions={[
                        ...(entry.meta.status !== "archived" &&
                        entry.meta.status !== "done"
                          ? [
                              <form
                                key={`${entry.sessionId}-${entry.filename}-complete`}
                                action={completeDirective}
                              >
                                <input
                                  id={`directives-complete-${entry.sessionId}-session`}
                                  type="hidden"
                                  name="sessionId"
                                  value={entry.sessionId}
                                />
                                <input
                                  id={`directives-complete-${entry.sessionId}-filename`}
                                  type="hidden"
                                  name="filename"
                                  value={entry.filename}
                                />
                                <Button
                                  id={`directives-complete-${entry.sessionId}`}
                                  type="submit"
                                  variant="secondary"
                                >
                                  Mark as complete
                                </Button>
                              </form>,
                            ]
                          : []),
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
                          <span>Directive: {entry.meta.directive}</span>
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

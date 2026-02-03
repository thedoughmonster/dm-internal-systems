import Link from "next/link"

import { archiveDirective, createDirectiveTask, createTodo } from "../actions"
import { listDirectiveFiles } from "../lib/directives-store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { DirectiveFile } from "@/types/directives/task"
import FilterSelect, { type FilterOption } from "./FilterSelect"
import SessionSelect from "./SessionSelect"
import TagsMultiSelect, { type TagOption } from "./TagsMultiSelect"
import TaskListInput from "./TaskListInput"

const STATUS_COLOR: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  open: "bg-primary/20 text-primary",
  archived: "bg-muted text-muted-foreground",
}

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
  const status = normalizeParam(params?.status).toLowerCase()
  const directive = normalizeParam(params?.directive).toLowerCase()
  const tags = normalizeArrayParam(params?.tags).map((tag) => tag.toLowerCase())

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

    if (status) {
      if (entry.meta.status.toLowerCase() !== status) {
        return false
      }
    } else if (entry.meta.status.toLowerCase() === "archived") {
      return false
    }

    if (directive && entry.meta.directive.toLowerCase() !== directive) {
      return false
    }

    if (tags.length > 0) {
      const entryTags = entry.meta.tags.map((tag) => tag.toLowerCase())
      if (!tags.some((tag) => entryTags.includes(tag))) {
        return false
      }
    }

    return true
  })
}

function sessionOptions(entries: DirectiveFile[]) {
  return entries
    .filter(
      (entry) => entry.kind === "parent" && entry.meta.status.toLowerCase() !== "archived"
    )
    .map((entry) => ({
      sessionId: entry.sessionId,
      directive: entry.meta.directive,
      title: entry.meta.title,
      status: entry.meta.status,
    }))
}

function directiveOptions(sessions: ReturnType<typeof sessionOptions>): FilterOption[] {
  const map = new Map<string, string>()
  sessions.forEach((session) => {
    if (!map.has(session.directive)) {
      map.set(session.directive, session.title)
    }
  })
  return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
}

function tagOptions(entries: DirectiveFile[]): TagOption[] {
  const tags = new Set<string>()
  entries.forEach((entry) => {
    entry.meta.tags.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).map((tag) => ({ value: tag, label: tag }))
}

const STATUS_OPTIONS: FilterOption[] = [
  { label: "Todo", value: "todo" },
  { label: "Open", value: "open" },
  { label: "In progress", value: "in_progress" },
  { label: "Blocked", value: "blocked" },
  { label: "Done", value: "done" },
  { label: "Archived", value: "archived" },
]

export default async function DirectivesView({ searchParams }: DirectivesViewProps) {
  const entries = await listDirectiveFiles()
  const filtered = filterEntries(entries, searchParams)
  const sessions = sessionOptions(entries)
  const hasSessions = sessions.length > 0
  const queryValue = normalizeParam(searchParams?.query)
  const statusValue = normalizeParam(searchParams?.status)
  const directiveValue = normalizeParam(searchParams?.directive)
  const tagsValue = normalizeArrayParam(searchParams?.tags)
  const directives = directiveOptions(sessions)
  const tagList = tagOptions(entries)

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

      <Card id="directives-filters">
        <CardHeader id="directives-filters-header">
          <CardTitle id="directives-filters-title" className="text-sm">
            Filters
          </CardTitle>
          <CardDescription id="directives-filters-description">
            Filter by query, status, directive, or tags.
          </CardDescription>
        </CardHeader>
        <CardContent id="directives-filters-content">
          <form className="grid gap-3 md:grid-cols-4" method="get">
            <Input
              id="directives-filter-query"
              name="query"
              placeholder="Search"
              defaultValue={queryValue}
            />
            <FilterSelect
              id="directives-filter-status"
              name="status"
              placeholder="Status"
              options={STATUS_OPTIONS}
              value={statusValue}
            />
            <FilterSelect
              id="directives-filter-directive"
              name="directive"
              placeholder="Directive"
              options={directives}
              value={directiveValue}
            />
            <div className="md:col-span-4 space-y-2">
              <Label id="directives-filter-tags-label" htmlFor="directives-filter-tags">
                Tags
              </Label>
              <TagsMultiSelect
                id="directives-filter-tags"
                name="tags"
                options={tagList}
                values={tagsValue}
              />
            </div>
            <div className="md:col-span-4">
              <Button id="directives-filter-apply" type="submit">
                Apply filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card id="directives-new-todo">
          <CardHeader id="directives-new-todo-header">
            <CardTitle id="directives-new-todo-title" className="text-sm">
              New todo
            </CardTitle>
            <CardDescription id="directives-new-todo-description">
              Creates a new session parent file for the Architect to expand.
            </CardDescription>
          </CardHeader>
          <CardContent id="directives-new-todo-content">
            <form className="space-y-3" action={createTodo}>
              <Input id="directives-new-todo-title" name="title" placeholder="Title" />
              <Textarea
                id="directives-new-todo-summary"
                name="summary"
                placeholder="Brief summary"
                rows={3}
              />
              <Button id="directives-new-todo-submit" type="submit">
                Create todo
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card id="directives-new-task">
          <CardHeader id="directives-new-task-header">
            <CardTitle id="directives-new-task-title" className="text-sm">
              New task
            </CardTitle>
            <CardDescription id="directives-new-task-description">
              Create a task in an existing session and attach to its directive id.
            </CardDescription>
          </CardHeader>
          <CardContent id="directives-new-task-content">
            <form className="space-y-3" action={createDirectiveTask}>
              <Label
                id="directives-session-label"
                className="text-xs text-muted-foreground"
                htmlFor="directives-session"
              >
                Session
              </Label>
              <SessionSelect id="directives-session" name="session" options={sessions} />
              <TaskListInput id="directives-new-task-list" name="task" />
              <Button
                id="directives-new-task-submit"
                type="submit"
                disabled={!hasSessions}
              >
                Create task
              </Button>
            </form>
            {!hasSessions ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Create a todo first so the session list is available.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card id="directives-list">
        <CardHeader id="directives-list-header">
          <CardTitle id="directives-list-title" className="text-sm">
            Directive files
          </CardTitle>
          <CardDescription id="directives-list-description">
            {filtered.length} files found.
          </CardDescription>
        </CardHeader>
        <CardContent id="directives-list-content" className="space-y-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No directives found.</p>
          ) : (
            filtered.map((entry, index) => (
              <div key={`${entry.sessionId}-${entry.filename}`}>
                {index > 0 && <Separator id={`directives-list-separator-${index}`} />}
                <div className="flex flex-col gap-2 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{entry.meta.title}</span>
                    <Badge
                      id={`directives-status-${entry.sessionId}-${entry.filename}`}
                      className={STATUS_COLOR[entry.meta.status] ?? ""}
                    >
                      {entry.meta.status}
                    </Badge>
                    <Badge id={`directives-kind-${entry.sessionId}-${entry.filename}`}>
                      {entry.kind}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Session: {entry.sessionId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Directive: {entry.meta.directive}
                  </p>
                  <p className="text-sm text-muted-foreground">{entry.meta.summary}</p>
                  {entry.kind === "parent" && entry.meta.status === "todo" ? (
                    <form action={archiveDirective}>
                      <Input
                        id={`directives-archive-${entry.sessionId}-session`}
                        type="hidden"
                        name="sessionId"
                        value={entry.sessionId}
                      />
                      <Input
                        id={`directives-archive-${entry.sessionId}-filename`}
                        type="hidden"
                        name="filename"
                        value={entry.filename}
                      />
                      <Button
                        id={`directives-archive-${entry.sessionId}`}
                        type="submit"
                        variant="secondary"
                      >
                        Archive todo
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  )
}

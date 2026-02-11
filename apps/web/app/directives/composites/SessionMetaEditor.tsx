"use client"

import * as React from "react"

import { updateTodo } from "../actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { DirectivePriority } from "@/lib/types/directives/task"
import RelationsMultiSelect from "./RelationsMultiSelect"
import TagsInput from "./TagsInput"
import type { TagOption } from "./TagsMultiSelect"
import type { MultiSelectOption } from "./MultiSelectDropdown"

type SessionMetaEntry = {
  sessionId: string
  filename: string
  status: string
  meta: {
    title: string
    summary: string
    tags: string[]
    session_priority?: DirectivePriority
    auto_run?: boolean
    depends_on?: string[]
    blocked_by?: string[]
    related?: string[]
  }
}

type SessionMetaEditorProps = {
  entry: SessionMetaEntry
  tagOptions: TagOption[]
  relationOptions: MultiSelectOption[]
  onArchive?: React.ReactNode
}

const DEFAULT_PRIORITY: DirectivePriority = "medium"
const SAVE_DEBOUNCE_MS = 500

export default function SessionMetaEditor({
  entry,
  tagOptions,
  relationOptions,
  onArchive,
}: SessionMetaEditorProps) {
  const isLocked = entry.status.toLowerCase() !== "todo"
  const [title, setTitle] = React.useState(entry.meta.title)
  const [summary, setSummary] = React.useState(entry.meta.summary)
  const [tags, setTags] = React.useState(entry.meta.tags ?? [])
  const [sessionPriority, setSessionPriority] = React.useState<DirectivePriority>(
    entry.meta.session_priority ?? DEFAULT_PRIORITY
  )
  const [autoRun, setAutoRun] = React.useState(Boolean(entry.meta.auto_run))
  const [dependsOn, setDependsOn] = React.useState(entry.meta.depends_on ?? [])
  const [blockedBy, setBlockedBy] = React.useState(entry.meta.blocked_by ?? [])
  const [related, setRelated] = React.useState(entry.meta.related ?? [])
  const initialRef = React.useRef(true)

  React.useEffect(() => {
    setTitle(entry.meta.title ?? "")
    setSummary(entry.meta.summary ?? "")
    setTags(entry.meta.tags ?? [])
    setSessionPriority(entry.meta.session_priority ?? DEFAULT_PRIORITY)
    setAutoRun(Boolean(entry.meta.auto_run))
    setDependsOn(entry.meta.depends_on ?? [])
    setBlockedBy(entry.meta.blocked_by ?? [])
    setRelated(entry.meta.related ?? [])
    initialRef.current = true
  }, [entry])

  React.useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false
      return
    }

    const handle = setTimeout(() => {
      if (!title.trim() || !summary.trim()) {
        return
      }
      const formData = new FormData()
      formData.set("sessionId", entry.sessionId)
      formData.set("filename", entry.filename)
      formData.set("title", title)
      formData.set("summary", summary)
      formData.set("session_priority", sessionPriority)
      formData.set("auto_run", autoRun ? "on" : "off")

      tags.forEach((tag) => formData.append("tags", tag))
      dependsOn.forEach((value) => formData.append("depends_on", value))
      blockedBy.forEach((value) => formData.append("blocked_by", value))
      related.forEach((value) => formData.append("related", value))

      void updateTodo(formData)
    }, SAVE_DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [
    autoRun,
    blockedBy,
    dependsOn,
    entry.filename,
    entry.sessionId,
    related,
    sessionPriority,
    summary,
    tags,
    title,
  ])

  const formId = `directives-session-${entry.sessionId}-meta`

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label
            id={`${formId}-title-label`}
            htmlFor={`${formId}-title`}
            className="text-xs text-muted-foreground"
          >
            Title
          </Label>
          <Input
            id={`${formId}-title`}
            name="title"
            value={title}
            readOnly={isLocked}
            onChange={(event) => setTitle(event.target.value)}
          />
          {isLocked ? (
            <p className="text-xs text-muted-foreground">
              Locked after the session is opened.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label id={`${formId}-session-priority-label`}>Session priority</Label>
          <RadioGroup
            id={`${formId}-session-priority`}
            name="session_priority"
            value={sessionPriority}
            onValueChange={(value) => setSessionPriority(value as DirectivePriority)}
            className="grid grid-cols-3 gap-3"
          >
            {(["low", "medium", "high"] as const).map((value) => (
              <Label
                id={`${formId}-priority-label-${value}`}
                key={value}
                htmlFor={`${formId}-priority-${value}`}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <RadioGroupItem id={`${formId}-priority-${value}`} value={value} />
                {value}
              </Label>
            ))}
          </RadioGroup>
        </div>
      </div>

      <div className="space-y-2">
        <Label id={`${formId}-summary-label`} htmlFor={`${formId}-summary`}>
          Summary
        </Label>
        <Textarea
          id={`${formId}-summary`}
          name="summary"
          placeholder="Brief summary"
          rows={4}
          value={summary}
          readOnly={isLocked}
          onChange={(event) => setSummary(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label id={`${formId}-tags-label`} htmlFor={`${formId}-tags`}>
          Tags
        </Label>
        <TagsInput
          key={`${entry.sessionId}-tags`}
          id={`${formId}-tags`}
          name="tags"
          options={tagOptions}
          values={tags}
          onChange={setTags}
          placeholder="Add tags and press Enter"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <RelationsMultiSelect
          id={`${formId}-depends`}
          name="depends_on"
          label="Depends on"
          options={relationOptions}
          values={dependsOn}
          onChange={setDependsOn}
          anyLabel="None"
        />
        <RelationsMultiSelect
          id={`${formId}-blocked`}
          name="blocked_by"
          label="Blocked by"
          options={relationOptions}
          values={blockedBy}
          onChange={setBlockedBy}
          anyLabel="None"
        />
        <RelationsMultiSelect
          id={`${formId}-related`}
          name="related"
          label="Related"
          options={relationOptions}
          values={related}
          onChange={setRelated}
          anyLabel="None"
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
        <div>
          <Label
            id={`${formId}-auto-run-label`}
            htmlFor={`${formId}-auto-run`}
            className="text-sm font-medium"
          >
            Auto run
          </Label>
          <p className="text-xs text-muted-foreground">
            Allow agents to auto run this session without manual approval.
          </p>
        </div>
        <Switch
          id={`${formId}-auto-run`}
          checked={autoRun}
          onCheckedChange={setAutoRun}
        />
      </div>

      {onArchive ? <div className="pt-1">{onArchive}</div> : null}

      <div className="text-xs text-muted-foreground">
        Changes save automatically.
      </div>
    </div>
  )
}

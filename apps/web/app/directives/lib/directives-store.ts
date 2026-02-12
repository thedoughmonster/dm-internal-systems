import { promises as fs } from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import YAML from "yaml"

import type {
  DirectiveFile,
  DirectiveMeta,
  DirectivePriority,
} from "@/lib/types/directives/task"

const APP_ROOT = process.cwd()
const DIRECTIVES_ROOT = APP_ROOT.endsWith(path.join("apps", "web"))
  ? path.join(APP_ROOT, ".local", "directives")
  : path.join(APP_ROOT, "apps", "web", ".local", "directives")

const DEFAULT_META: Omit<DirectiveMeta, "id" | "title" | "directive" | "summary"> = {
  status: "todo",
  owner: "operator",
  assignee: null,
  priority: "medium",
  session_priority: "medium",
  auto_run: false,
  tags: [],
  created: "",
  updated: "",
  bucket: "todo",
  scope: "directives",
  source: "user",
  effort: "small",
  depends_on: [],
  blocked_by: [],
  related: [],
}

const FRONT_MATTER_DELIM = "---"

type ParsedFrontMatter = {
  meta: DirectiveMeta
  body: string
}

function getKindFromFilename(filename: string): DirectiveFile["kind"] {
  if (filename.toLowerCase() === "readme.md") {
    return "parent"
  }

  if (filename.startsWith("TASK_")) {
    return "task"
  }

  return "unknown"
}

function isDirectiveMarkdownFile(filename: string) {
  const lower = filename.toLowerCase()
  if (!lower.endsWith(".md")) {
    return false
  }

  return (
    lower === "readme.md" ||
    filename.startsWith("TASK_") ||
    filename.startsWith("ARCHIVE_TASK_")
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function ensureRoot() {
  await fs.mkdir(DIRECTIVES_ROOT, { recursive: true })
}

function parseFrontMatter(content: string): ParsedFrontMatter {
  if (!content.startsWith(FRONT_MATTER_DELIM)) {
    throw new Error("Directive file missing front matter.")
  }

  const endIndex = content.indexOf(`\n${FRONT_MATTER_DELIM}`, FRONT_MATTER_DELIM.length)
  if (endIndex === -1) {
    throw new Error("Directive file front matter is not closed.")
  }

  const yamlBlock = content.slice(FRONT_MATTER_DELIM.length, endIndex).trim()
  const body = content.slice(endIndex + FRONT_MATTER_DELIM.length + 1).trimStart()
  const parsed = YAML.parse(yamlBlock)

  if (!parsed?.meta) {
    throw new Error("Directive file front matter missing meta section.")
  }

  return { meta: parsed.meta as DirectiveMeta, body }
}

function serializeFrontMatter(meta: DirectiveMeta, body: string) {
  const yaml = YAML.stringify({ meta }).trimEnd()
  const trimmedBody = body.trim()
  return `${FRONT_MATTER_DELIM}\n${yaml}\n${FRONT_MATTER_DELIM}\n\n${trimmedBody}\n`
}

async function writeAtomic(filePath: string, content: string) {
  const tempPath = `${filePath}.tmp`
  await fs.writeFile(tempPath, content, "utf-8")
  await fs.rename(tempPath, filePath)
}

async function disableOtherSessionsAutoRun(targetSessionId: string, now: string) {
  const sessionIds = await fs.readdir(DIRECTIVES_ROOT)
  for (const sessionId of sessionIds) {
    if (sessionId === targetSessionId) {
      continue
    }

    const sessionPath = path.join(DIRECTIVES_ROOT, sessionId)
    let stat: Awaited<ReturnType<typeof fs.stat>> | null = null
    try {
      stat = await fs.stat(sessionPath)
    } catch {
      continue
    }
    if (!stat.isDirectory()) {
      continue
    }

    const otherReadmePath = path.join(sessionPath, "README.md")
    try {
      const otherContent = await fs.readFile(otherReadmePath, "utf-8")
      const otherParsed = parseFrontMatter(otherContent)
      if (!otherParsed.meta.auto_run) {
        continue
      }

      const otherUpdatedMeta: DirectiveMeta = {
        ...otherParsed.meta,
        auto_run: false,
        updated: now,
      }

      const otherUpdatedContent = serializeFrontMatter(otherUpdatedMeta, otherParsed.body)
      await writeAtomic(otherReadmePath, otherUpdatedContent)
    } catch {
      // Ignore missing/invalid sessions so toggling remains usable.
      continue
    }
  }
}

export async function listDirectiveFiles(): Promise<DirectiveFile[]> {
  await ensureRoot()
  const sessionIds = await fs.readdir(DIRECTIVES_ROOT)
  const results: DirectiveFile[] = []

  for (const sessionId of sessionIds) {
    const sessionPath = path.join(DIRECTIVES_ROOT, sessionId)
    const stat = await fs.stat(sessionPath)
    if (!stat.isDirectory()) {
      continue
    }

    const files = await fs.readdir(sessionPath)
    for (const filename of files) {
      if (!isDirectiveMarkdownFile(filename)) {
        continue
      }

      const filePath = path.join(sessionPath, filename)
      const content = await fs.readFile(filePath, "utf-8")
      const parsed = parseFrontMatter(content)
      results.push({
        sessionId,
        filename,
        kind: getKindFromFilename(filename),
        meta: parsed.meta,
        body: parsed.body,
      })
    }
  }

  return results
}

export async function listSessionFiles(sessionId: string): Promise<DirectiveFile[]> {
  await ensureRoot()
  const sessionPath = path.join(DIRECTIVES_ROOT, sessionId)
  const stat = await fs.stat(sessionPath)
  if (!stat.isDirectory()) {
    throw new Error("Session not found.")
  }

  const files = await fs.readdir(sessionPath)
  const results: DirectiveFile[] = []

  for (const filename of files) {
    if (!isDirectiveMarkdownFile(filename)) {
      continue
    }

    const filePath = path.join(sessionPath, filename)
    const content = await fs.readFile(filePath, "utf-8")
    const parsed = parseFrontMatter(content)
    results.push({
      sessionId,
      filename,
      kind: getKindFromFilename(filename),
      meta: parsed.meta,
      body: parsed.body,
    })
  }

  return results
}

export async function listSessionFileContents(sessionId: string): Promise<
  Array<DirectiveFile & { content: string }>
> {
  await ensureRoot()
  const sessionPath = path.join(DIRECTIVES_ROOT, sessionId)
  const stat = await fs.stat(sessionPath)
  if (!stat.isDirectory()) {
    throw new Error("Session not found.")
  }

  const files = await fs.readdir(sessionPath)
  const results: Array<DirectiveFile & { content: string }> = []

  for (const filename of files) {
    if (!isDirectiveMarkdownFile(filename)) {
      continue
    }

    const filePath = path.join(sessionPath, filename)
    const content = await fs.readFile(filePath, "utf-8")
    const parsed = parseFrontMatter(content)
    results.push({
      sessionId,
      filename,
      kind: getKindFromFilename(filename),
      meta: parsed.meta,
      body: parsed.body,
      content,
    })
  }

  return results
}

export async function createTodoSession(input: {
  title: string
  summary: string
  tags: string[]
  sessionPriority?: DirectivePriority
  autoRun?: boolean
  dependsOn?: string[]
  blockedBy?: string[]
  related?: string[]
}) {
  await ensureRoot()
  const now = new Date().toISOString()
  const sessionId = crypto.randomUUID()
  const directiveId = crypto.randomUUID()

  const meta: DirectiveMeta = {
    ...DEFAULT_META,
    id: crypto.randomUUID(),
    title: input.title,
    directive: directiveId,
    status: "todo",
    bucket: "todo",
    session_priority: input.sessionPriority ?? DEFAULT_META.session_priority,
    auto_run: input.autoRun ?? DEFAULT_META.auto_run,
    created: now,
    updated: now,
    summary: input.summary,
    tags: input.tags,
    depends_on: input.dependsOn ?? DEFAULT_META.depends_on,
    blocked_by: input.blockedBy ?? DEFAULT_META.blocked_by,
    related: input.related ?? DEFAULT_META.related,
  }

  const sessionPath = path.join(DIRECTIVES_ROOT, sessionId)
  await fs.mkdir(sessionPath, { recursive: true })

  const body = "# Todo\n\nDescribe the directive scope for the architect to expand."
  const content = serializeFrontMatter(meta, body)
  await writeAtomic(path.join(sessionPath, "README.md"), content)

  return { sessionId, directiveId }
}

export async function updateTodoSession(input: {
  sessionId: string
  filename: string
  title: string
  summary: string
  tags: string[]
  sessionPriority?: DirectivePriority
  autoRun?: boolean
  dependsOn?: string[]
  blockedBy?: string[]
  related?: string[]
}) {
  await ensureRoot()
  const now = new Date().toISOString()

  if (input.autoRun && input.filename.toLowerCase() === "readme.md") {
    await disableOtherSessionsAutoRun(input.sessionId, now)
  }

  const sessionPath = path.join(DIRECTIVES_ROOT, input.sessionId)
  const filePath = path.join(sessionPath, input.filename)
  const content = await fs.readFile(filePath, "utf-8")
  const parsed = parseFrontMatter(content)

  const updatedMeta: DirectiveMeta = {
    ...parsed.meta,
    title: input.title,
    summary: input.summary,
    tags: input.tags,
    session_priority: input.sessionPriority ?? parsed.meta.session_priority,
    auto_run: input.autoRun ?? parsed.meta.auto_run,
    depends_on: input.dependsOn ?? parsed.meta.depends_on,
    blocked_by: input.blockedBy ?? parsed.meta.blocked_by,
    related: input.related ?? parsed.meta.related,
    updated: now,
  }

  const updatedContent = serializeFrontMatter(updatedMeta, parsed.body)
  await writeAtomic(filePath, updatedContent)
}

export async function updateDirectiveAutoRun(input: {
  sessionId: string
  filename: string
  autoRun: boolean
}) {
  await ensureRoot()
  if (input.filename.toLowerCase() !== "readme.md") {
    throw new Error("Auto run can only be updated on the session README.md.")
  }

  const now = new Date().toISOString()

  if (input.autoRun) {
    await disableOtherSessionsAutoRun(input.sessionId, now)
  }

  const sessionPath = path.join(DIRECTIVES_ROOT, input.sessionId)
  const filePath = path.join(sessionPath, input.filename)
  const content = await fs.readFile(filePath, "utf-8")
  const parsed = parseFrontMatter(content)

  const updatedMeta: DirectiveMeta = {
    ...parsed.meta,
    auto_run: input.autoRun,
    updated: now,
  }

  const updatedContent = serializeFrontMatter(updatedMeta, parsed.body)
  await writeAtomic(filePath, updatedContent)
}

export async function createTask(input: {
  sessionId: string
  title: string
  summary: string
  directiveId: string
}) {
  await ensureRoot()
  const now = new Date().toISOString()
  const slug = slugify(input.title)
  if (!slug) {
    throw new Error("Task title must include letters or numbers.")
  }

  const sessionPath = path.join(DIRECTIVES_ROOT, input.sessionId)
  const existing = await fs.readdir(sessionPath)
  const filename = `TASK_${slug}.md`
  if (existing.includes(filename)) {
    throw new Error("Task filename already exists in this session.")
  }

  const meta: DirectiveMeta = {
    ...DEFAULT_META,
    id: crypto.randomUUID(),
    title: input.title,
    directive: input.directiveId,
    status: "open",
    bucket: "active",
    auto_run: false,
    created: now,
    updated: now,
    summary: input.summary,
    source: "architect",
  }

  const body = "# Directive\n\nProvide the executor directive here."
  const content = serializeFrontMatter(meta, body)
  await writeAtomic(path.join(sessionPath, filename), content)

  return { filename }
}

export async function updateDirectiveStatus(input: {
  sessionId: string
  filename: string
  status: string
  bucket?: string
}) {
  await ensureRoot()
  const sessionPath = path.join(DIRECTIVES_ROOT, input.sessionId)
  const filePath = path.join(sessionPath, input.filename)
  const content = await fs.readFile(filePath, "utf-8")
  const parsed = parseFrontMatter(content)

  const updatedMeta: DirectiveMeta = {
    ...parsed.meta,
    status: input.status,
    bucket: input.bucket ?? parsed.meta.bucket,
    updated: new Date().toISOString(),
  }

  const updatedContent = serializeFrontMatter(updatedMeta, parsed.body)
  await writeAtomic(filePath, updatedContent)
}

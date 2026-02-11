"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createTask,
  createTodoSession,
  updateDirectiveStatus,
  updateTodoSession,
} from "@/app/directives/lib/directives-store"
import type { DirectivePriority } from "@/lib/types/directives/task"

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== "string") {
    return ""
  }
  return value.trim()
}

function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function getTags(formData: FormData) {
  const values = formData.getAll("tags")
  const tags = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => normalizeTag(value))
    .filter((value) => value.length > 0)

  return Array.from(new Set(tags))
}

function getMultiValues(formData: FormData, key: string) {
  const values = formData.getAll(key)
  return Array.from(
    new Set(values.filter((value): value is string => typeof value === "string"))
  )
}

function getBooleanValue(formData: FormData, key: string) {
  return formData.get(key) === "on"
}

function getPriorityValue(formData: FormData, key: string): DirectivePriority {
  const value = getFormValue(formData, key)
  if (value === "low" || value === "high") {
    return value
  }
  return "medium"
}

export async function createTodo(formData: FormData) {
  const title = getFormValue(formData, "title")
  const summary = getFormValue(formData, "summary")
  const tags = getTags(formData)
  const sessionPriority = getPriorityValue(formData, "session_priority")
  const autoRun = getBooleanValue(formData, "auto_run")
  const dependsOn = getMultiValues(formData, "depends_on")
  const blockedBy = getMultiValues(formData, "blocked_by")
  const related = getMultiValues(formData, "related")

  if (!title || !summary) {
    throw new Error("Title and summary are required.")
  }

  await createTodoSession({
    title,
    summary,
    tags,
    sessionPriority,
    autoRun,
    dependsOn,
    blockedBy,
    related,
  })
  revalidatePath("/directives")
  redirect("/directives")
}

export async function createDirectiveTask(formData: FormData) {
  const sessionToken = getFormValue(formData, "session")
  const taskValues = formData.getAll("task")
  const summaries = taskValues
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  if (!sessionToken || summaries.length === 0) {
    throw new Error("Session and at least one task summary are required.")
  }

  const [sessionId, directiveId] = sessionToken.split("|")
  if (!sessionId || !directiveId) {
    throw new Error("Session selection is invalid.")
  }

  const makeTitle = (summary: string) => {
    const words = summary.split(/\s+/).slice(0, 6)
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  for (const summary of summaries) {
    const title = makeTitle(summary)
    await createTask({ sessionId, directiveId, title, summary })
  }
  revalidatePath("/directives")
}

export async function updateTodo(formData: FormData) {
  const sessionId = getFormValue(formData, "sessionId")
  const filename = getFormValue(formData, "filename")
  const title = getFormValue(formData, "title")
  const summary = getFormValue(formData, "summary")
  const tags = getTags(formData)
  const sessionPriority = getPriorityValue(formData, "session_priority")
  const autoRun = getBooleanValue(formData, "auto_run")
  const dependsOn = getMultiValues(formData, "depends_on")
  const blockedBy = getMultiValues(formData, "blocked_by")
  const related = getMultiValues(formData, "related")

  if (!sessionId || !filename) {
    throw new Error("Session and filename are required.")
  }

  if (!title || !summary) {
    throw new Error("Title and summary are required.")
  }

  await updateTodoSession({
    title,
    summary,
    tags,
    sessionPriority,
    autoRun,
    dependsOn,
    blockedBy,
    related,
    sessionId,
    filename,
  })

  revalidatePath("/directives")
}

export async function archiveDirective(formData: FormData) {
  const sessionId = getFormValue(formData, "sessionId")
  const filename = getFormValue(formData, "filename")

  if (!sessionId || !filename) {
    throw new Error("Session and filename are required.")
  }

  await updateDirectiveStatus({
    sessionId,
    filename,
    status: "archived",
    bucket: "archived",
  })

  revalidatePath("/directives")
}

export async function completeDirective(formData: FormData) {
  const sessionId = getFormValue(formData, "sessionId")
  const filename = getFormValue(formData, "filename")

  if (!sessionId || !filename) {
    throw new Error("Session and filename are required.")
  }

  await updateDirectiveStatus({
    sessionId,
    filename,
    status: "done",
    bucket: "archived",
  })

  revalidatePath("/directives")
}

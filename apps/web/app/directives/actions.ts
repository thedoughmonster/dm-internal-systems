"use server"

import { revalidatePath } from "next/cache"

import {
  createTask,
  createTodoSession,
  updateDirectiveStatus,
} from "@/app/directives/lib/directives-store"

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== "string") {
    return ""
  }
  return value.trim()
}

export async function createTodo(formData: FormData) {
  const title = getFormValue(formData, "title")
  const summary = getFormValue(formData, "summary")

  if (!title || !summary) {
    throw new Error("Title and summary are required.")
  }

  await createTodoSession({ title, summary })
  revalidatePath("/directives")
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

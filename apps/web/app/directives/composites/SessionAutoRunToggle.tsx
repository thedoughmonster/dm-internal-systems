"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { updateAutoRun } from "../actions"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import styles from "./SessionAutoRunToggle.module.css"

type SessionAutoRunToggleProps = {
  sessionId: string
  filename: string
  autoRun: boolean
}

export default function SessionAutoRunToggle({
  sessionId,
  filename,
  autoRun,
}: SessionAutoRunToggleProps) {
  const router = useRouter()
  const [checked, setChecked] = React.useState(Boolean(autoRun))
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    setChecked(Boolean(autoRun))
  }, [autoRun, sessionId, filename])

  const id = `directives-session-${sessionId}-auto-run`

  return (
    <Badge
      id={`${id}-badge`}
      variant="outline"
      className={styles.badge}
    >
      <span>Auto</span>
      <Switch
        id={id}
        checked={checked}
        disabled={isPending}
        aria-label="Auto run directive session"
        onCheckedChange={(nextChecked) => {
          setChecked(nextChecked)
          startTransition(async () => {
            const formData = new FormData()
            formData.set("sessionId", sessionId)
            formData.set("filename", filename)
            formData.set("auto_run", nextChecked ? "on" : "off")
            await updateAutoRun(formData)
            router.refresh()
          })
        }}
      />
    </Badge>
  )
}

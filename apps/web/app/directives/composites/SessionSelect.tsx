"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import styles from "./SessionSelect.module.css"

type SessionOption = {
  sessionId: string
  directive: string
  title: string
  status: string
}

type SessionSelectProps = {
  id: string
  name: string
  options: SessionOption[]
}

export default function SessionSelect({ id, name, options }: SessionSelectProps) {
  const [value, setValue] = React.useState(
    options.length > 0 ? `${options[0].sessionId}|${options[0].directive}` : ""
  )

  return (
    <div className={styles.root}>
      <Input id={`${id}-value`} type="hidden" name={name} value={value} />
      <Select id={`${id}-select`} value={value} onValueChange={setValue}>
        <SelectTrigger id={id}>
          <SelectValue id={`${id}-value-label`} placeholder="Select a session" />
        </SelectTrigger>
        <SelectContent id={`${id}-content`}>
          {options.map((session) => (
            <SelectItem
              key={session.sessionId}
              id={`${id}-option-${session.sessionId}`}
              value={`${session.sessionId}|${session.directive}`}
            >
              {session.title} ({session.status})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

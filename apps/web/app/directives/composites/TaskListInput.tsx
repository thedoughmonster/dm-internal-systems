"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const EMPTY_ROW = ""

type TaskListInputProps = {
  id: string
  name: string
}

export default function TaskListInput({ id, name }: TaskListInputProps) {
  const [rows, setRows] = React.useState<string[]>([EMPTY_ROW])

  const updateRow = React.useCallback((index: number, value: string) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? value : row)))
  }, [])

  const addRow = React.useCallback(() => {
    setRows((prev) => [...prev, EMPTY_ROW])
  }, [])

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <Input
          key={`${id}-row-${index}`}
          id={`${id}-row-${index}`}
          name={name}
          placeholder={index === 0 ? "Task summary" : "Additional task summary"}
          value={row}
          onChange={(event) => updateRow(index, event.target.value)}
        />
      ))}
      <Button id={`${id}-add`} type="button" variant="secondary" onClick={addRow}>
        + Add another task
      </Button>
    </div>
  )
}

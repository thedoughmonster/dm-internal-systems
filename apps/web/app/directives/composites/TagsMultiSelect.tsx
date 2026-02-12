"use client"

import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import styles from "./TagsMultiSelect.module.css"

export type TagOption = {
  label: string
  value: string
}

type TagsMultiSelectProps = {
  id: string
  name: string
  options: TagOption[]
  values?: string[]
}

export default function TagsMultiSelect({
  id,
  name,
  options,
  values = [],
}: TagsMultiSelectProps) {
  const [selected, setSelected] = React.useState<string[]>(values)

  const toggleTag = React.useCallback((value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((tag) => tag !== value) : [...prev, value]
    )
  }, [])

  return (
    <div className={styles.root}>
      {selected.map((value) => (
        <input
          id={`${id}-value-${value}`}
          key={value}
          type="hidden"
          name={name}
          value={value}
          hidden
        />
      ))}
      <div className={styles.optionsRow}>
        {options.length === 0 ? (
          <p className={styles.empty}>No tags available.</p>
        ) : (
          options.map((option) => {
            const checkboxId = `${id}-option-${option.value}`
            return (
              <div key={option.value} className={styles.optionItem}>
                <Checkbox
                  id={checkboxId}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => toggleTag(option.value)}
                />
                <Label id={`${checkboxId}-label`} htmlFor={checkboxId} className={styles.optionLabel}>
                  {option.label}
                </Label>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

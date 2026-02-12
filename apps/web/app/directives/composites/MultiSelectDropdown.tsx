"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import styles from "./MultiSelectDropdown.module.css"

export type MultiSelectOption = {
  label: string
  value: string
}

type MultiSelectDropdownProps = {
  id: string
  label: string
  options: MultiSelectOption[]
  values: string[]
  onChange: (next: string[]) => void
  anyLabel?: string
}

const ANY_VALUE = "__any__"

function formatSelection(
  options: MultiSelectOption[],
  values: string[],
  anyLabel: string
) {
  if (values.length === 0) {
    return anyLabel
  }

  const selectedLabels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label)

  if (selectedLabels.length === 1) {
    return selectedLabels[0]
  }

  if (selectedLabels.length > 1) {
    return `${selectedLabels.length} selected`
  }

  return `${values.length} selected`
}

export default function MultiSelectDropdown({
  id,
  label,
  options,
  values,
  onChange,
  anyLabel = "Any",
}: MultiSelectDropdownProps) {
  const selectionLabel = formatSelection(options, values, anyLabel)

  const handleToggle = React.useCallback(
    (value: string, checked: boolean) => {
      if (value === ANY_VALUE) {
        onChange([])
        return
      }

      onChange(
        checked
          ? Array.from(new Set([...values, value]))
          : values.filter((item) => item !== value)
      )
    },
    [onChange, values]
  )

  return (
    <div className={styles.root}>
      <Label id={`${id}-label`} htmlFor={id} className={styles.label}>
        {label}
      </Label>
      <DropdownMenu id={`${id}-menu`}>
        <DropdownMenuTrigger id={`${id}-trigger`} asChild>
          <Button
            id={id}
            variant="outline"
            type="button"
            className={styles.triggerButton}
            aria-labelledby={`${id}-label`}
          >
            <span className={styles.selectionText}>{selectionLabel}</span>
            <ChevronDown className={styles.chevron} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          id={`${id}-content`}
          align="start"
          className={styles.menuContent}
        >
          <DropdownMenuCheckboxItem
            id={`${id}-option-any`}
            checked={values.length === 0}
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={(checked) => handleToggle(ANY_VALUE, Boolean(checked))}
          >
            {anyLabel}
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator id={`${id}-separator`} />
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              id={`${id}-option-${option.value}`}
              key={option.value}
              checked={values.includes(option.value)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(checked) =>
                handleToggle(option.value, Boolean(checked))
              }
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

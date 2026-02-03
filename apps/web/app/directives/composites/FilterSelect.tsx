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

export type FilterOption = {
  label: string
  value: string
}

type FilterSelectProps = {
  id: string
  name: string
  placeholder: string
  options: FilterOption[]
  value?: string
}

export default function FilterSelect({
  id,
  name,
  placeholder,
  options,
  value = "",
}: FilterSelectProps) {
  const initial = value === "" ? "__any__" : value
  const [selected, setSelected] = React.useState(initial)

  return (
    <div className="space-y-2">
      <Input id={`${id}-value`} type="hidden" name={name} value={selected} />
      <Select id={`${id}-select`} value={selected} onValueChange={setSelected}>
        <SelectTrigger id={id}>
          <SelectValue id={`${id}-label`} placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent id={`${id}-content`}>
          <SelectItem id={`${id}-option-all`} value="__any__">
            Any
          </SelectItem>
          {options.map((option) => (
            <SelectItem
              id={`${id}-option-${option.value}`}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

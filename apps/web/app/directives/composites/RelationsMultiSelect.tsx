"use client"

import * as React from "react"

import MultiSelectDropdown, { type MultiSelectOption } from "./MultiSelectDropdown"

type RelationsMultiSelectProps = {
  id: string
  name: string
  label: string
  options: MultiSelectOption[]
  values: string[]
  onChange: (next: string[]) => void
  anyLabel?: string
}

export default function RelationsMultiSelect({
  id,
  name,
  label,
  options,
  values,
  onChange,
  anyLabel,
}: RelationsMultiSelectProps) {
  return (
    <div className="space-y-2">
      {values.map((value) => (
        <input
          key={value}
          id={`${id}-value-${value}`}
          type="hidden"
          name={name}
          value={value}
        />
      ))}
      <MultiSelectDropdown
        id={id}
        label={label}
        options={options}
        values={values}
        onChange={onChange}
        anyLabel={anyLabel}
      />
    </div>
  )
}

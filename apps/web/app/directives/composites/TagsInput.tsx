"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { TagOption } from "./TagsMultiSelect"
import styles from "./TagsInput.module.css"

type TagsInputProps = {
  id: string
  name: string
  options: TagOption[]
  values?: string[]
  placeholder?: string
  onChange?: (next: string[]) => void
}

const MAX_SUGGESTIONS = 5

function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function normalizeForMatch(value: string) {
  return normalizeTag(value)
}

function isSubsequence(query: string, target: string) {
  let qIndex = 0
  let tIndex = 0
  let gaps = 0

  while (qIndex < query.length && tIndex < target.length) {
    if (query[qIndex] === target[tIndex]) {
      qIndex += 1
    } else {
      gaps += 1
    }
    tIndex += 1
  }

  if (qIndex < query.length) {
    return { matched: false, gaps: Number.POSITIVE_INFINITY }
  }

  gaps += target.length - tIndex
  return { matched: true, gaps }
}

function scoreOption(query: string, option: string) {
  if (!query) return Number.NEGATIVE_INFINITY
  const index = option.indexOf(query)
  if (index >= 0) {
    return 100 - index * 2 - Math.abs(option.length - query.length)
  }

  const subsequence = isSubsequence(query, option)
  if (subsequence.matched) {
    return 60 - subsequence.gaps - Math.abs(option.length - query.length)
  }

  return Number.NEGATIVE_INFINITY
}

function getSuggestions(query: string, options: TagOption[], selected: string[]) {
  const normalizedQuery = normalizeForMatch(query)
  if (!normalizedQuery) return []

  const selectedSet = new Set(selected)
  const scored = options
    .map((option) => {
      const normalizedValue = normalizeForMatch(option.value || option.label)
      return {
        option,
        normalizedValue,
        score: scoreOption(normalizedQuery, normalizedValue),
      }
    })
    .filter((entry) => entry.score > Number.NEGATIVE_INFINITY)
    .filter((entry) => !selectedSet.has(entry.normalizedValue))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS)

  return scored.map((entry) => ({
    label: entry.option.label || entry.option.value,
    value: entry.normalizedValue,
  }))
}

export default function TagsInput({
  id,
  name,
  options,
  values = [],
  placeholder = "Add tags",
  onChange,
}: TagsInputProps) {
  const normalizedValues = React.useMemo(
    () => values.map((value) => normalizeTag(value)).filter(Boolean),
    [values]
  )
  const [inputValue, setInputValue] = React.useState("")
  const [selected, setSelected] = React.useState<string[]>(
    normalizedValues
  )
  const [activeIndex, setActiveIndex] = React.useState<number>(-1)

  const suggestions = React.useMemo(
    () => getSuggestions(inputValue, options, selected),
    [inputValue, options, selected]
  )

  React.useEffect(() => {
    const next = normalizedValues
    setSelected((prev) => {
      if (prev.length === next.length && prev.every((value, index) => value === next[index])) {
        return prev
      }
      return next
    })
  }, [normalizedValues])

  React.useEffect(() => {
    onChange?.(selected)
  }, [onChange, selected])

  React.useEffect(() => {
    if (suggestions.length === 0) {
      setActiveIndex(-1)
      return
    }
    setActiveIndex((prev) =>
      prev < 0 || prev >= suggestions.length ? 0 : prev
    )
  }, [suggestions])

  const commitTag = (value: string) => {
    const normalized = normalizeTag(value)
    if (!normalized) {
      return
    }
    setSelected((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized]
    )
    setInputValue("")
  }

  const removeTag = (tag: string) => {
    setSelected((prev) => prev.filter((item) => item !== tag))
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/\s+/g, "-")
    setInputValue(nextValue)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab" && suggestions.length > 0) {
      event.preventDefault()
      setActiveIndex((prev) => {
        const lastIndex = suggestions.length - 1
        if (event.shiftKey) {
          return prev <= 0 ? lastIndex : prev - 1
        }
        return prev >= lastIndex ? 0 : prev + 1
      })
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const activeSuggestion =
        activeIndex >= 0 ? suggestions[activeIndex] : null
      commitTag(activeSuggestion?.value ?? inputValue)
    }
  }

  const handleSuggestionClick = (value: string, index: number) => {
    setInputValue(value)
    setActiveIndex(index)
  }

  const normalizedInput = normalizeTag(inputValue)
  const activeSuggestion =
    activeIndex >= 0 ? suggestions[activeIndex] : null
  const ghostSuffix =
    activeSuggestion &&
    (normalizedInput.length === 0 ||
      activeSuggestion.value.startsWith(normalizedInput))
      ? activeSuggestion.value.slice(normalizedInput.length)
      : ""

  return (
    <div className={styles.root}>
      {selected.map((value) => (
        <Input
          id={`${id}-value-${value}`}
          key={value}
          type="hidden"
          name={name}
          value={value}
        />
      ))}
      <div className={styles.inputWrap}>
        {ghostSuffix ? (
          <div className={styles.ghostOverlay}>
            <span className={styles.ghostText}>
              <span className={styles.invisiblePrefix}>{inputValue}</span>
              <span>{ghostSuffix}</span>
            </span>
          </div>
        ) : null}
        <Input
          id={id}
          name={`${name}-input`}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </div>
      {suggestions.length > 0 ? (
        <div className={styles.suggestionsWrap}>
          <div className={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <Button
                key={suggestion.value}
                id={`${id}-suggestion-${suggestion.value}`}
                type="button"
                variant="secondary"
                className={cn(
                  styles.suggestionButton,
                  index === activeIndex ? styles.suggestionActive : undefined
                )}
                onClick={() => handleSuggestionClick(suggestion.value, index)}
              >
                {suggestion.label}
              </Button>
            ))}
          </div>
          <p className={styles.suggestionHint}>
            Tab to cycle suggestions, Enter to accept.
          </p>
        </div>
      ) : null}
      {selected.length > 0 ? (
        <div className={styles.chipsWrap}>
          {selected.map((tag) => (
            <Badge
              key={tag}
              id={`${id}-chip-${tag}`}
              variant="secondary"
              className={styles.chip}
              role="button"
              tabIndex={0}
              onClick={() => removeTag(tag)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  removeTag(tag)
                }
              }}
              aria-label={`Remove ${tag}`}
            >
              <span>{tag}</span>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

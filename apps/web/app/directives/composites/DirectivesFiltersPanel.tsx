"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MultiSelectOption } from "./MultiSelectDropdown"
import MultiSelectDropdown from "./MultiSelectDropdown"
import styles from "./DirectivesFiltersPanel.module.css"

const SEARCH_DEBOUNCE_MS = 300

type DirectivesFiltersPanelProps = {
  queryValue: string
  statusValues: string[]
  statusOptions: MultiSelectOption[]
  tagValues: string[]
  tagOptions: MultiSelectOption[]
}

export default function DirectivesFiltersPanel({
  queryValue,
  statusValues,
  statusOptions,
  tagValues,
  tagOptions,
}: DirectivesFiltersPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchRef = React.useRef(searchParams?.toString() ?? "")

  const defaultStatuses = React.useMemo(
    () => statusOptions.map((option) => option.value).filter((value) => value !== "archived"),
    [statusOptions]
  )

  const [query, setQuery] = React.useState(queryValue)
  const [statuses, setStatuses] = React.useState(
    statusValues.length > 0 ? statusValues : defaultStatuses
  )
  const [tags, setTags] = React.useState(tagValues)

  const updateParams = React.useCallback(
    (next: {
      query?: string
      statuses?: string[]
      tags?: string[]
    }) => {
      const currentSearch = searchRef.current ?? ""
      const params = new URLSearchParams()
      const nextQuery = next.query ?? query
      const nextStatuses = next.statuses ?? statuses
      const nextTags = next.tags ?? tags

      if (nextQuery) {
        params.set("query", nextQuery)
      } else {
        params.delete("query")
      }

      params.delete("status")
      nextStatuses.forEach((status) => params.append("status", status))

      params.delete("tags")
      nextTags.forEach((tag) => params.append("tags", tag))

      const search = params.toString()
      if (search === currentSearch) {
        return
      }
      if (!pathname) {
        return
      }
      router.replace(search ? `${pathname}?${search}` : pathname)
    },
    [query, statuses, tags, pathname, router]
  )

  React.useEffect(() => {
    searchRef.current = searchParams?.toString() ?? ""
  }, [searchParams])

  React.useEffect(() => {
    if (statusValues.length > 0) {
      return
    }
    setStatuses(defaultStatuses)
    updateParams({ statuses: defaultStatuses })
  }, [defaultStatuses, statusValues.length, updateParams])

  React.useEffect(() => {
    const handle = setTimeout(() => {
      updateParams({ query })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(handle)
  }, [query, updateParams])

  const handleStatusChange = (next: string[]) => {
    setStatuses(next)
    updateParams({ statuses: next })
  }

  const handleTagsChange = (next: string[]) => {
    setTags(next)
    updateParams({ tags: next })
  }

  return (
    <div className={styles.root}>
      <div className={styles.actionsRow}>
        <Button
          id="directives-filter-reset"
          type="button"
          variant="ghost"
          className={styles.resetButton}
          onClick={() => {
            setQuery("")
            setStatuses(defaultStatuses)
            setTags([])
            updateParams({ query: "", statuses: defaultStatuses, tags: [] })
          }}
        >
          Reset filters
        </Button>
      </div>
      <div className={styles.fieldsGrid}>
        <div className={styles.fieldGroup}>
          <Label id="directives-filter-query-label" htmlFor="directives-filter-query">
            Search
          </Label>
          <Input
            id="directives-filter-query"
            name="query"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <MultiSelectDropdown
          id="directives-filter-status"
          label="Status"
          options={statusOptions}
          values={statuses}
          onChange={handleStatusChange}
          anyLabel="Any"
        />
        <MultiSelectDropdown
          id="directives-filter-tags"
          label="Tags"
          options={tagOptions}
          values={tags}
          onChange={handleTagsChange}
          anyLabel="Any"
        />
      </div>
    </div>
  )
}

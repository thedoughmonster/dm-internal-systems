import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  fetchDefaultVendorId,
  fetchPriceChanges,
  fetchPriceChangeSeriesResponse,
} from "../lib/api"
import type {
  PriceChangeDrilldownMetrics,
  PriceChangeDrilldownSelection,
  PriceChangeFreshnessFilter,
  PriceChangeRankingMetric,
  PriceChangeRecentFilter,
  PriceChangeRow,
  PriceChangeSeriesGranularityOption,
  PriceChangeSeriesPoint,
} from "../lib/types"
import {
  DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT,
  getPriceChangeThresholdPercent,
} from "@/lib/app-settings"

const DAY_OPTIONS = [7, 14, 28, 56, 90]
const GRANULARITY_OPTIONS: PriceChangeSeriesGranularityOption[] = ["day", "week", "month"]
const SORT_OPTIONS: PriceChangeRankingMetric[] = [
  "percent_swing",
  "absolute_swing",
  "volatility",
  "recent_movers",
  "freshness",
]
const MIN_OBSERVATION_OPTIONS = [1, 2, 3, 5, 8, 13]
const FRESHNESS_OPTIONS: PriceChangeFreshnessFilter[] = ["all", "7", "14", "30", "60", "90"]
const DRILLDOWN_DAYS_OPTIONS = [14, 30, 60, 90, 180]

function parseDays(value?: string) {
  if (!value) return 90
  const parsed = Number(value)
  return DAY_OPTIONS.includes(parsed) ? parsed : 90
}

function parseGranularity(value?: string): PriceChangeSeriesGranularityOption {
  return GRANULARITY_OPTIONS.includes(value as PriceChangeSeriesGranularityOption)
    ? (value as PriceChangeSeriesGranularityOption)
    : "day"
}

function parseSortMetric(value?: string): PriceChangeRankingMetric {
  return SORT_OPTIONS.includes(value as PriceChangeRankingMetric)
    ? (value as PriceChangeRankingMetric)
    : "percent_swing"
}

function parseMinObservations(value?: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(1, Math.floor(parsed))
}

function parseRecentFilter(value?: string): PriceChangeRecentFilter {
  return value === "movers_only" ? "movers_only" : "all"
}

function parseFreshnessFilter(value?: string): PriceChangeFreshnessFilter {
  return FRESHNESS_OPTIONS.includes(value as PriceChangeFreshnessFilter)
    ? (value as PriceChangeFreshnessFilter)
    : "all"
}

function parseDrilldownDays(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(1, Math.floor(parsed))
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function formatSignedCurrency(cents: number) {
  const sign = cents > 0 ? "+" : ""
  return `${sign}${formatCurrency(cents)}`
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${(value * 100).toFixed(1)}%`
}

function formatPriceChangeLabel(change: PriceChangeRow) {
  const labelParts = [change.vendor_sku, change.description].filter(
    (part) => typeof part === "string" && part.trim().length > 0
  ) as string[]
  return labelParts.length > 0
    ? labelParts.join(" | ")
    : change.vendor_catalog_item_id
}

function formatSortMetric(metric: PriceChangeRankingMetric) {
  switch (metric) {
    case "absolute_swing":
      return "Absolute swing"
    case "volatility":
      return "Volatility"
    case "recent_movers":
      return "Recent movers"
    case "freshness":
      return "Freshness"
    case "percent_swing":
    default:
      return "Percent swing"
  }
}

function formatGranularity(granularity: PriceChangeSeriesGranularityOption) {
  if (granularity === "week") return "Weekly"
  if (granularity === "month") return "Monthly"
  return "Daily"
}

function parseIsoDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function daysBetween(fromIso: string | null | undefined, toIso: string | null | undefined) {
  const from = parseIsoDate(fromIso)
  const to = parseIsoDate(toIso)
  if (!from || !to) return null
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / msPerDay))
}

function computeVolatilityScore(points: PriceChangeSeriesPoint[]) {
  if (points.length < 2) return 0
  const values = points.map((point) => point.averagePriceCents)
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  if (mean <= 0) return 0
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

function computeDrilldownMetrics(points: PriceChangeSeriesPoint[]): PriceChangeDrilldownMetrics {
  if (points.length === 0) {
    return {
      observationCount: 0,
      minPriceCents: 0,
      maxPriceCents: 0,
      averagePriceCents: 0,
      absoluteSwingCents: 0,
      percentSwing: 0,
      volatilityScore: 0,
      netChangeCents: 0,
      netChangePercent: 0,
    }
  }

  const prices = points.map((point) => point.averagePriceCents)
  const minPriceCents = Math.min(...prices)
  const maxPriceCents = Math.max(...prices)
  const averagePriceCents = Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)
  const absoluteSwingCents = Math.max(0, maxPriceCents - minPriceCents)
  const percentSwing = minPriceCents > 0 ? absoluteSwingCents / minPriceCents : 0
  const firstPrice = prices[0]
  const lastPrice = prices[prices.length - 1]
  const netChangeCents = lastPrice - firstPrice
  const netChangePercent = firstPrice > 0 ? netChangeCents / firstPrice : 0

  return {
    observationCount: points.reduce((sum, point) => sum + point.observationCount, 0),
    minPriceCents,
    maxPriceCents,
    averagePriceCents,
    absoluteSwingCents,
    percentSwing,
    volatilityScore: computeVolatilityScore(points),
    netChangeCents,
    netChangePercent,
  }
}

function buildSeriesTable(points: PriceChangeSeriesPoint[], itemId: string) {
  if (points.length === 0) {
    return <div className="text-xs text-muted-foreground">No invoice history in range.</div>
  }
  const tableId = `price-changes-series-${itemId}`.replace(/[^a-z0-9]+/gi, "-")

  return (
    <div className="overflow-x-auto rounded-md border border-border/60 bg-card/40">
      <Table id={`${tableId}-table`}>
        <TableHeader
          id={`${tableId}-header`}
          className="text-xs uppercase tracking-wide text-muted-foreground"
        >
          <TableRow id={`${tableId}-header-row`} className="border-border/40">
            <TableHead id={`${tableId}-head-date`} className="p-2">
              Invoice date
            </TableHead>
            <TableHead id={`${tableId}-head-price`} className="p-2 text-right">
              Avg price
            </TableHead>
            <TableHead id={`${tableId}-head-obs`} className="p-2 text-right">
              Observations
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody id={`${tableId}-body`}>
          {points.map((point) => (
            <TableRow
              id={`${tableId}-row-${point.invoiceDate}`}
              key={`${point.invoiceDate}-${point.firstInvoiceDate}-${point.lastInvoiceDate}`}
              className="border-border/40"
            >
              <TableCell
                id={`${tableId}-cell-${point.invoiceDate}-date`}
                className="p-2 text-xs text-muted-foreground"
              >
                {point.invoiceDate}
              </TableCell>
              <TableCell
                id={`${tableId}-cell-${point.invoiceDate}-price`}
                className="p-2 text-right text-xs font-mono"
              >
                {formatCurrency(point.averagePriceCents)}
              </TableCell>
              <TableCell
                id={`${tableId}-cell-${point.invoiceDate}-obs`}
                className="p-2 text-right text-xs text-muted-foreground"
              >
                {point.observationCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

type RankedPriceChange = {
  change: PriceChangeRow
  points: PriceChangeSeriesPoint[]
  observationCount: number
  percentSwing: number
  absoluteSwingCents: number
  volatilityScore: number
  recentMoverPercent: number
  freshnessDays: number
}

function compareRankedChanges(a: RankedPriceChange, b: RankedPriceChange, metric: PriceChangeRankingMetric) {
  const numberCompare = (left: number, right: number) => right - left
  const freshnessCompare = a.freshnessDays - b.freshnessDays

  const metricCompare = (() => {
    switch (metric) {
      case "absolute_swing":
        return numberCompare(a.absoluteSwingCents, b.absoluteSwingCents)
      case "volatility":
        return numberCompare(a.volatilityScore, b.volatilityScore)
      case "recent_movers":
        return numberCompare(a.recentMoverPercent, b.recentMoverPercent)
      case "freshness":
        return freshnessCompare
      case "percent_swing":
      default:
        return numberCompare(a.percentSwing, b.percentSwing)
    }
  })()
  if (metricCompare !== 0) return metricCompare

  // Deterministic tie-break: newest change first, then catalog item id.
  const latestDateCompare = b.change.latest_invoice_date.localeCompare(a.change.latest_invoice_date)
  if (latestDateCompare !== 0) return latestDateCompare
  return a.change.vendor_catalog_item_id.localeCompare(b.change.vendor_catalog_item_id)
}

function buildHref(
  vendorId: string | null,
  state: {
    days: number
    granularity: PriceChangeSeriesGranularityOption
    sort: PriceChangeRankingMetric
    minObs: number
    recent: PriceChangeRecentFilter
    freshness: PriceChangeFreshnessFilter
    detailDays: number
    item: string | null
  },
  overrides: Partial<Record<"days" | "granularity" | "sort" | "minObs" | "recent" | "freshness" | "detailDays" | "item", string | null>>
) {
  const query = new URLSearchParams()
  if (vendorId) query.set("vendor", vendorId)
  query.set("days", String(state.days))
  query.set("granularity", state.granularity)
  query.set("sort", state.sort)
  query.set("minObs", String(state.minObs))
  query.set("recent", state.recent)
  query.set("freshness", state.freshness)
  query.set("detailDays", String(state.detailDays))
  if (state.item) query.set("item", state.item)
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === null) {
      query.delete(key)
      return
    }
    if (!value) return
    query.set(key, value)
  })
  return `/vendors/ingest/price-changes?${query.toString()}`
}

export default async function PriceChangesView({
  searchParams,
  baseUrl,
}: {
  searchParams?: {
    vendor?: string
    days?: string
    granularity?: string
    sort?: string
    minObs?: string
    recent?: string
    freshness?: string
    detailDays?: string
    item?: string
  }
  baseUrl?: string | null
}) {
  const viewId = "price-changes"
  const days = parseDays(searchParams?.days)
  const granularity = parseGranularity(searchParams?.granularity)
  const sortBy = parseSortMetric(searchParams?.sort)
  const minObservations = parseMinObservations(searchParams?.minObs)
  const recentFilter = parseRecentFilter(searchParams?.recent)
  const freshnessFilter = parseFreshnessFilter(searchParams?.freshness)
  const detailDays = parseDrilldownDays(searchParams?.detailDays, days)
  const selectedItemId = searchParams?.item ?? null
  let vendorId = searchParams?.vendor ?? null

  if (!vendorId) {
    vendorId = await fetchDefaultVendorId(baseUrl)
  }

  let thresholdPercent = DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT
  let thresholdError: string | null = null

  try {
    thresholdPercent = await getPriceChangeThresholdPercent(baseUrl)
  } catch (error) {
    thresholdError = error instanceof Error ? error.message : "Unable to load threshold setting"
  }

  const minPercentChange = thresholdPercent / 100
  const freshnessMaxDays = freshnessFilter === "all" ? null : Number(freshnessFilter)

  let priceChanges: PriceChangeRow[] = []
  let errorMessage: string | null = null
  let seriesError: string | null = null
  let rankedChanges: RankedPriceChange[] = []

  try {
    if (!vendorId) {
      throw new Error("No vendor available for price changes")
    }

    priceChanges = await fetchPriceChanges({
      vendorId,
      days,
      minPercentChange,
    }, baseUrl)

    if (priceChanges.length > 0) {
      const response = await fetchPriceChangeSeriesResponse(
        {
          vendorId,
          days,
          granularity,
          itemIds: priceChanges.map((change) => change.vendor_catalog_item_id),
        },
        baseUrl
      )

      const effectiveEndDate = response.range.endDate || new Date().toISOString().slice(0, 10)
      rankedChanges = priceChanges.map((change) => {
        const item = response.items[change.vendor_catalog_item_id]
        const points = item?.points ?? []
        const prices = points.map((point) => point.averagePriceCents)
        const minPrice = prices.length > 0 ? Math.min(...prices) : change.previous_price_cents
        const maxPrice = prices.length > 0 ? Math.max(...prices) : change.latest_price_cents
        const absoluteSwingCents = Math.max(0, maxPrice - minPrice)
        const percentSwing = minPrice > 0 ? absoluteSwingCents / minPrice : 0
        const recentMoverPercent = (() => {
          if (points.length < 2) return 0
          const previous = points[points.length - 2].averagePriceCents
          const latest = points[points.length - 1].averagePriceCents
          if (previous <= 0) return 0
          return Math.abs((latest - previous) / previous)
        })()
        const observationCount = item?.observationCount ?? points.length
        const freshnessDays =
          daysBetween(item?.lastInvoiceDate ?? change.latest_invoice_date, effectiveEndDate) ?? Number.MAX_SAFE_INTEGER
        return {
          change,
          points,
          observationCount,
          percentSwing,
          absoluteSwingCents,
          volatilityScore: computeVolatilityScore(points),
          recentMoverPercent,
          freshnessDays,
        }
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load price changes"
    if (message.toLowerCase().includes("history")) {
      seriesError = message
    } else {
      errorMessage = message
    }
  }

  const filteredChanges = rankedChanges
    .filter((row) => row.observationCount >= minObservations)
    .filter((row) => (recentFilter === "movers_only" ? row.recentMoverPercent >= minPercentChange : true))
    .filter((row) => (freshnessMaxDays !== null ? row.freshnessDays <= freshnessMaxDays : true))
    .sort((a, b) => compareRankedChanges(a, b, sortBy))

  const headerDescription = vendorId
    ? `Vendor ${vendorId}`
    : "Vendor selection required"

  const state = {
    days,
    granularity,
    sort: sortBy,
    minObs: minObservations,
    recent: recentFilter,
    freshness: freshnessFilter,
    detailDays,
    item: selectedItemId,
  }

  const selectedRow = selectedItemId
    ? filteredChanges.find((row) => row.change.vendor_catalog_item_id === selectedItemId) ?? null
    : null
  const effectiveSelectedRow = selectedRow ?? filteredChanges[0] ?? null
  const drilldownSelection: PriceChangeDrilldownSelection | null =
    effectiveSelectedRow && vendorId
      ? { vendorId, itemId: effectiveSelectedRow.change.vendor_catalog_item_id }
      : null
  const drilldownPoints = (() => {
    if (!effectiveSelectedRow) return [] as PriceChangeSeriesPoint[]
    if (detailDays <= 0) return effectiveSelectedRow.points
    return effectiveSelectedRow.points.slice(-detailDays)
  })()
  const drilldownMetrics = computeDrilldownMetrics(drilldownPoints)

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Price changes</h1>
          <p className="text-sm text-muted-foreground">
            Track ingredient price movement by vendor and invoice date.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge id={`${viewId}-badge-vendor`} variant="outline">
            {headerDescription}
          </Badge>
          <Badge id={`${viewId}-badge-window`} variant="secondary">
            Window {days} days
          </Badge>
          <Badge id={`${viewId}-badge-granularity`} variant="outline">
            {formatGranularity(granularity)}
          </Badge>
          <Badge id={`${viewId}-badge-sort`} variant="outline">
            Sort {formatSortMetric(sortBy)}
          </Badge>
          <Badge id={`${viewId}-badge-threshold`} variant="outline">
            Min change {thresholdPercent}%
          </Badge>
        </div>
      </header>

      {thresholdError ? (
        <Card
          id={`${viewId}-threshold-card`}
          className="border-border/70 bg-card/60"
          headerTitle="Threshold setting unavailable"
        >
          <CardContent id={`${viewId}-threshold-content`}>
            <p className="text-sm text-muted-foreground">Using the default threshold.</p>
            <p className="text-sm text-destructive break-words">{thresholdError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card
        id={`${viewId}-range-card`}
        className="border-border/70 bg-card/60"
        headerTitle="Time range and filters"
      >
        <CardContent id={`${viewId}-range-content`} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ranking recomputes when window, granularity, or filters change.
          </p>
          <Separator id={`${viewId}-range-separator`} />
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((option) => (
              <Button
                key={option}
                id={`${viewId}-range-${option}`}
                asChild
                size="sm"
                variant={option === days ? "default" : "outline"}
              >
                <Link href={buildHref(vendorId, state, { days: String(option) })}>{option} days</Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {GRANULARITY_OPTIONS.map((option) => (
              <Button
                key={option}
                id={`${viewId}-granularity-${option}`}
                asChild
                size="sm"
                variant={option === granularity ? "default" : "outline"}
              >
                <Link href={buildHref(vendorId, state, { granularity: option })}>
                  {formatGranularity(option)}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option}
                id={`${viewId}-sort-${option}`}
                asChild
                size="sm"
                variant={option === sortBy ? "default" : "outline"}
              >
                <Link href={buildHref(vendorId, state, { sort: option })}>
                  {formatSortMetric(option)}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {MIN_OBSERVATION_OPTIONS.map((option) => (
              <Button
                key={option}
                id={`${viewId}-min-obs-${option}`}
                asChild
                size="sm"
                variant={option === minObservations ? "default" : "outline"}
              >
                <Link href={buildHref(vendorId, state, { minObs: String(option) })}>
                  Min obs {option}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "movers_only"] as const).map((option) => (
              <Button
                key={option}
                id={`${viewId}-recent-${option}`}
                asChild
                size="sm"
                variant={option === recentFilter ? "default" : "outline"}
              >
                <Link href={buildHref(vendorId, state, { recent: option })}>
                  {option === "movers_only" ? "Recent movers" : "All movers"}
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {FRESHNESS_OPTIONS.map((option) => (
              <Button
                key={option}
                id={`${viewId}-freshness-${option}`}
                asChild
                size="sm"
                variant={option === freshnessFilter ? "default" : "outline"}
              >
                <Link href={buildHref(vendorId, state, { freshness: option })}>
                  {option === "all" ? "Any freshness" : `Fresh <= ${option}d`}
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card
          id={`${viewId}-error-card`}
          className="border-border/70 bg-card/60"
          headerTitle="Unable to load price changes"
        >
          <CardContent id={`${viewId}-error-content`}>
            <p className="text-sm text-muted-foreground">
              Check Supabase connectivity and vendor data.
            </p>
            <p className="text-sm text-destructive break-words">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : filteredChanges.length === 0 ? (
        <Card
          id={`${viewId}-empty-card`}
          className="border-border/70 bg-card/60"
          headerTitle="No ranked items"
        >
          <CardContent id={`${viewId}-empty-content`}>
            <p className="text-sm text-muted-foreground">
              No items match the current volatility, freshness, and observation filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card
            id={`${viewId}-changes-card`}
            className="border-border/70 bg-card/60"
            headerTitle="Ranked items"
          >
            <CardContent id={`${viewId}-changes-content`}>
              <p className="text-sm text-muted-foreground">
                Showing {filteredChanges.length} items sorted by {formatSortMetric(sortBy).toLowerCase()}.
              </p>
              <Separator id={`${viewId}-changes-separator`} />
              <div className="overflow-x-auto rounded-md border border-border/60 bg-card/40">
                <Table id={`${viewId}-changes-table`}>
                  <TableHeader
                    id={`${viewId}-changes-table-header`}
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    <TableRow id={`${viewId}-changes-table-header-row`} className="border-border/40">
                      <TableHead id={`${viewId}-changes-table-head-item`} className="p-3">
                        Item
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-swing`} className="p-3 text-right">
                        % Swing
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-abs`} className="p-3 text-right">
                        Abs Swing
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-vol`} className="p-3 text-right">
                        Volatility
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-recent`} className="p-3 text-right">
                        Recent
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-fresh`} className="p-3 text-right">
                        Freshness
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-obs`} className="p-3 text-right">
                        Obs
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-drill`} className="p-3 text-right">
                        Drilldown
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody id={`${viewId}-changes-table-body`}>
                    {filteredChanges.map((row) => (
                      <TableRow
                        id={`${viewId}-changes-row-${row.change.vendor_catalog_item_id}`}
                        key={row.change.vendor_catalog_item_id}
                        className="border-border/40"
                      >
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-item`} className="p-3 text-sm">
                          <div className="text-foreground">{formatPriceChangeLabel(row.change)}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.change.vendor_catalog_item_id}
                          </div>
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-swing`} className="p-3 text-right text-sm">
                          {formatSignedPercent(row.percentSwing)}
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-abs`} className="p-3 text-right text-sm">
                          {formatSignedCurrency(row.absoluteSwingCents)}
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-vol`} className="p-3 text-right text-sm">
                          {(row.volatilityScore * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-recent`} className="p-3 text-right text-sm">
                          {formatSignedPercent(row.recentMoverPercent)}
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-fresh`} className="p-3 text-right text-sm">
                          {row.freshnessDays}d
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-obs`} className="p-3 text-right text-sm">
                          {row.observationCount}
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-drill`} className="p-3 text-right text-sm">
                          <Button
                            id={`${viewId}-changes-cell-${row.change.vendor_catalog_item_id}-drill-button`}
                            asChild
                            size="sm"
                            variant="outline"
                          >
                            <Link href={buildHref(vendorId, state, { item: row.change.vendor_catalog_item_id })}>
                              Analyze
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {seriesError ? (
            <Card
              id={`${viewId}-series-error-card`}
              className="border-border/70 bg-card/60"
              headerTitle="Price history unavailable"
            >
              <CardContent id={`${viewId}-series-error-content`}>
                <p className="text-sm text-muted-foreground">
                  Series data could not be loaded.
                </p>
                <p className="text-sm text-destructive break-words">{seriesError}</p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4">
            {effectiveSelectedRow ? (
              <Card
                id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}`}
                key={`${effectiveSelectedRow.change.vendor_catalog_item_id}-history`}
                className="border-border/70 bg-card/60"
                headerTitle={`Drilldown: ${formatPriceChangeLabel(effectiveSelectedRow.change)}`}
              >
                <CardContent id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-content`} className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selected item {drilldownSelection?.itemId ?? "n/a"} for vendor {drilldownSelection?.vendorId ?? "n/a"}.
                    Latest {formatCurrency(effectiveSelectedRow.change.latest_price_cents)} on {effectiveSelectedRow.change.latest_invoice_date}. Previous {formatCurrency(
                      effectiveSelectedRow.change.previous_price_cents
                    )} on {effectiveSelectedRow.change.previous_invoice_date}.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DRILLDOWN_DAYS_OPTIONS.map((option) => (
                      <Button
                        key={option}
                        id={`${viewId}-drilldown-days-${option}`}
                        asChild
                        size="sm"
                        variant={option === detailDays ? "default" : "outline"}
                      >
                        <Link href={buildHref(vendorId, state, { detailDays: String(option) })}>
                          Last {option} points
                        </Link>
                      </Button>
                    ))}
                    <Button
                      id={`${viewId}-drilldown-clear`}
                      asChild
                      size="sm"
                      variant="ghost"
                    >
                      <Link href={buildHref(vendorId, state, { item: null })}>Clear selection</Link>
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-delta`} variant="outline">
                      Net {formatSignedPercent(drilldownMetrics.netChangePercent)}
                    </Badge>
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-delta-amount`} variant="outline">
                      {formatSignedCurrency(drilldownMetrics.netChangeCents)}
                    </Badge>
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-catalog`} variant="secondary">
                      {effectiveSelectedRow.change.vendor_catalog_item_id}
                    </Badge>
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-obs`} variant="outline">
                      Obs {drilldownMetrics.observationCount}
                    </Badge>
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-freshness`} variant="outline">
                      Fresh {effectiveSelectedRow.freshnessDays}d
                    </Badge>
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-avg`} variant="outline">
                      Avg {formatCurrency(drilldownMetrics.averagePriceCents)}
                    </Badge>
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-minmax`} variant="outline">
                      Min/Max {formatCurrency(drilldownMetrics.minPriceCents)} / {formatCurrency(drilldownMetrics.maxPriceCents)}
                    </Badge>
                    <Badge id={`${viewId}-history-${effectiveSelectedRow.change.vendor_catalog_item_id}-volatility`} variant="outline">
                      Volatility {(drilldownMetrics.volatilityScore * 100).toFixed(2)}%
                    </Badge>
                  </div>
                  {buildSeriesTable(drilldownPoints, effectiveSelectedRow.change.vendor_catalog_item_id)}
                </CardContent>
              </Card>
            ) : (
              <Card
                id={`${viewId}-drilldown-empty`}
                className="border-border/70 bg-card/60"
                headerTitle="Drilldown not selected"
              >
                <CardContent id={`${viewId}-drilldown-empty-content`}>
                  <p className="text-sm text-muted-foreground">
                    Select an item from the ranked table to open detailed analytics.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </main>
  )
}

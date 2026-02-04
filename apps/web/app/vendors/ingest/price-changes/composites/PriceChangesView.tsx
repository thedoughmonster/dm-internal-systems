import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import {
  fetchDefaultVendorId,
  fetchPriceChanges,
  fetchPriceChangeSeries,
} from "../lib/api"
import type { PriceChangeRow, PriceChangeSeries } from "../lib/types"
import {
  DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT,
  getPriceChangeThresholdPercent,
} from "@/lib/app-settings"

const DAY_OPTIONS = [7, 14, 28, 56, 90]

function parseDays(value?: string) {
  if (!value) return 28
  const parsed = Number(value)
  return DAY_OPTIONS.includes(parsed) ? parsed : 28
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

function buildSeriesTable(series: PriceChangeSeries, itemId: string) {
  const points = series[itemId] ?? []
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
          </TableRow>
        </TableHeader>
        <TableBody id={`${tableId}-body`}>
          {points.map((point) => (
            <TableRow
              id={`${tableId}-row-${point.invoiceDate}`}
              key={point.invoiceDate}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function PriceChangesView({
  searchParams,
  baseUrl,
}: {
  searchParams?: { vendor?: string; days?: string }
  baseUrl?: string | null
}) {
  const viewId = "price-changes";
  const days = parseDays(searchParams?.days)
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

  let priceChanges: PriceChangeRow[] = []
  let series: PriceChangeSeries = {}
  let errorMessage: string | null = null
  let seriesError: string | null = null

  try {
    if (!vendorId) {
      throw new Error("No vendor available for price changes")
    }
    priceChanges = await fetchPriceChanges({
      vendorId,
      days,
      minPercentChange,
    }, baseUrl)
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unable to load price changes"
  }

  if (!errorMessage && priceChanges.length > 0) {
    try {
      series = await fetchPriceChangeSeries({
        vendorId: vendorId ?? "",
        days,
        itemIds: priceChanges.map((change) => change.vendor_catalog_item_id),
      }, baseUrl)
    } catch (error) {
      seriesError = error instanceof Error ? error.message : "Unable to load price history"
    }
  }

  const headerDescription = vendorId
    ? `Vendor ${vendorId}`
    : "Vendor selection required"

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
        headerTitle="Time range"
      >
        <CardContent id={`${viewId}-range-content`} className="flex flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            Select a window to compare invoice averages.
          </p>
          <Separator id={`${viewId}-range-separator`} />
          {DAY_OPTIONS.map((option) => (
            <Button
              key={option}
              id={`${viewId}-range-${option}`}
              asChild
              size="sm"
              variant={option === days ? "default" : "outline"}
            >
              <Link
                href={
                  vendorId
                    ? `/vendors/ingest/price-changes?vendor=${vendorId}&days=${option}`
                    : `/vendors/ingest/price-changes?days=${option}`
                }
              >
                {option} days
              </Link>
            </Button>
          ))}
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
      ) : priceChanges.length === 0 ? (
        <Card
          id={`${viewId}-empty-card`}
          className="border-border/70 bg-card/60"
          headerTitle="No price changes"
        >
          <CardContent id={`${viewId}-empty-content`}>
            <p className="text-sm text-muted-foreground">
              Nothing exceeded the threshold in this window.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card
            id={`${viewId}-changes-card`}
            className="border-border/70 bg-card/60"
            headerTitle="Changed items"
          >
            <CardContent id={`${viewId}-changes-content`}>
              <p className="text-sm text-muted-foreground">
                {priceChanges.length} items with changes above {thresholdPercent}%.
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
                      <TableHead id={`${viewId}-changes-table-head-latest`} className="p-3 text-right">
                        Latest
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-previous`} className="p-3 text-right">
                        Previous
                      </TableHead>
                      <TableHead id={`${viewId}-changes-table-head-delta`} className="p-3 text-right">
                        Delta
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody id={`${viewId}-changes-table-body`}>
                    {priceChanges.map((change) => (
                      <TableRow
                        id={`${viewId}-changes-row-${change.vendor_catalog_item_id}`}
                        key={change.vendor_catalog_item_id}
                        className="border-border/40"
                      >
                        <TableCell id={`${viewId}-changes-cell-${change.vendor_catalog_item_id}-item`} className="p-3 text-sm">
                          <div className="text-foreground">{formatPriceChangeLabel(change)}</div>
                          <div className="text-xs text-muted-foreground">
                            {change.vendor_catalog_item_id}
                          </div>
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${change.vendor_catalog_item_id}-latest`} className="p-3 text-right text-sm">
                          {formatCurrency(change.latest_price_cents)}
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${change.vendor_catalog_item_id}-previous`} className="p-3 text-right text-sm">
                          {formatCurrency(change.previous_price_cents)}
                        </TableCell>
                        <TableCell id={`${viewId}-changes-cell-${change.vendor_catalog_item_id}-delta`} className="p-3 text-right text-sm">
                          {formatSignedPercent(change.delta_percent)} ({formatSignedCurrency(change.delta_cents)})
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
            {priceChanges.map((change) => (
              <Card
                id={`${viewId}-history-${change.vendor_catalog_item_id}`}
                key={`${change.vendor_catalog_item_id}-history`}
                className="border-border/70 bg-card/60"
                headerTitle={formatPriceChangeLabel(change)}
              >
                <CardContent id={`${viewId}-history-${change.vendor_catalog_item_id}-content`} className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Latest {formatCurrency(change.latest_price_cents)} on {change.latest_invoice_date}. Previous {formatCurrency(
                      change.previous_price_cents
                    )} on {change.previous_invoice_date}.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge id={`${viewId}-history-${change.vendor_catalog_item_id}-delta`} variant="outline">
                      Delta {formatSignedPercent(change.delta_percent)}
                    </Badge>
                    <Badge id={`${viewId}-history-${change.vendor_catalog_item_id}-delta-amount`} variant="outline">
                      {formatSignedCurrency(change.delta_cents)}
                    </Badge>
                    <Badge id={`${viewId}-history-${change.vendor_catalog_item_id}-catalog`} variant="secondary">
                      {change.vendor_catalog_item_id}
                    </Badge>
                  </div>
                  {buildSeriesTable(series, change.vendor_catalog_item_id)}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  )
}

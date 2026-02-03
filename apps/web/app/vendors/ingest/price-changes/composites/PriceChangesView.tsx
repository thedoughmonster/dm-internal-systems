import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/app/settings/lib/api"

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

  return (
    <div className="overflow-x-auto rounded-md border border-border/60 bg-card/40">
      <Table>
        <TableHeader className="text-xs uppercase tracking-wide text-muted-foreground">
          <TableRow className="border-border/40">
            <TableHead className="p-2">Invoice date</TableHead>
            <TableHead className="p-2 text-right">Avg price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {points.map((point) => (
            <TableRow key={point.invoiceDate} className="border-border/40">
              <TableCell className="p-2 text-xs text-muted-foreground">
                {point.invoiceDate}
              </TableCell>
              <TableCell className="p-2 text-right text-xs font-mono">
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
          <Badge variant="outline">{headerDescription}</Badge>
          <Badge variant="secondary">Window {days} days</Badge>
          <Badge variant="outline">Min change {thresholdPercent}%</Badge>
        </div>
      </header>

      {thresholdError ? (
        <Card className="border-border/70 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Threshold setting unavailable</CardTitle>
            <CardDescription>Using the default threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive break-words">{thresholdError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 bg-card/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-sm font-medium">Time range</CardTitle>
          <CardDescription>Select a window to compare invoice averages.</CardDescription>
          <Separator />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((option) => (
            <Button
              key={option}
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
        <Card className="border-border/70 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Unable to load price changes</CardTitle>
            <CardDescription>Check Supabase connectivity and vendor data.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive break-words">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : priceChanges.length === 0 ? (
        <Card className="border-border/70 bg-card/60">
          <CardHeader>
            <CardTitle className="text-sm font-medium">No price changes</CardTitle>
            <CardDescription>Nothing exceeded the threshold in this window.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="border-border/70 bg-card/60">
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm font-medium">Changed items</CardTitle>
              <CardDescription>
                {priceChanges.length} items with changes above {thresholdPercent}%.
              </CardDescription>
              <Separator />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border/60 bg-card/40">
                <Table>
                  <TableHeader className="text-xs uppercase tracking-wide text-muted-foreground">
                    <TableRow className="border-border/40">
                      <TableHead className="p-3">Item</TableHead>
                      <TableHead className="p-3 text-right">Latest</TableHead>
                      <TableHead className="p-3 text-right">Previous</TableHead>
                      <TableHead className="p-3 text-right">Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceChanges.map((change) => (
                      <TableRow key={change.vendor_catalog_item_id} className="border-border/40">
                        <TableCell className="p-3 text-sm">
                          <div className="text-foreground">{formatPriceChangeLabel(change)}</div>
                          <div className="text-xs text-muted-foreground">
                            {change.vendor_catalog_item_id}
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-right text-sm">
                          {formatCurrency(change.latest_price_cents)}
                        </TableCell>
                        <TableCell className="p-3 text-right text-sm">
                          {formatCurrency(change.previous_price_cents)}
                        </TableCell>
                        <TableCell className="p-3 text-right text-sm">
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
            <Card className="border-border/70 bg-card/60">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Price history unavailable</CardTitle>
                <CardDescription>Series data could not be loaded.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive break-words">{seriesError}</p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4">
            {priceChanges.map((change) => (
              <Card
                key={`${change.vendor_catalog_item_id}-history`}
                className="border-border/70 bg-card/60"
              >
                <CardHeader className="space-y-2">
                  <CardTitle className="text-sm font-medium">
                    {formatPriceChangeLabel(change)}
                  </CardTitle>
                  <CardDescription>
                    Latest {formatCurrency(change.latest_price_cents)} on {change.latest_invoice_date}. Previous {formatCurrency(
                      change.previous_price_cents
                    )} on {change.previous_invoice_date}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline">Delta {formatSignedPercent(change.delta_percent)}</Badge>
                    <Badge variant="outline">{formatSignedCurrency(change.delta_cents)}</Badge>
                    <Badge variant="secondary">{change.vendor_catalog_item_id}</Badge>
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

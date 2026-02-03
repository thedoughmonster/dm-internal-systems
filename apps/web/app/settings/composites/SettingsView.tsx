"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import {
  DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT,
  savePriceChangeThresholdPercent,
} from "@/lib/app-settings"

type SettingsViewProps = {
  initialThresholdPercent: number
  loadError?: string | null
}

export default function SettingsView({
  initialThresholdPercent,
  loadError,
}: SettingsViewProps) {
  const [value, setValue] = React.useState(
    initialThresholdPercent.toString()
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const handleSave = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)

    const parsed = Number(value)
    if (!Number.isFinite(parsed)) {
      setErrorMessage("Enter a valid percent value.")
      return
    }

    if (parsed < 0 || parsed > 100) {
      setErrorMessage("Percent must be between 0 and 100.")
      return
    }

    setIsSaving(true)
    try {
      await savePriceChangeThresholdPercent(parsed)
      setSuccessMessage("Setting saved.")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save setting.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Global configuration for internal tooling.
        </p>
      </header>

      {loadError ? (
        <Card id="settings-view-load-error" className="border-border/70 bg-card/60">
          <CardHeader id="settings-view-load-error-header">
            <CardTitle id="settings-view-load-error-title" className="text-sm font-medium">
              Unable to load settings
            </CardTitle>
            <CardDescription id="settings-view-load-error-description">
              Defaults will be used until the issue is resolved.
            </CardDescription>
          </CardHeader>
          <CardContent id="settings-view-load-error-content">
            <p className="text-sm text-destructive break-words">{loadError}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card id="settings-view-vendors-card" className="border-border/70 bg-card/60">
        <CardHeader id="settings-view-vendors-header" className="space-y-2">
          <CardTitle id="settings-view-vendors-title" className="text-sm font-medium">
            Vendors
          </CardTitle>
          <CardDescription id="settings-view-vendors-description">
            Settings that apply to vendor dashboards.
          </CardDescription>
          <Separator id="settings-view-vendors-separator" />
        </CardHeader>
        <CardContent id="settings-view-vendors-content" className="space-y-4">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Label id="price-change-threshold-label" htmlFor="price-change-threshold">
                Price change % threshold
              </Label>
              <Badge id="price-change-threshold-badge" variant="outline">
                Default {DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT}%
              </Badge>
            </div>
            <Input
              id="price-change-threshold"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Alerts and dashboards only show items whose percent change meets or exceeds this threshold.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              id="price-change-threshold-save"
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving" : "Save"}
            </Button>
            {successMessage ? (
              <span className="text-xs text-emerald-400">{successMessage}</span>
            ) : null}
            {errorMessage ? (
              <span className="text-xs text-destructive">{errorMessage}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

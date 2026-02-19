"use client"

import * as React from "react"
import { SlidersHorizontal, Type } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { GlobalSidebarSlot } from "@/lib/global-sidebar-slot"

import {
  DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT,
  savePriceChangeThresholdPercent,
} from "@/lib/app-settings"

type SettingsViewProps = {
  initialThresholdPercent: number
  loadError?: string | null
}

const TITLE_FONT_OPTIONS = [
  { id: "tektur", label: "Tektur", cssVar: "--font-tektur", weights: ["400", "500", "600", "700"] },
  { id: "share-tech-mono", label: "Share Tech Mono", cssVar: "--font-share-tech-mono", weights: ["400"] },
  { id: "space-grotesk", label: "Space Grotesk", cssVar: "--font-space-grotesk", weights: ["400", "500", "600", "700"] },
  { id: "oxanium", label: "Oxanium", cssVar: "--font-oxanium", weights: ["400"] },
  { id: "orbitron", label: "Orbitron", cssVar: "--font-orbitron", weights: ["400"] },
  { id: "quantico", label: "Quantico", cssVar: "--font-quantico", weights: ["400", "700"] },
  { id: "chakra-petch", label: "Chakra Petch", cssVar: "--font-chakra-petch", weights: ["400", "600"] },
  { id: "michroma", label: "Michroma", cssVar: "--font-michroma", weights: ["400"] },
  { id: "audiowide", label: "Audiowide", cssVar: "--font-audiowide", weights: ["400"] },
] as const

const DEFAULT_TITLE_WEIGHTS = ["400", "500", "600", "700"] as const

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
  const [activeSection, setActiveSection] = React.useState("general")
  const [titleFontId, setTitleFontId] = React.useState("tektur")
  const [titleWeight, setTitleWeight] = React.useState<string>("500")
  const [titleLetterSpacing, setTitleLetterSpacing] = React.useState("0.02")
  const [typeStatus, setTypeStatus] = React.useState<string | null>(null)

  const activeFont = React.useMemo(
    () => TITLE_FONT_OPTIONS.find((option) => option.id === titleFontId),
    [titleFontId]
  )
  const availableWeights = React.useMemo<string[]>(() => {
    if (activeFont?.weights) {
      return [...activeFont.weights]
    }
    return [...DEFAULT_TITLE_WEIGHTS]
  }, [activeFont])

  React.useEffect(() => {
    if (!availableWeights.includes(titleWeight)) {
      setTitleWeight(availableWeights[0] ?? "500")
    }
  }, [availableWeights, titleWeight])

  const applyTypeSettings = React.useCallback(() => {
    const root = document.documentElement
    const body = document.body
    if (activeFont) {
      const computed = window
        .getComputedStyle(body)
        .getPropertyValue(activeFont.cssVar)
        .trim()
      const nextValue = computed || `var(${activeFont.cssVar})`
      root.style.setProperty("--title-font-family", nextValue)
      body.style.setProperty("--title-font-family", nextValue)
    }
    root.style.setProperty("--title-font-weight", titleWeight)
    root.style.setProperty("--title-letter-spacing", `${titleLetterSpacing}em`)
    body.style.setProperty("--title-font-weight", titleWeight)
    body.style.setProperty("--title-letter-spacing", `${titleLetterSpacing}em`)
    setTypeStatus("Type settings applied.")
    window.setTimeout(() => setTypeStatus(null), 2000)
  }, [activeFont, titleWeight, titleLetterSpacing])

  const SettingsSidebarHeader = React.useCallback(
    () => (
      <div className="flex h-12 items-center gap-2 border-b border-border/60 px-4">
        <SidebarTrigger id="settings-sidebar-trigger" />
        <div className="text-sm font-medium">Settings</div>
      </div>
    ),
    []
  )

  const SettingsSidebarContent = React.useCallback(
    () => (
      <div className="dm-machine-mono text-xs leading-tight">
        <Accordion
          id="settings-sidebar-accordion"
          type="single"
          collapsible
          variant="sidebar"
          value="settings"
          className="px-2"
        >
          <AccordionItem id="settings-sidebar-section" value="settings">
            <AccordionTrigger id="settings-sidebar-section-trigger">
              Settings
            </AccordionTrigger>
            <AccordionContent id="settings-sidebar-section-content">
              <SidebarMenu id="settings-sidebar-menu" className="pb-2">
                <SidebarMenuItem id="settings-sidebar-menu-general">
                  <SidebarMenuButton
                    id="settings-sidebar-menu-general-button"
                    size="sm"
                    isActive={activeSection === "general"}
                    onClick={() => setActiveSection("general")}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>General</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem id="settings-sidebar-menu-type">
                  <SidebarMenuButton
                    id="settings-sidebar-menu-type-button"
                    size="sm"
                    isActive={activeSection === "type"}
                    onClick={() => setActiveSection("type")}
                  >
                    <Type className="h-4 w-4" />
                    <span>Type</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    ),
    [activeSection]
  )

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
      <GlobalSidebarSlot
        header={SettingsSidebarHeader}
        content={SettingsSidebarContent}
      />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Global configuration for internal tooling.
        </p>
      </header>

      <div className="space-y-6">
        {loadError ? (
          <Card
            id="settings-view-load-error"
            className="border-border/70 bg-card/60"
            headerTitle="Unable to load settings"
          >
            <CardContent id="settings-view-load-error-content">
              <p className="text-sm text-muted-foreground">
                Defaults will be used until the issue is resolved.
              </p>
              <p className="text-sm text-destructive break-words">{loadError}</p>
            </CardContent>
          </Card>
        ) : null}

        {activeSection === "general" ? (
          <Card
            id="settings-view-vendors-card"
            className="border-border/70 bg-card/60"
            headerTitle="Vendors"
          >
            <CardContent id="settings-view-vendors-content" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Settings that apply to vendor dashboards.
              </p>
              <Separator id="settings-view-vendors-separator" />
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label
                    id="price-change-threshold-label"
                    htmlFor="price-change-threshold"
                  >
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
                  Alerts and dashboards only show items whose percent change meets
                  or exceeds this threshold.
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
        ) : null}

        {activeSection === "type" ? (
          <Card
            id="settings-view-type-card"
            className="border-border/70 bg-card/60"
            headerTitle="Type settings"
          >
            <CardContent id="settings-view-type-content" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adjust the title typeface and its variable settings.
              </p>
              <Separator id="settings-view-type-separator" />

              <div className="grid gap-2">
                <Label id="settings-title-font-label" htmlFor="settings-title-font">
                  Title font family
                </Label>
                <Select
                  id="settings-title-font-select"
                  value={titleFontId}
                  onValueChange={(next) => setTitleFontId(next)}
                >
                  <SelectTrigger id="settings-title-font">
                    <SelectValue id="settings-title-font-value" placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent id="settings-title-font-content">
                    {TITLE_FONT_OPTIONS.map((option) => (
                      <SelectItem
                        id={`settings-title-font-option-${option.id}`}
                        key={option.id}
                        value={option.id}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label id="settings-title-weight-label" htmlFor="settings-title-weight">
                  Title weight
                </Label>
                <Select
                  id="settings-title-weight-select"
                  value={titleWeight}
                  onValueChange={(next) => setTitleWeight(next)}
                >
                  <SelectTrigger id="settings-title-weight">
                    <SelectValue id="settings-title-weight-value" placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent id="settings-title-weight-content">
                    {availableWeights.map((weight) => (
                      <SelectItem
                        id={`settings-title-weight-option-${weight}`}
                        key={weight}
                        value={weight}
                      >
                        {weight}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label
                  id="settings-title-spacing-label"
                  htmlFor="settings-title-spacing"
                >
                  Title letter spacing (em)
                </Label>
                <Input
                  id="settings-title-spacing"
                  type="number"
                  step={0.01}
                  value={titleLetterSpacing}
                  onChange={(event) => setTitleLetterSpacing(event.target.value)}
                />
              </div>

              <div className="rounded-md border border-border/60 bg-muted/30 p-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Preview
                </div>
                <div
                  className="mt-2 text-lg text-foreground"
                  style={{
                    fontFamily: activeFont
                      ? `var(${activeFont.cssVar})`
                      : "var(--title-font-family)",
                    fontWeight: Number(titleWeight),
                    letterSpacing: `${titleLetterSpacing}em`,
                  }}
                >
                  DM Internal Systems
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  id="settings-title-apply"
                  type="button"
                  onClick={applyTypeSettings}
                >
                  Apply type settings
                </Button>
                {typeStatus ? (
                  <span className="text-xs text-emerald-400">{typeStatus}</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}

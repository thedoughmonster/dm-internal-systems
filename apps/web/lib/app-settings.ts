import { buildApiUrl } from "@/lib/api-url"

export type AppSettingRow = {
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export type PriceChangeThresholdSetting = {
  percent: number
}

export const PRICE_CHANGE_THRESHOLD_KEY = "vendors.price_change_percent_threshold"
export const DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT = 2

function parsePriceChangeThreshold(value: unknown): number | null {
  if (!value || typeof value !== "object") return null
  const percent = (value as PriceChangeThresholdSetting).percent
  if (typeof percent !== "number" || Number.isNaN(percent)) return null
  if (percent < 0) return 0
  if (percent > 100) return 100
  return percent
}

export async function fetchAppSetting(
  key: string,
  baseUrl?: string | null
): Promise<AppSettingRow | null> {
  const response = await fetch(
    buildApiUrl(`/api/app-settings?key=${encodeURIComponent(key)}`, baseUrl ?? undefined),
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to load settings with ${response.status}: ${text}`)
  }

  const row = (await response.json()) as AppSettingRow | null
  return row ?? null
}

export async function getPriceChangeThresholdPercent(
  baseUrl?: string | null
): Promise<number> {
  const setting = await fetchAppSetting(PRICE_CHANGE_THRESHOLD_KEY, baseUrl)
  const parsed = setting ? parsePriceChangeThreshold(setting.value) : null
  return parsed ?? DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT
}

export async function savePriceChangeThresholdPercent(
  percent: number,
  baseUrl?: string | null
): Promise<AppSettingRow> {
  const response = await fetch(buildApiUrl("/api/app-settings", baseUrl ?? undefined), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      key: PRICE_CHANGE_THRESHOLD_KEY,
      value: { percent },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to save setting with ${response.status}: ${text}`)
  }

  return (await response.json()) as AppSettingRow
}

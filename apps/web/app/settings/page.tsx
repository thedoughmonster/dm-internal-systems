import SettingsView from "./composites/SettingsView"
import {
  DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT,
  getPriceChangeThresholdPercent,
} from "@/lib/app-settings"
import { getServerBaseUrl } from "@/lib/server-base-url"

export default async function SettingsPage() {
  const baseUrl = await getServerBaseUrl()
  let thresholdPercent = DEFAULT_PRICE_CHANGE_THRESHOLD_PERCENT
  let loadError: string | null = null

  try {
    thresholdPercent = await getPriceChangeThresholdPercent(baseUrl)
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load settings"
  }

  return (
    <SettingsView
      initialThresholdPercent={thresholdPercent}
      loadError={loadError}
    />
  )
}

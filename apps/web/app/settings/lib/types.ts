export type AppSettingRow = {
  key: string
  value: Record<string, unknown>
  updated_at: string
}

export type PriceChangeThresholdSetting = {
  percent: number
}

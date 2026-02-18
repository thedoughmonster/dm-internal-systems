import PriceChangesView from "./composites/PriceChangesView"
import { getServerBaseUrl } from "@/lib/server-base-url"

export default async function PriceChangesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    vendor?: string
    days?: string
    granularity?: string
    sort?: string
    minObs?: string
    recent?: string
    freshness?: string
  }>
}) {
  const resolved = searchParams ? await searchParams : undefined
  const normalized = {
    ...resolved,
    days: resolved?.days ?? "90",
  }
  const baseUrl = await getServerBaseUrl()
  return <PriceChangesView searchParams={normalized} baseUrl={baseUrl} />
}

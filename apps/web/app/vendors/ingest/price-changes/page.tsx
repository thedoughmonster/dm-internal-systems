import PriceChangesView from "./composites/PriceChangesView"
import { getServerBaseUrl } from "@/lib/server-base-url"

export default async function PriceChangesPage({
  searchParams,
}: {
  searchParams?: Promise<{ vendor?: string; days?: string }>
}) {
  const resolved = searchParams ? await searchParams : undefined
  const baseUrl = await getServerBaseUrl()
  return <PriceChangesView searchParams={resolved} baseUrl={baseUrl} />
}

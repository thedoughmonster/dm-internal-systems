import { headers } from "next/headers"

export async function getServerBaseUrl() {
  const headerList = await headers()
  const proto = headerList.get("x-forwarded-proto") ?? "http"
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")

  if (!host) {
    return null
  }

  return `${proto}://${host}`
}

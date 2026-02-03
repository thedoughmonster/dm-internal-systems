export function buildApiUrl(path: string, baseUrl?: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin
    return path.startsWith("/") ? `${origin}${path}` : `${origin}/${path}`
  }

  if (baseUrl) {
    return path.startsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/${path}`
  }

  return path
}

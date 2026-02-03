import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { SessionRow } from "@/app/vendors/ingest/sessions/composites/VendorIngestSessionsView"

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

async function fetchSessions(
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<SessionRow[]> {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/vendor_ingest_sessions` +
    "?select=id,created_at,handler_id,filename,proposed,vendor_invoice_id" +
    "&order=created_at.desc&limit=50"
  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to load sessions with ${response.status}: ${text}`)
  }

  return (await response.json()) as SessionRow[]
}

async function fetchPackQueueCount(
  functionsUrl: string,
  supabaseAnonKey: string,
  internalSecret?: string
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${supabaseAnonKey}`,
    apikey: supabaseAnonKey,
    "content-type": "application/json",
  }

  if (internalSecret) {
    headers["x-internal-ui-secret"] = internalSecret
  }

  const response = await fetch(
    `${functionsUrl.replace(/\/$/, "")}/vendor_pack_unmapped_queue_v1`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ limit: 50 }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `Failed to load pack queue with ${response.status}: ${text}`
    )
  }

  const data = (await response.json()) as {
    ok?: boolean
    rows?: unknown[]
  }

  if (!data?.ok || !Array.isArray(data.rows)) {
    return 0
  }

  return data.rows.length
}

function buildTopVendors(sessions: SessionRow[]) {
  const counts = new Map<string, number>()
  sessions.forEach((session) => {
    const key = session.proposed?.vendorKey
    if (!key) return
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, count]) => `${key} — ${count} sessions`)
}

function buildRecentActivity(sessions: SessionRow[]) {
  return sessions.slice(0, 4).map((session) => {
    const vendor = session.proposed?.vendorKey ?? "Unknown vendor"
    return `${vendor} — ${session.created_at}`
  })
}

export default async function VendorsPage() {
  let sessions: SessionRow[] = []
  let sessionsError: string | null = null
  let queueCount: number | null = null
  let queueError: string | null = null

  try {
    const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL")
    const supabaseAnonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    sessions = await fetchSessions(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    sessionsError =
      error instanceof Error ? error.message : "Unable to load sessions"
  }

  try {
    const functionsUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL")
    const supabaseAnonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_UI_SHARED_SECRET
    queueCount = await fetchPackQueueCount(
      functionsUrl,
      supabaseAnonKey,
      internalSecret
    )
  } catch (error) {
    queueError =
      error instanceof Error ? error.message : "Unable to load pack queue"
  }

  const topVendors = buildTopVendors(sessions)
  const recentActivity = buildRecentActivity(sessions)
  const queueValue = queueCount ?? 0

  const metrics = [
    {
      title: "Unmatched items",
      value: queueCount === null ? "—" : `${queueValue}`,
      detail:
        queueError ??
        "Unmapped pack strings awaiting review",
      href: "/vendors/ingest/pack-mapping",
    },
    {
      title: "Ingest sessions",
      value: `${sessions.length}`,
      detail: sessionsError ?? "Latest 50 sessions",
      href: "/vendors/ingest/sessions",
    },
    {
      title: "Pack mapping queue",
      value: queueCount === null ? "—" : `${queueValue}`,
      detail: queueError ?? "Global queue",
      href: "/vendors/ingest/pack-mapping",
    },
    {
      title: "Price changes",
      value: "—",
      detail: "No data source wired yet",
      href: "/vendors/ingest",
    },
  ]

  const lists = [
    {
      title: "Top vendors by volume",
      items: topVendors.length > 0 ? topVendors : ["No session data"],
    },
    {
      title: "Recent ingest activity",
      items: recentActivity.length > 0 ? recentActivity : ["No recent sessions"],
    },
    {
      title: "Price change alerts",
      items: [
        "No data source wired yet",
      ],
    },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Operational dashboard for vendor ingest, price monitoring, and mapping.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Dashboard</Badge>
          <Button asChild variant="secondary">
            <Link href="/vendors/ingest">Open ingest</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-border/70 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-2xl font-semibold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.detail}</p>
              <Button asChild size="sm" variant="outline">
                <Link href={metric.href}>Review</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      <div className="grid gap-4 lg:grid-cols-3">
        {lists.map((list) => (
          <Card key={list.title} className="border-border/70 bg-card/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium">{list.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {list.items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 bg-card/60">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Error rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>7 day error rate: 3.4 percent (placeholder).</p>
          <p>Most impacted vendors: Redwood Imports, Copperline Dairy.</p>
        </CardContent>
      </Card>
    </main>
  )
}

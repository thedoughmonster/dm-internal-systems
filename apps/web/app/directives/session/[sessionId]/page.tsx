import Link from "next/link"
import { notFound } from "next/navigation"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

import { listSessionFileContents } from "@/app/directives/lib/directives-store"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import RefreshButton from "@/app/directives/composites/RefreshButton"

export const dynamic = "force-dynamic"
export const revalidate = 0

type SessionMarkdownPageProps = {
  params?: Promise<{
    sessionId: string
  }>
}

function stripFrontMatter(raw: string) {
  const trimmed = raw.trimStart()
  if (!trimmed.startsWith("---")) {
    return raw
  }
  const endIndex = trimmed.indexOf("\n---", 3)
  if (endIndex < 0) {
    return raw
  }
  return trimmed.slice(endIndex + 4)
}

async function renderMarkdown(raw: string) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(raw)
  return String(file)
}

export default async function SessionMarkdownPage({
  params,
}: SessionMarkdownPageProps) {
  const resolved = params ? await params : undefined
  const sessionId = resolved?.sessionId

  if (!sessionId) {
    notFound()
  }
  const entries = await listSessionFileContents(sessionId)
  const rendered = await Promise.all(
    entries.map(async (entry) => ({
      entry,
      html: await renderMarkdown(stripFrontMatter(entry.content ?? entry.body ?? "")),
    }))
  )

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Session markdown</h1>
          <p className="text-sm text-muted-foreground">Session: {sessionId}</p>
        </div>
        <Link
          href="/directives"
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          Back to directives
        </Link>
      </div>

      {rendered.map(({ entry, html }) => (
        <Card
          key={`${entry.sessionId}-${entry.filename}`}
          id={`session-markdown-${entry.sessionId}-${entry.filename}`}
          headerTitle={entry.filename}
          headerBadges={[
            <Badge
              key={`${entry.sessionId}-${entry.filename}-kind`}
              id={`session-markdown-${entry.sessionId}-${entry.filename}-kind`}
            >
              {entry.kind}
            </Badge>,
          ]}
          headerMeta={[
            <span key={`${entry.sessionId}-${entry.filename}-meta-title`}>
              Title: {entry.meta.title}
            </span>,
            <span key={`${entry.sessionId}-${entry.filename}-meta-updated`}>
              Updated: {entry.meta.updated}
            </span>,
          ]}
        >
          <CardContent id={`session-markdown-${entry.sessionId}-${entry.filename}-content`}>
            <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
              <div className="text-xs text-muted-foreground">
                <div className="dm-machine-mono text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground/70">
                  Meta
                </div>
                <dl className="mt-2 space-y-2">
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.18em]">Title</dt>
                    <dd className="text-sm text-foreground">{entry.meta.title}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.18em]">Status</dt>
                    <dd className="text-sm text-foreground">{entry.meta.status}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.18em]">Updated</dt>
                    <dd className="text-sm text-foreground">{entry.meta.updated}</dd>
                  </div>
                </dl>
              </div>
              <article
                className="dm-markdown space-y-4 text-sm leading-6 text-foreground"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <RefreshButton id="session-markdown-refresh" label="Refresh" />
    </main>
  )
}

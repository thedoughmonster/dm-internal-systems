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
import styles from "./page.module.css"

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
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Session markdown</h1>
          <p className={styles.subtitle}>Session: {sessionId}</p>
        </div>
        <Link href="/directives" className={styles.backLink}>
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
            <div className={styles.markdownContent}>
              <div className={styles.metaPanel}>
                <div className={styles.metaHeading}>Meta</div>
                <dl className={styles.metaList}>
                  <div>
                    <dt className={styles.metaTerm}>Title</dt>
                    <dd className={styles.metaValue}>{entry.meta.title}</dd>
                  </div>
                  <div>
                    <dt className={styles.metaTerm}>Status</dt>
                    <dd className={styles.metaValue}>{entry.meta.status}</dd>
                  </div>
                  <div>
                    <dt className={styles.metaTerm}>Updated</dt>
                    <dd className={styles.metaValue}>{entry.meta.updated}</dd>
                  </div>
                </dl>
              </div>
              <article
                className={styles.markdownArticle}
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

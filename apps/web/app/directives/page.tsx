import DirectivesView from "@/app/directives/composites/DirectivesView"
import styles from "./page.module.css"

export const dynamic = "force-dynamic"
export const revalidate = 0

type DirectivesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DirectivesPage({ searchParams }: DirectivesPageProps) {
  const resolved = await searchParams
  return (
    <div className={styles.page}>
      <DirectivesView searchParams={resolved} />
    </div>
  )
}

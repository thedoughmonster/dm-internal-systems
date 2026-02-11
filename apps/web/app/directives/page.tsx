import DirectivesView from "@/app/directives/composites/DirectivesView"

export const dynamic = "force-dynamic"
export const revalidate = 0

type DirectivesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DirectivesPage({ searchParams }: DirectivesPageProps) {
  const resolved = await searchParams
  return <DirectivesView searchParams={resolved} />
}

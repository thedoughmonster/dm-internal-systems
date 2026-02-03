import type { TopNavItem } from "@/lib/types/navigation"
import { componentGroups } from "@/lib/ui-kit-component-registry"

const uiKitSidebarSections = componentGroups.map((group) => ({
  id: group.id,
  title: group.title,
  items: group.components.map((component) => ({
    title: component.title,
    href: `/ui-kit/${component.slug}`,
  })),
}))

export const topNavItems: TopNavItem[] = [
  {
    id: "vendors",
    title: "Vendors",
    href: "/vendors",
    sidebarSections: [
      {
        id: "vendor-workflows",
        title: "Workflows",
        items: [
          { title: "Dashboard", href: "/vendors" },
          { title: "Vendor ingest", href: "/vendors/ingest" },
          { title: "Sessions", href: "/vendors/ingest/sessions" },
          { title: "Pack mapping", href: "/vendors/ingest/pack-mapping" },
        ],
      },
    ],
  },
  {
    id: "ui-kit",
    title: "UI kit",
    href: "/ui-kit",
    sidebarSections: [
      {
        id: "ui-kit-overview",
        title: "UI Kit",
        items: [{ title: "Overview", href: "/ui-kit" }],
      },
      ...uiKitSidebarSections,
    ],
  },
]

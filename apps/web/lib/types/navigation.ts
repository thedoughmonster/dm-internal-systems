export type NavItem = {
  title: string
  href: string
}

export type NavSection = {
  id: string
  title: string
  items: NavItem[]
}

export type TopNavItem = {
  id: string
  title: string
  href: string
  sidebarSections?: NavSection[]
}

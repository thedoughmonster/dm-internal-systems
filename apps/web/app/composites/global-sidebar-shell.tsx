"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowLeftRight,
  Boxes,
  CircleDot,
  LayoutGrid,
  ListTree,
  Settings,
  TableProperties,
  Truck,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarSeparator,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { topNavItems } from "@/lib/navigation-registry"
import {
  GlobalSidebarContext,
  type GlobalSidebarSlotValue,
} from "@/lib/global-sidebar-slot"

type GlobalSidebarShellProps = {
  children: React.ReactNode
  toggleable?: boolean
}

type HrefItem = { href: string }

const primaryNavIcons: Record<string, React.ComponentType<{ className?: string }>> =
  {
    vendors: Truck,
    "ui-kit": LayoutGrid,
  }

const sidebarItemIcons: Record<string, React.ComponentType<{ className?: string }>> =
  {
    "/vendors": LayoutGrid,
    "/vendors/ingest": Truck,
    "/vendors/ingest/sessions": TableProperties,
    "/vendors/ingest/price-changes": ArrowLeftRight,
    "/vendors/ingest/pack-mapping": Boxes,
    "/ui-kit": LayoutGrid,
    "/settings": ListTree,
  }

function routeMatches(pathname: string, href: string) {
  if (pathname === href) return true
  if (href === "/") return false
  return pathname.startsWith(`${href}/`)
}

function findBestMatch<T extends HrefItem>(pathname: string, items: T[]) {
  const matches = items.filter((item) => routeMatches(pathname, item.href))
  if (matches.length === 0) return null
  return matches.sort((a, b) => b.href.length - a.href.length)[0]
}

export default function GlobalSidebarShell({
  children,
  toggleable = true,
}: GlobalSidebarShellProps) {
  const shellId = "global-sidebar"
  const pathname = usePathname()
  const [slot, setSlot] = React.useState<GlobalSidebarSlotValue>({})
  const activeTopNav = React.useMemo(() => {
    if (!pathname) return null
    return findBestMatch(pathname, topNavItems)
  }, [pathname])
  const sidebarItems = React.useMemo(() => {
    if (!activeTopNav?.sidebarSections) return []
    return activeTopNav.sidebarSections.flatMap((section) =>
      section.items.map((item) => ({ ...item, sectionId: section.id }))
    )
  }, [activeTopNav])
  const activeSidebarItem = React.useMemo(() => {
    if (!pathname || sidebarItems.length === 0) return null
    return findBestMatch(pathname, sidebarItems)
  }, [pathname, sidebarItems])

  const headerNode =
    slot.header ? (
      <slot.header />
    ) : (
      <div className="flex h-12 items-center gap-2 border-b border-sidebar-border/80 bg-sidebar/80 px-4 backdrop-blur">
        <SidebarTrigger id={`${shellId}-trigger`} />
        <div className="dm-machine-mono text-[0.7rem] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/80">
          {activeTopNav?.title ?? "Sidebar"}
        </div>
      </div>
    )
  const defaultOpenSection =
    activeSidebarItem?.sectionId ?? activeTopNav?.sidebarSections?.[0]?.id
  const [openSection, setOpenSection] = React.useState<string | undefined>(
    defaultOpenSection
  )

  React.useEffect(() => {
    setOpenSection(defaultOpenSection)
  }, [defaultOpenSection])
  const defaultSidebarContent =
    activeTopNav?.sidebarSections && activeTopNav.sidebarSections.length > 0 ? (
      <div className="dm-machine-mono text-xs leading-tight">
        <Accordion
          id={`${shellId}-accordion`}
          type="single"
          collapsible
          variant="sidebar"
          value={openSection}
          onValueChange={setOpenSection}
          className="px-1"
        >
          {activeTopNav.sidebarSections.map((section) => (
            <AccordionItem
              id={`${shellId}-section-${section.id}-item`}
              key={section.id}
              value={section.id}
            >
              <AccordionTrigger id={`${shellId}-section-${section.id}-trigger`}>
                {section.title}
              </AccordionTrigger>
              <AccordionContent id={`${shellId}-section-${section.id}-content`}>
                <SidebarMenu
                  id={`${shellId}-section-${section.id}-menu`}
                  className="pb-3 pt-1"
                >
                  {section.items.map((item) => (
                    <SidebarMenuItem
                      id={`${shellId}-section-${section.id}-menu-item-${item.href.replace(
                        /[^a-z0-9]+/gi,
                        "-",
                      )}`}
                      key={item.href}
                    >
                      <SidebarMenuButton
                        id={`${shellId}-section-${section.id}-menu-button-${item.href.replace(
                          /[^a-z0-9]+/gi,
                          "-",
                        )}`}
                        asChild
                        size="sm"
                        tooltip={item.title}
                        isActive={item.href === activeSidebarItem?.href}
                      >
                        <Link
                          href={item.href}
                          aria-current={
                            item.href === activeSidebarItem?.href
                              ? "page"
                              : undefined
                          }
                        >
                          {React.createElement(
                            sidebarItemIcons[item.href] ?? CircleDot,
                            { className: "h-4 w-4" }
                          )}
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    ) : null

  return (
    <GlobalSidebarContext.Provider value={{ slot, setSlot }}>
      <SidebarProvider
        id={`${shellId}-provider`}
        className="mx-auto flex h-full min-h-0 w-full max-w-6xl px-4 pb-6 pt-4 md:pt-5"
      >
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-sidebar-border/80 bg-background/70 shadow-[0_14px_34px_hsl(var(--dm-color-black)/0.28)]">
          {headerNode}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <Sidebar
              id={`${shellId}-sidebar`}
              className="h-full min-h-0 md:pr-0 [&_[data-sidebar=sidebar]]:!rounded-none [&_[data-sidebar=sidebar]]:!border-0 [&_[data-sidebar=sidebar]]:!bg-transparent [&_[data-sidebar=sidebar]]:!shadow-none md:[&_[data-sidebar=sidebar]]:!border-r md:[&_[data-sidebar=sidebar]]:!border-sidebar-border/80"
              collapsible={toggleable ? "icon" : "none"}
              variant="inset"
            >
              <SidebarContent
                id={`${shellId}-content`}
                className="min-h-0 overflow-y-auto px-2 pb-3 pt-3"
              >
                <SidebarMenu id={`${shellId}-primary-menu`} className="pb-2">
                  {topNavItems.map((item) => {
                    const Icon = primaryNavIcons[item.id] ?? CircleDot
                    const isActivePrimary = item.id === activeTopNav?.id
                    return (
                      <SidebarMenuItem id={`${shellId}-primary-${item.id}`} key={item.id}>
                        <SidebarMenuButton
                          id={`${shellId}-primary-${item.id}-button`}
                          asChild
                          tooltip={item.title}
                          isActive={isActivePrimary}
                        >
                      <Link
                        href={item.href}
                        aria-current={isActivePrimary ? "page" : undefined}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
                <SidebarSeparator id={`${shellId}-primary-separator`} />
                <div className="pt-2">
                  {slot.content ? <slot.content /> : defaultSidebarContent}
                </div>
              </SidebarContent>
              <SidebarFooter
                id={`${shellId}-footer`}
                className="mt-auto border-t border-sidebar-border/80 bg-sidebar/65 p-2"
              >
                <SidebarMenu id={`${shellId}-footer-menu`}>
                  <SidebarMenuItem id={`${shellId}-footer-settings`}>
                    <SidebarMenuButton
                      id={`${shellId}-footer-settings-button`}
                      asChild
                      tooltip="Settings"
                      isActive={!!pathname && routeMatches(pathname, "/settings")}
                    >
                      <Link
                        href="/settings"
                        aria-current={
                          pathname && routeMatches(pathname, "/settings")
                            ? "page"
                            : undefined
                        }
                      >
                        <Settings className="h-4 w-4" />
                        <span className="truncate">Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              <SidebarRail id={`${shellId}-rail`} />
            </Sidebar>
            <SidebarInset
              id={`${shellId}-inset`}
              className="h-full min-h-0 overflow-hidden md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:border-0 md:peer-data-[variant=inset]:bg-transparent md:peer-data-[variant=inset]:shadow-none"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {children}
              </div>
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </GlobalSidebarContext.Provider>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
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

export default function GlobalSidebarShell({
  children,
  toggleable = true,
}: GlobalSidebarShellProps) {
  const shellId = "global-sidebar";
  const pathname = usePathname()
  const [slot, setSlot] = React.useState<GlobalSidebarSlotValue>({})
  const activeTopNav = React.useMemo(() => {
    if (!pathname) return null
    const matches = topNavItems.filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    if (matches.length === 0) return null
    return matches.sort((a, b) => b.href.length - a.href.length)[0]
  }, [pathname])

  const headerNode =
    slot.header ? (
      <slot.header />
    ) : (
      <div className="flex h-12 items-center gap-2 border-b border-border/60 px-4">
        <SidebarTrigger id={`${shellId}-trigger`} />
        <div className="text-sm font-medium">
          {activeTopNav?.title ?? "Sidebar"}
        </div>
      </div>
    )
  const defaultOpenSection = activeTopNav?.sidebarSections?.[0]?.id
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
          className="px-2"
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
                  className="pb-2"
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
                        isActive={
                          !!pathname &&
                          (pathname === item.href ||
                            pathname.startsWith(`${item.href}/`))
                        }
                      >
                        <Link href={item.href}>{item.title}</Link>
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
        className="min-h-[calc(100svh-3.5rem)]"
      >
        <Sidebar
          id={`${shellId}-sidebar`}
          className="top-14 h-[calc(100svh-3.5rem)]"
          collapsible={toggleable ? "offcanvas" : "none"}
          variant="inset"
        >
          <SidebarContent id={`${shellId}-content`}>
            {slot.content ? <slot.content /> : defaultSidebarContent}
          </SidebarContent>
          <SidebarRail id={`${shellId}-rail`} />
        </Sidebar>
        <SidebarInset id={`${shellId}-inset`}>
          {headerNode}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </GlobalSidebarContext.Provider>
  )
}

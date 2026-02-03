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

type GlobalSidebarShellProps = {
  children: React.ReactNode
  toggleable?: boolean
}

type GlobalSidebarSlotValue = {
  header?: React.ComponentType
  content?: React.ComponentType
}

type GlobalSidebarContextValue = {
  slot: GlobalSidebarSlotValue
  setSlot: React.Dispatch<React.SetStateAction<GlobalSidebarSlotValue>>
}

const slotsEqual = (
  a: GlobalSidebarSlotValue,
  b: GlobalSidebarSlotValue
) => a.header === b.header && a.content === b.content

const GlobalSidebarContext = React.createContext<GlobalSidebarContextValue | null>(
  null
)

export function GlobalSidebarSlot({ header, content }: GlobalSidebarSlotValue) {
  const context = React.useContext(GlobalSidebarContext)
  const setSlot = context?.setSlot

  React.useEffect(() => {
    const next = { header, content }
    if (!setSlot) return
    setSlot((prev) => (slotsEqual(prev, next) ? prev : next))
    return () => {
      setSlot((prev) => (slotsEqual(prev, next) ? {} : prev))
    }
  }, [setSlot, header, content])

  return null
}

export default function GlobalSidebarShell({
  children,
  toggleable = true,
}: GlobalSidebarShellProps) {
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
        <SidebarTrigger />
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
          type="single"
          collapsible
          variant="sidebar"
          value={openSection}
          onValueChange={setOpenSection}
          className="px-2"
        >
          {activeTopNav.sidebarSections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger>{section.title}</AccordionTrigger>
              <AccordionContent>
                <SidebarMenu className="pb-2">
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
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
      <SidebarProvider className="min-h-[calc(100svh-3.5rem)]">
        <Sidebar
          className="top-14 h-[calc(100svh-3.5rem)]"
          collapsible={toggleable ? "offcanvas" : "none"}
          variant="inset"
        >
          <SidebarContent>
            {slot.content ? <slot.content /> : defaultSidebarContent}
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          {headerNode}
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </GlobalSidebarContext.Provider>
  )
}

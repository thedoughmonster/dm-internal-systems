import * as React from "react"

export type GlobalSidebarSlotValue = {
  header?: React.ComponentType
  content?: React.ComponentType
}

export type GlobalSidebarContextValue = {
  slot: GlobalSidebarSlotValue
  setSlot: React.Dispatch<React.SetStateAction<GlobalSidebarSlotValue>>
}

const GlobalSidebarContext = React.createContext<GlobalSidebarContextValue | null>(
  null
)

const slotsEqual = (
  a: GlobalSidebarSlotValue,
  b: GlobalSidebarSlotValue
) => a.header === b.header && a.content === b.content

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

export { GlobalSidebarContext }

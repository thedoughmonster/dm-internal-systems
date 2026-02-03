"use client"
import type { RequireId } from "@/lib/types/component-id"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  RequireId<React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>>
>((props, ref) => <CollapsiblePrimitive.Root ref={ref} {...props} />)
Collapsible.displayName = CollapsiblePrimitive.Root.displayName

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  RequireId<
    React.ComponentPropsWithoutRef<
      typeof CollapsiblePrimitive.CollapsibleTrigger
    >
  >
>((props, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger ref={ref} {...props} />
))
CollapsibleTrigger.displayName =
  CollapsiblePrimitive.CollapsibleTrigger.displayName

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  RequireId<
    React.ComponentPropsWithoutRef<
      typeof CollapsiblePrimitive.CollapsibleContent
    >
  >
>((props, ref) => (
  <CollapsiblePrimitive.CollapsibleContent ref={ref} {...props} />
))
CollapsibleContent.displayName =
  CollapsiblePrimitive.CollapsibleContent.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }


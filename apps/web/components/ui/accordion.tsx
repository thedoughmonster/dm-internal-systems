"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import type { RequireId } from "@/lib/types/component-id"
import { cn } from "@/lib/utils"

type AccordionVariant = "default" | "sidebar"

const AccordionVariantContext = React.createContext<AccordionVariant>("default")

const useAccordionVariant = () => React.useContext(AccordionVariantContext)

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  RequireId<
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
      variant?: AccordionVariant
    }
  >
>(({ variant = "default", ...props }, ref) => (
  <AccordionVariantContext.Provider value={variant}>
    <AccordionPrimitive.Root ref={ref} {...props} />
  </AccordionVariantContext.Provider>
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  RequireId<React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>>
>(({ className, ...props }, ref) => (
  // Apply variant styles without forcing consumers to set className.
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "border-b",
      useAccordionVariant() === "sidebar" && "border-border/70",
      className
    )}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  RequireId<React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        useAccordionVariant() === "sidebar"
          ? "flex flex-1 items-center justify-between py-2 text-sm font-medium text-sidebar-foreground/80 transition-all hover:no-underline [&[data-state=open]>svg]:rotate-180"
          : "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  RequireId<React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

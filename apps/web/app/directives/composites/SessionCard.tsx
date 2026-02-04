"use client"

import * as React from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type SessionCardProps = {
  id: string
  title: string
  badges?: React.ReactNode[]
  meta?: React.ReactNode[]
  children: React.ReactNode
  className?: string
}

export default function SessionCard({
  id,
  title,
  badges = [],
  meta = [],
  children,
  className,
}: SessionCardProps) {
  const surfaceBase = "var(--card-surface-base, hsl(var(--card)))"
  const surfaceCurrent = `color-mix(in oklab, ${surfaceBase} 98%, black 2%)`
  const surfaceNext = `color-mix(in oklab, ${surfaceBase} 96%, white 4%)`
  const normalizedTitle = title.trim()
  const resolvedTitle = normalizedTitle.length > 0 ? normalizedTitle : "Untitled"

  return (
    <Accordion id={`${id}-accordion`} type="single" collapsible>
      <AccordionItem id={`${id}-item`} value={id} className="border-none">
        <div
          id={id}
          className={cn(
            "rounded-lg border text-card-foreground shadow-sm",
            "!bg-[var(--card-surface-current)]",
            className
          )}
          style={
            {
              "--card-surface-current": surfaceCurrent,
              "--card-surface-next": surfaceNext,
            } as React.CSSProperties
          }
        >
          <CardHeader id={`${id}-header`}>
            <AccordionTrigger id={`${id}-trigger`} className="py-2">
              <div className="flex w-full flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle
                    id={`${id}-title`}
                    className="dm-title"
                    style={{ fontSize: "15px" }}
                  >
                    <span>{">_"}</span> {resolvedTitle}
                  </CardTitle>
                  {badges.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {badges.slice(0, 5).map((badge, index) => (
                        <div key={`${resolvedTitle}-badge-${index}`}>{badge}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
                {meta.length > 0 ? (
                  <div className="dm-machine-mono text-[0.62rem] leading-tight text-muted-foreground/80">
                    <div className="truncate group-open:whitespace-normal group-open:break-words">
                      {meta.map((item, index) => (
                        <span key={`${resolvedTitle}-meta-${index}`}>
                          {index > 0 ? " · " : null}
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent id={`${id}-content`}>
            <div
              style={
                {
                  "--card-surface-base": "var(--card-surface-next)",
                } as React.CSSProperties
              }
            >
              <CardContent className="space-y-4">{children}</CardContent>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  )
}

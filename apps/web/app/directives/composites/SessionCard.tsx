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
import styles from "./SessionCard.module.css"

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
      <AccordionItem
        id={`${id}-item`}
        value={id}
        className={styles.accordionItem}
      >
        <div
          id={id}
          className={cn(styles.shell, className)}
          style={
            {
              "--card-surface-current": surfaceCurrent,
              "--card-surface-next": surfaceNext,
            } as React.CSSProperties
          }
        >
          <CardHeader id={`${id}-header`}>
            <div className={styles.headerRow}>
              <AccordionTrigger id={`${id}-trigger`} className={styles.trigger}>
                <div className={styles.triggerBody}>
                  <CardTitle id={`${id}-title`} className={styles.title}>
                    <span>{">_"}</span> {resolvedTitle}
                  </CardTitle>
                  {meta.length > 0 ? (
                    <div className={styles.metaRow}>
                      <div className={styles.metaText}>
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

              {badges.length > 0 ? (
                <div className={styles.badges}>
                  {badges.slice(0, 5).map((badge, index) => (
                    <div key={`${resolvedTitle}-badge-${index}`}>{badge}</div>
                  ))}
                </div>
              ) : null}
            </div>
          </CardHeader>
          <AccordionContent id={`${id}-content`}>
            <div
              style={
                {
                  "--card-surface-base": "var(--card-surface-next)",
                } as React.CSSProperties
              }
            >
              <CardContent id={`${id}-body`} className={styles.body}>
                {children}
              </CardContent>
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
    </Accordion>
  )
}

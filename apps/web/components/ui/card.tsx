import * as React from "react"
import type { ComponentIdProps, RequireId } from "@/lib/types/component-id"

import { cn } from "@/lib/utils"

type CardTitleBarProps = ComponentIdProps & {
  title: React.ReactNode
  siblingTitle?: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
}

type CardProps = RequireId<React.HTMLAttributes<HTMLDivElement>> & {
  headerTitle: string
  headerBadges?: React.ReactNode[]
  headerMeta?: React.ReactNode[]
  footerActions?: React.ReactNode[]
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      headerTitle,
      headerBadges,
      headerMeta,
      footerActions,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const surfaceBase = "var(--card-surface-base, hsl(var(--card)))"
    const surfaceCurrent = `color-mix(in oklab, ${surfaceBase} 98%, black 2%)`
    const surfaceNext = `color-mix(in oklab, ${surfaceBase} 96%, white 4%)`
    const cardId = props.id
    const badges = headerBadges ?? []
    const metaItems = headerMeta ?? []
    const footerActionItems = footerActions ?? []
    const normalizedTitle =
      typeof headerTitle === "string" ? headerTitle.trim() : ""
    const resolvedTitle = normalizedTitle.length > 0 ? normalizedTitle : "Untitled"

    if (badges.length > 5 && typeof console !== "undefined") {
      console.warn(
        `Card headerBadges length ${badges.length} exceeds the recommended maximum of 5.`
      )
    }

    if (metaItems.length > 0 && typeof console !== "undefined") {
      const headerTitleText = normalizedTitle.toLowerCase()
      metaItems.forEach((item) => {
        if (typeof item === "string") {
          const normalized = item.trim().toLowerCase()
          if (normalized === headerTitleText) {
            console.warn(
              "Card headerMeta includes the same string as headerTitle. Avoid redundant header data."
            )
          }
        }
      })
    }

    if (footerActionItems.length > 0 && typeof console !== "undefined") {
      footerActionItems.forEach((item) => {
        if (React.isValidElement(item) && item.type === "button") {
          console.warn(
            "Card footerActions should use component buttons, not raw <button> elements."
          )
        }
      })
    }

    if (normalizedTitle.length === 0 && typeof console !== "undefined") {
      console.warn("Card headerTitle is missing or empty. Using placeholder title.")
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border text-card-foreground shadow-sm",
          "!bg-[var(--card-surface-current)]",
          className
        )}
        style={
          {
            "--card-surface-current": surfaceCurrent,
            "--card-surface-next": surfaceNext,
            ...(style ?? {}),
          } as React.CSSProperties
        }
        {...props}
      >
        <CardHeader id={`${cardId}-header`}>
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle
                  id={`${cardId}-title`}
                  className="dm-title"
                  style={{ fontSize: "15px" }}
                >
                  <span>{">_"}</span>{" "}
                  {resolvedTitle}
                </CardTitle>
                {badges.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {badges.slice(0, 5).map((badge, index) => (
                      <div key={`${resolvedTitle}-badge-${index}`}>{badge}</div>
                    ))}
                  </div>
                ) : null}
              </div>
              {metaItems.length > 0 ? (
                <div className="mt-1 dm-machine-mono text-[0.62rem] leading-tight text-muted-foreground/80">
                  <div className="truncate group-open:whitespace-normal group-open:break-words">
                    {metaItems.map((item, index) => (
                      <span key={`${resolvedTitle}-meta-${index}`}>
                        {index > 0 ? " · " : null}
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </summary>
          </details>
        </CardHeader>
        <div
          style={
            {
              "--card-surface-base": "var(--card-surface-next)",
            } as React.CSSProperties
          }
        >
          {children}
        </div>
          <div className="border-t border-border/70 bg-muted/80">
            <CardFooter id={`${cardId}-footer`} className="py-3">
            {footerActionItems.length > 0 ? (
              <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:justify-end">
                {footerActionItems.map((item, index) => (
                  <div key={`${resolvedTitle}-action-${index}`}>{item}</div>
                ))}
              </div>
            ) : (
              <div className="dm-machine-mono text-[0.62rem] leading-tight text-muted-foreground/70">
                {">_ No crumbs detected"}
              </div>
            )}
          </CardFooter>
        </div>
      </div>
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  RequireId<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-1 rounded-t-lg border-b border-border/40",
      "bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card-surface-current)_98%,white_2%)_0%,color-mix(in_oklab,var(--card-surface-current)_90%,white_10%)_100%)]",
      "px-4 py-2",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  RequireId<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "dm-title text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardTitleBar = ({
  id,
  title,
  siblingTitle,
  subtitle,
  className,
}: CardTitleBarProps) => (
  <div id={id} className={cn("space-y-2", className)}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div className="dm-title truncate text-base font-semibold leading-none tracking-tight">
        {title}
      </div>
      {siblingTitle ? (
        <div className="truncate font-mono text-xs text-muted-foreground">
          {siblingTitle}
        </div>
      ) : null}
    </div>
    {subtitle ? (
      <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
    ) : null}
  </div>
)

const CardDescription = React.forwardRef<
  HTMLDivElement,
  RequireId<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  RequireId<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  RequireId<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardTitleBar,
  CardDescription,
  CardContent,
}

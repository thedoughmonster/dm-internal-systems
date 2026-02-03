import * as React from "react"
import type { ComponentIdProps, RequireId } from "@/lib/types/component-id"

import { cn } from "@/lib/utils"

type CardTitleBarProps = ComponentIdProps & {
  title: React.ReactNode
  siblingTitle?: React.ReactNode
  subtitle?: React.ReactNode
  className?: string
}

const Card = React.forwardRef<
  HTMLDivElement,
  RequireId<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  RequireId<React.HTMLAttributes<HTMLDivElement>>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
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
      "text-2xl font-semibold leading-none tracking-tight",
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
      <div className="truncate text-base font-semibold leading-none tracking-tight">
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
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
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

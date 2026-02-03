import { cn } from "@/lib/utils"
import type { RequireId } from "@/lib/types/component-id"

function Skeleton({
  className,
  ...props
}: RequireId<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }

import { Loader2Icon } from "lucide-react"
import type { RequireId } from "@/lib/types/component-id"

import { cn } from "@/lib/utils"

function Spinner({
  className,
  ...props
}: RequireId<React.ComponentProps<"svg">>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }

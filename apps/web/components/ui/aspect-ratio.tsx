import type { RequireId } from "@/lib/types/component-id"
"use client"

import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  RequireId<React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root>>
>((props, ref) => <AspectRatioPrimitive.Root ref={ref} {...props} />)
AspectRatio.displayName = AspectRatioPrimitive.Root.displayName

export { AspectRatio }

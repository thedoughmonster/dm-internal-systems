"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

type RefreshButtonProps = {
  id: string
  label?: string
}

export default function RefreshButton({ id, label = "Refresh" }: RefreshButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  return (
    <Button
      id={id}
      type="button"
      variant="secondary"
      className="fixed bottom-6 right-6 z-50 gap-2 shadow-lg"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
    >
      <RefreshCw className={isPending ? "animate-spin" : ""} />
      {label}
    </Button>
  )
}

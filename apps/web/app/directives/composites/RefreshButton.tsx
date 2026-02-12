"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import styles from "./RefreshButton.module.css"

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
      className={styles.button}
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh()
        })
      }}
    >
      <RefreshCw className={isPending ? styles.iconSpinning : undefined} />
      {label}
    </Button>
  )
}

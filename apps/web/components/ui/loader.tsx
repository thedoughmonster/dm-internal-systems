// apps/web/components/ui/loader.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoaderProps {
  label?: string;
  className?: string;
}

export function Loader({
  label = "hacker loader",
  className,
}: LoaderProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/40 p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">dm-loader</div>
      </div>

      <div className="dm-loader h-3 w-full" />
    </div>
  );
}
// apps/web/components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div
        className={cn(
          "group relative rounded-md border border-input",
          "bg-black",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04),inset_0_-1px_0_hsl(0_0%_0%/0.6),inset_0_0_0_1px_hsl(var(--neon-green)/0.10),inset_0_0_28px_hsl(var(--neon-green)/0.08)]",
          "focus-within:border-[hsl(var(--neon-green))]",
          "focus-within:shadow-[inset_0_0_0_1px_hsl(var(--neon-green)/0.28),inset_0_0_36px_hsl(var(--neon-green)/0.16),0_0_0_1px_hsl(var(--background)),0_0_0_3px_hsl(var(--neon-green)/0.35),0_0_24px_hsl(var(--neon-green)/0.25)]"
        )}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-l-md",
            "bg-[hsl(var(--border))]",
            "group-focus-within:bg-[hsl(var(--neon-green))]",
            "group-focus-within:shadow-[0_0_18px_hsl(var(--neon-green)/0.35)]"
          )}
        />

        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xs text-[hsl(var(--neon-green))] opacity-90"
        >
          $
        </span>

        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 z-10 hidden -translate-y-1/2",
            "h-[1em] w-[0.7ch] bg-[hsl(var(--neon-green))]",
            "shadow-[0_0_14px_hsl(var(--neon-green)/0.28)]",
            "group-focus-within:block",
            "animate-[dm-blink_1.05s_steps(1,end)_infinite]"
          )}
        />

        <input
          type={type}
          ref={ref}
          className={cn(
            "peer flex h-10 w-full bg-transparent text-foreground",
            "pl-8 pr-10 py-2 text-sm",
            "dm-machine-mono",
            "caret-[hsl(var(--neon-green))]",
            "placeholder:text-muted-foreground",
            "outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
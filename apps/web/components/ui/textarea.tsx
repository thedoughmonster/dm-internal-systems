// apps/web/components/ui/textarea.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Initial brightness strength.
   * 0 is faint, 1 is very bright.
   */
  crtBrightnessIntensity?: number;

  /**
   * Initial flicker strength.
   * 0 disables flicker, 1 is very dramatic.
   */
  crtFlickerIntensity?: number;
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function cssOpacity(n: number) {
  const v = Math.max(0, n);
  return v.toFixed(3);
}

/**
 * Knob mapping:
 * 0   -> bottom-left (225deg)
 * 100 -> bottom-right (315deg)
 */
const KNOB_MIN_DEG = 225;
const KNOB_MAX_DEG = 495;
const KNOB_SPAN_DEG = KNOB_MAX_DEG - KNOB_MIN_DEG;

function valueToDeg(v01: number) {
  const t = clamp01(v01);
  return KNOB_MIN_DEG + t * KNOB_SPAN_DEG;
}

function snapDetent01(v01: number) {
  // 10% increments
  const snapped = Math.round(clamp01(v01) * 10) / 10;
  return clamp01(snapped);
}

type KnobProps = {
  label: string;
  value01: number;
  onChange: (next01: number) => void;
};

function Knob({ label, value01, onChange }: KnobProps) {
  const dragRef = React.useRef<{
    active: boolean;
    startX: number;
    startValue: number;
    pointerId: number | null;
  }>({ active: false, startX: 0, startValue: 0, pointerId: null });

  const pct = Math.round(clamp01(value01) * 100);
  const deg = valueToDeg(value01);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      dragRef.current.active = true;
      dragRef.current.startX = e.clientX;
      dragRef.current.startValue = clamp01(value01);
      dragRef.current.pointerId = e.pointerId;

      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
    },
    [value01]
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return;

      // Horizontal drag model:
      // Full range across about 160px.
      const pxForFullRange = 160;
      const dx = e.clientX - dragRef.current.startX;
      const delta = dx / pxForFullRange;

      const raw = dragRef.current.startValue + delta;
      const snapped = snapDetent01(raw);

      onChange(snapped);
      e.preventDefault();
    },
    [onChange]
  );

  const endDrag = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    const pid = dragRef.current.pointerId;
    dragRef.current.pointerId = null;

    if (pid != null) {
      try {
        e.currentTarget.releasePointerCapture(pid);
      } catch {
        // no-op
      }
    }
    e.preventDefault();
  }, []);

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = 0.1;

      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        onChange(snapDetent01(value01 - step));
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        onChange(snapDetent01(value01 + step));
        e.preventDefault();
        return;
      }
      if (e.key === "Home") {
        onChange(0);
        e.preventDefault();
        return;
      }
      if (e.key === "End") {
        onChange(1);
        e.preventDefault();
        return;
      }
    },
    [onChange, value01]
  );

  // External tick marks at 0, 20, 50, 80, 100 (no numeric labels).
  const ticks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  return (
    <div className="flex items-center gap-2">
      <div className="dm-machine-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>

      <div
        role="slider"
        aria-label={`${label} intensity`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "relative h-10 w-10 select-none rounded-full border border-border",
          "bg-[radial-gradient(circle_at_30%_30%,hsl(0_0%_100%/0.06),transparent_55%),radial-gradient(circle_at_70%_70%,hsl(0_0%_0%/0.65),transparent_55%),linear-gradient(180deg,hsl(0_0%_0%/1),hsl(0_0%_0%/1))]",
          "shadow-[inset_0_0_0_1px_hsl(var(--neon-green)/0.10),inset_0_0_18px_hsl(var(--neon-green)/0.10)]",
          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--neon-green)/0.35)]",
          "cursor-ew-resize"
        )}
        style={
          {
            touchAction: "none",
          } as React.CSSProperties
        }
      >
        {/* External ticks */}
        {ticks.map((v) => {
          const a = valueToDeg(v);
          const isEndpoint = v === 0 || v === 1;

          return (
            <div
              key={`${label}-tick-${v}`}
              aria-hidden
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -50%) rotate(${a}deg)`,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  transform: "translateY(-26px)",
                  width: isEndpoint ? "3px" : "2px",
                  height: isEndpoint ? "10px" : "8px",
                  background: "hsl(var(--border))",
                  boxShadow: isEndpoint
                    ? "0 0 10px hsl(var(--neon-green) / 0.18)"
                    : "none",
                }}
              />
            </div>
          );
        })}

        {/* Hash mark that rotates around */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) rotate(${deg}deg)`,
          }}
        >
          <div
            className="h-[14px] w-[2px] rounded-full"
            style={{
              transform: "translateY(-17px)",
              background: "hsl(var(--neon-green))",
              boxShadow: "0 0 12px hsl(var(--neon-green) / 0.35)",
            }}
          />
        </div>

        {/* Center cap */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border"
          style={{
            background:
              "radial-gradient(circle_at_30%_30%, hsl(0 0% 100% / 0.07), transparent 55%), linear-gradient(180deg, hsl(0 0% 0% / 1), hsl(0 0% 0% / 1))",
            boxShadow:
              "inset 0 0 0 1px hsl(var(--neon-green) / 0.08), inset 0 0 10px hsl(var(--neon-green) / 0.10)",
          }}
        />
      </div>
    </div>
  );
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      crtBrightnessIntensity = 0.35,
      crtFlickerIntensity = 0.55,
      ...props
    },
    ref
  ) => {
    const [brightness, setBrightness] = React.useState<number>(() =>
      snapDetent01(crtBrightnessIntensity)
    );
    const [flicker, setFlicker] = React.useState<number>(() =>
      snapDetent01(crtFlickerIntensity)
    );

    React.useEffect(() => {
      setBrightness(snapDetent01(crtBrightnessIntensity));
    }, [crtBrightnessIntensity]);

    React.useEffect(() => {
      setFlicker(snapDetent01(crtFlickerIntensity));
    }, [crtFlickerIntensity]);

    const b = clamp01(brightness);
    const f = clamp01(flicker);

    // Brightness controls the baseline CRT glow and also boosts flicker visibility.
    // This is intentionally dramatic across the range.
    const glowBase = 0.01 + 0.34 * b;
    const glowFocus = 0.02 + 0.72 * b;

    // Flicker opacities are scaled by flicker, and also by brightness so 100% is intense.
    const fBoost = 0.35 + 1.25 * b;

    const oBase = (0.004 + 0.16 * f) * fBoost;
    const oLow = (0.002 + 0.10 * f) * fBoost;
    const oMid = (0.010 + 0.30 * f) * fBoost;
    const oHigh = (0.030 + 0.60 * f) * fBoost;

    const animation = f <= 0 ? "none" : "dm-crt-flicker 6.6s infinite";

    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-md border border-input",
          "bg-black",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04),inset_0_-1px_0_hsl(0_0%_0%/0.70),inset_0_0_0_1px_hsl(var(--neon-green)/0.10)]",
          "focus-within:border-[hsl(var(--neon-green))]"
        )}
        style={
          {
            ["--dm-crt-glow-base" as any]: cssOpacity(glowBase),
            ["--dm-crt-glow-focus" as any]: cssOpacity(glowFocus),

            ["--dm-crt-base" as any]: cssOpacity(oBase),
            ["--dm-crt-low" as any]: cssOpacity(oLow),
            ["--dm-crt-mid" as any]: cssOpacity(oMid),
            ["--dm-crt-high" as any]: cssOpacity(oHigh),
          } as React.CSSProperties
        }
      >
        <style jsx global>{`
          @keyframes dm-crt-flicker {
            0% {
              opacity: var(--dm-crt-base);
            }
            4% {
              opacity: var(--dm-crt-low);
            }
            7% {
              opacity: var(--dm-crt-mid);
            }
            11% {
              opacity: calc(
                var(--dm-crt-low) + (var(--dm-crt-mid) - var(--dm-crt-low)) * 0.35
              );
            }
            16% {
              opacity: var(--dm-crt-high);
            }
            19% {
              opacity: calc(
                var(--dm-crt-low) + (var(--dm-crt-mid) - var(--dm-crt-low)) * 0.15
              );
            }
            24% {
              opacity: calc(
                var(--dm-crt-mid) + (var(--dm-crt-high) - var(--dm-crt-mid)) * 0.75
              );
            }
            28% {
              opacity: var(--dm-crt-low);
            }
            33% {
              opacity: calc(
                var(--dm-crt-mid) + (var(--dm-crt-high) - var(--dm-crt-mid)) * 0.35
              );
            }
            37% {
              opacity: calc(
                var(--dm-crt-low) + (var(--dm-crt-mid) - var(--dm-crt-low)) * 0.25
              );
            }
            43% {
              opacity: calc(
                var(--dm-crt-mid) + (var(--dm-crt-high) - var(--dm-crt-mid)) * 0.95
              );
            }
            47% {
              opacity: var(--dm-crt-low);
            }
            52% {
              opacity: calc(
                var(--dm-crt-mid) + (var(--dm-crt-high) - var(--dm-crt-mid)) * 0.65
              );
            }
            58% {
              opacity: calc(
                var(--dm-crt-low) + (var(--dm-crt-mid) - var(--dm-crt-low)) * 0.45
              );
            }
            64% {
              opacity: calc(
                var(--dm-crt-mid) + (var(--dm-crt-high) - var(--dm-crt-mid)) * 0.85
              );
            }
            69% {
              opacity: var(--dm-crt-low);
            }
            75% {
              opacity: calc(
                var(--dm-crt-mid) + (var(--dm-crt-high) - var(--dm-crt-mid)) * 1.05
              );
            }
            81% {
              opacity: calc(
                var(--dm-crt-low) + (var(--dm-crt-mid) - var(--dm-crt-low)) * 0.25
              );
            }
            88% {
              opacity: calc(
                var(--dm-crt-mid) + (var(--dm-crt-high) - var(--dm-crt-mid)) * 0.75
              );
            }
            94% {
              opacity: calc(
                var(--dm-crt-low) + (var(--dm-crt-mid) - var(--dm-crt-low)) * 0.6
              );
            }
            100% {
              opacity: calc(var(--dm-crt-base) + 0.02);
            }
          }
        `}</style>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 70% at 50% 35%, hsl(var(--neon-green) / var(--dm-crt-glow-base)), transparent 62%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-focus-within:opacity-100"
          style={{
            background:
              "radial-gradient(120% 70% at 50% 35%, hsl(var(--neon-green) / var(--dm-crt-glow-focus)), transparent 60%)",
          }}
        />

        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0",
            "group-focus-within:opacity-100",
            "mix-blend-screen"
          )}
          style={{
            animation,
            background:
              "radial-gradient(90% 60% at 50% 35%, hsl(var(--neon-green)/0.14), transparent 65%)",
          }}
        />

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
          className="pointer-events-none absolute left-3 top-3 z-10 text-xs text-[hsl(var(--neon-green))] opacity-90"
        >
          $
        </span>

        <textarea
          ref={ref}
          className={cn(
            "peer relative z-10 block w-full min-h-[90px]",
            "bg-transparent text-foreground",
            "pl-8 pr-3 py-2 text-sm",
            "dm-machine-mono",
            "leading-[1.6]",
            "bg-[linear-gradient(to_bottom,transparent_95%,hsl(var(--border)/0.22)_96%)]",
            "bg-[length:100%_1.6em]",
            "group-focus-within:bg-[linear-gradient(to_bottom,transparent_95%,hsl(var(--border)/0.40)_96%)]",
            "group-focus-within:bg-[length:100%_1.6em]",
            "caret-[hsl(var(--neon-green))]",
            "placeholder:text-muted-foreground",
            "outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "transform-gpu",
            "[transform:perspective(px)_rotateX(1.5deg)_scaleY(1)_scaleX(1)]",
            "pt-20 pb-20 pl-20 pr-20",
            className
          )}
          {...props}
        />

        <div className="relative z-10 flex items-center justify-between gap-3 border-t border-border px-3 py-2">
          <div className="dm-machine-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            CRT
          </div>

          <div className="flex items-center gap-4">
            <Knob label="BRT" value01={brightness} onChange={setBrightness} />
            <Knob label="FLK" value01={flicker} onChange={setFlicker} />
          </div>
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
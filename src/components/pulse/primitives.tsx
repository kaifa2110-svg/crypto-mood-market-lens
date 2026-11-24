import { useEffect, useRef, useState } from "react";

import { coinLogo } from "@/lib/market";
import { formatPercent } from "@/lib/currency";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

export function Pct({ value, className }: { value: number; className?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 text-sm font-medium",
        up ? "text-gain" : "text-loss",
        className,
      )}
    >
      <svg viewBox="0 0 10 10" className={cn("size-2 fill-current", !up && "rotate-180")} aria-hidden>
        <path d="M5 1 9 8H1z" />
      </svg>
      {formatPercent(Math.abs(value)).replace("+", "")}
    </span>
  );
}

export function CoinLogo({ id, symbol, size = 28 }: { id: number; symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground"
        style={{ width: size, height: size }}
      >
        {symbol.slice(0, 3)}
      </span>
    );
  }
  return (
    <img
      src={coinLogo(id)}
      alt={`${symbol} logo`}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-secondary"
      style={{ width: size, height: size }}
    />
  );
}

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded-md", className)} />;
}

/** Flashes green/red when the value changes. */
export function FlashValue({ value, children }: { value: number; children: React.ReactNode }) {
  const prev = useRef(value);
  const [state, setState] = useState<{ dir: "up" | "down" | null; n: number }>({ dir: null, n: 0 });
  useEffect(() => {
    if (value !== prev.current) {
      setState((s) => ({ dir: value > prev.current ? "up" : "down", n: s.n + 1 }));
      prev.current = value;
    }
  }, [value]);
  return (
    <span
      key={state.n}
      className={cn(
        "-mx-1.5 rounded-md px-1.5 py-0.5",
        state.dir === "up" && "flash-up",
        state.dir === "down" && "flash-down",
      )}
    >
      {children}
    </span>
  );
}

/** Masks its content as •••••• while Stealth Balance Mode is on. */
export function Sensitive({ children, className }: { children: React.ReactNode; className?: string }) {
  const { settings } = useSettings();
  if (!settings.stealth) return <>{children}</>;
  return (
    <span className={cn("select-none tracking-[0.2em]", className)} aria-label="Hidden by stealth mode">
      ••••••
    </span>
  );
}

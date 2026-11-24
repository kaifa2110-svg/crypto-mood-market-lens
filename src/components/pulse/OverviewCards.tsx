import { BarChart3, Bitcoin, Globe2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Pct, Shimmer } from "@/components/pulse/primitives";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import type { MarketSnapshot } from "@/lib/market";
import { cn } from "@/lib/utils";

function Card({ children, delay, className }: { children: ReactNode; delay: number; className?: string }) {
  return (
    <div
      className={cn("panel relative overflow-hidden p-5 animate-fade-up", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function CardLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
      <span className="grid size-7 place-items-center rounded-lg bg-secondary text-primary [&_svg]:size-3.5">
        {icon}
      </span>
      {children}
    </div>
  );
}

function AnimatedMoney({ usd, currency }: { usd: number; currency: CurrencyCode }) {
  const v = useAnimatedNumber(usd);
  return <>{formatMoney(v, currency, { compact: true })}</>;
}

function FearGreedGauge({ value, label }: { value: number; label: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 80);
    return () => clearTimeout(t);
  }, [value]);
  const deg = (Math.min(100, Math.max(0, shown)) / 100) * 180 - 90;
  const tone =
    value < 25 ? "text-loss" : value < 45 ? "text-highlight" : value <= 55 ? "text-neutral-tone" : "text-gain";

  return (
    <div className="flex items-end justify-between gap-2">
      <svg viewBox="0 0 200 112" className="w-[62%] max-w-[180px]" role="img" aria-label={`Fear and Greed index ${value}, ${label}`}>
        <defs>
          <linearGradient id="fg-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--loss)" }} />
            <stop offset="30%" style={{ stopColor: "var(--highlight)" }} />
            <stop offset="50%" style={{ stopColor: "var(--neutral-tone)" }} />
            <stop offset="100%" style={{ stopColor: "var(--gain)" }} />
          </linearGradient>
        </defs>
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="var(--muted)" strokeWidth="14" strokeLinecap="round" />
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#fg-grad)" strokeWidth="14" strokeLinecap="round" opacity="0.95" />
        <g
          style={{
            transform: `rotate(${deg}deg)`,
            transformOrigin: "100px 100px",
            transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <line x1="100" y1="100" x2="100" y2="34" stroke="var(--foreground)" strokeWidth="3.5" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="8" fill="var(--foreground)" />
        <circle cx="100" cy="100" r="3.5" fill="var(--background)" />
      </svg>
      <div className="pb-1 text-right">
        <div className={cn("num text-4xl font-semibold leading-none", tone)}>{value}</div>
        <div className={cn("mt-1.5 text-sm font-medium", tone)}>{label}</div>
      </div>
    </div>
  );
}

export function OverviewCards({
  snapshot,
  currency,
}: {
  snapshot: MarketSnapshot | undefined;
  currency: CurrencyCode;
}) {
  if (!snapshot) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="panel space-y-4 p-5">
            <Shimmer className="h-7 w-40" />
            <Shimmer className="h-9 w-48" />
            <Shimmer className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }
  const g = snapshot.global;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card delay={0}>
        <CardLabel icon={<Globe2 />}>Global Market Cap</CardLabel>
        <div className="num mt-4 text-3xl font-semibold tracking-tight">
          <AnimatedMoney usd={g.totalMarketCap} currency={currency} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Pct value={g.marketCapChange24h} /> vs yesterday
        </div>
      </Card>

      <Card delay={80}>
        <CardLabel icon={<BarChart3 />}>24h Volume</CardLabel>
        <div className="num mt-4 text-3xl font-semibold tracking-tight">
          <AnimatedMoney usd={g.totalVolume24h} currency={currency} />
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Pct value={g.volumeChange24h} /> vs yesterday
        </div>
      </Card>

      <Card delay={160}>
        <CardLabel icon={<Bitcoin />}>BTC Dominance</CardLabel>
        <div className="num mt-4 text-3xl font-semibold tracking-tight">{g.btcDominance.toFixed(2)}%</div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div className="flex h-full">
            <div
              className="h-full bg-highlight transition-all duration-1000"
              style={{ width: `${g.btcDominance}%` }}
            />
            <div
              className="h-full bg-primary-glow transition-all duration-1000"
              style={{ width: `${g.ethDominance}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-highlight" />BTC</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary-glow" />ETH {g.ethDominance.toFixed(1)}%</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-muted-foreground/40" />Other</span>
        </div>
      </Card>

      <Card delay={240}>
        <CardLabel icon={<span className="text-[11px] font-bold">F&G</span>}>Fear & Greed</CardLabel>
        <div className="mt-3">
          <FearGreedGauge value={snapshot.fearGreed.value} label={snapshot.fearGreed.classification} />
        </div>
      </Card>
    </div>
  );
}

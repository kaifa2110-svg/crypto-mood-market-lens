import { ShieldCheck } from "lucide-react";

import { CoinLogo, Pct } from "@/components/pulse/primitives";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import {
  altcoinSeasonIndex, altSeasonLabel, CEX_DEX_SHARE, EXCHANGES, NEWS, sectorBreakdown, volumeLeaders,
} from "@/lib/insights";
import type { MarketSnapshot } from "@/lib/market";
import { cn } from "@/lib/utils";

const SECTOR_COLORS = ["var(--primary)", "var(--gain)", "var(--chart-3, #a78bfa)", "var(--chart-4, #f59e0b)", "var(--muted-foreground)", "var(--border)"];

export function OverviewPanel({ snapshot, currency }: { snapshot: MarketSnapshot; currency: CurrencyCode }) {
  const slices = sectorBreakdown(snapshot.coins);
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="flex h-4 overflow-hidden rounded-full bg-secondary">
        {slices.map((s, i) => (
          <div key={s.sector} style={{ width: `${s.share}%`, background: SECTOR_COLORS[i] }} title={`${s.sector} ${s.share.toFixed(1)}%`} />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slices.map((s, i) => (
          <div key={s.sector} className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="size-2.5 rounded-full" style={{ background: SECTOR_COLORS[i] }} />
              {s.sector}
              <span className="ml-auto text-xs text-muted-foreground">{s.count} coins</span>
            </div>
            <div className="num mt-2 text-xl font-semibold">{formatMoney(s.marketCap, currency, { compact: true })}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="num">{s.share.toFixed(1)}% of top 100</span>
              <Pct value={s.change24h} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AltIndexPanel({ snapshot }: { snapshot: MarketSnapshot }) {
  const v = altcoinSeasonIndex(snapshot.coins);
  const angle = -90 + (v / 100) * 180;
  return (
    <div className="flex flex-col items-center gap-4 p-6 sm:p-8">
      <svg viewBox="0 0 200 115" className="w-full max-w-sm" aria-label={`Altcoin Season Index ${v}`}>
        <defs>
          <linearGradient id="alt-g" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--chart-4, #f59e0b)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
        </defs>
        <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="var(--secondary)" strokeWidth="14" strokeLinecap="round" />
        <path d="M15 100 A85 85 0 0 1 185 100" fill="none" stroke="url(#alt-g)" strokeWidth="14" strokeLinecap="round" pathLength={100} strokeDasharray={`${v} 100`} />
        <g transform={`rotate(${angle} 100 100)`} style={{ transition: "transform .6s" }}>
          <line x1="100" y1="100" x2="100" y2="30" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="6" fill="var(--foreground)" />
      </svg>
      <div className="text-center">
        <div className="num text-5xl font-semibold">{v}<span className="text-xl text-muted-foreground">/100</span></div>
        <div className="mt-1 text-lg font-medium text-primary">{altSeasonLabel(v)}</div>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Share of the top 50 altcoins (excluding stablecoins) that outperformed Bitcoin over the last 90 days. 75+ is Altcoin Season, 25 or below is Bitcoin Season.
        </p>
      </div>
      <div className="flex w-full max-w-sm justify-between text-xs text-muted-foreground"><span>Bitcoin Season</span><span>Altcoin Season</span></div>
    </div>
  );
}

export function VolumePanel({ snapshot, currency }: { snapshot: MarketSnapshot; currency: CurrencyCode }) {
  const leaders = volumeLeaders(snapshot.coins);
  const max = leaders[0]?.volume24h || 1;
  const total = snapshot.global.totalVolume24h;
  return (
    <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-2.5">
        <div className="text-sm font-medium text-muted-foreground">24h volume leaders</div>
        {leaders.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <CoinLogo id={c.id} symbol={c.symbol} />
            <span className="w-14 text-sm font-medium">{c.symbol}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${(c.volume24h / max) * 100}%` }} />
            </div>
            <span className="num w-24 text-right text-sm">{formatMoney(c.volume24h, currency, { compact: true })}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-secondary/30 p-4">
        <div className="text-sm font-medium">CEX vs DEX</div>
        <div className="num mt-1 text-xs text-muted-foreground">Total 24h: {formatMoney(total, currency, { compact: true })}</div>
        <div className="mt-4 flex h-3 overflow-hidden rounded-full">
          <div className="bg-primary" style={{ width: `${CEX_DEX_SHARE.cex * 100}%` }} />
          <div className="bg-gain" style={{ width: `${CEX_DEX_SHARE.dex * 100}%`, background: "var(--gain)" }} />
        </div>
        {([["Centralized (CEX)", CEX_DEX_SHARE.cex, "var(--primary)"], ["Decentralized (DEX)", CEX_DEX_SHARE.dex, "var(--gain)"]] as const).map(([l, s, col]) => (
          <div key={l} className="mt-3 flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: col }} />
            {l}
            <span className="num ml-auto">{(s * 100).toFixed(0)}% · {formatMoney(total * s, currency, { compact: true })}</span>
          </div>
        ))}
        <p className="mt-4 text-xs text-muted-foreground">CEX/DEX split uses a reference ratio.</p>
      </div>
    </div>
  );
}

export function ExchangesPanel({ currency }: { currency: CurrencyCode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="px-6 py-3 text-left font-medium">#</th>
            <th className="px-3 py-3 text-left font-medium">Exchange</th>
            <th className="px-3 py-3 text-left font-medium">Type</th>
            <th className="px-3 py-3 text-left font-medium">Trust score</th>
            <th className="px-3 py-3 text-right font-medium">24h volume</th>
            <th className="px-6 py-3 text-right font-medium">Markets</th>
          </tr>
        </thead>
        <tbody>
          {[...EXCHANGES].sort((a, b) => b.trust - a.trust || b.volumeUsd - a.volumeUsd).map((e, i) => (
            <tr key={e.name} className="border-b border-border/60 last:border-0 hover:bg-secondary/40">
              <td className="num px-6 py-3 text-muted-foreground">{i + 1}</td>
              <td className="px-3 py-3 font-medium">{e.name}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">{e.kind}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={cn("size-4", e.trust >= 9 ? "text-gain" : "text-primary")} />
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-gradient-primary" style={{ width: `${e.trust * 10}%` }} />
                  </div>
                  <span className="num text-xs">{e.trust}/10</span>
                </div>
              </td>
              <td className="num px-3 py-3 text-right">{formatMoney(e.volumeUsd, currency, { compact: true })}</td>
              <td className="num px-6 py-3 text-right text-muted-foreground">{e.markets.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-6 py-3 text-xs text-muted-foreground">Exchange figures are reference values (CMC exchange data needs a paid plan).</p>
    </div>
  );
}

export function NewsPanel() {
  const tone = { Bullish: "bg-gain/15 text-gain", Bearish: "bg-loss/15 text-loss", Neutral: "bg-secondary text-muted-foreground" } as const;
  return (
    <div className="p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NEWS.map((n) => (
          <article key={n.title} className="rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/40">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{n.source} · {n.ago} ago</span>
              <span className={cn("rounded-full px-2 py-0.5 font-medium", tone[n.sentiment])}>{n.sentiment}</span>
            </div>
            <h3 className="mt-2 font-medium leading-snug">{n.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{n.summary}</p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Sample headlines for demo purposes.</p>
    </div>
  );
}

import { ArrowDown, ArrowUp, ArrowUpDown, Search, ShieldHalf, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { CoinLogo, FlashValue, Pct, Shimmer } from "@/components/pulse/primitives";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import { buildPricePath, type Coin, type MarketSnapshot } from "@/lib/market";
import { cn } from "@/lib/utils";

type SortKey = "rank" | "name" | "price" | "change1h" | "change24h" | "change7d" | "marketCap";

function Sparkline({ coin }: { coin: Coin }) {
  const { line, area } = useMemo(() => {
    const pts = buildPricePath({ ...coin, change1y: null }, 7, 42);
    const prices = pts.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Floor the range at 1% of price so stablecoins render as a calm, near-flat line.
    const range = Math.max(max - min, ((max + min) / 2) * 0.01) || 1;
    const w = 120;
    const h = 36;
    const xy = prices.map((p, i) => [(i / (prices.length - 1)) * w, h - 3 - ((p - min) / range) * (h - 6)] as const);
    const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    return { line, area: `${line} L${w} ${h} L0 ${h} Z` };
    // Shape is driven by the 7d anchors; ignore tiny live price drift.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coin.symbol, coin.change7d.toFixed(1), coin.change24h.toFixed(1)]);
  const up = coin.change7d >= 0;
  const color = up ? "var(--gain)" : "var(--loss)";
  const id = `spark-${coin.id}`;
  return (
    <svg viewBox="0 0 120 36" className="h-9 w-[120px]" aria-label={`7 day trend ${up ? "up" : "down"}`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  align = "right",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cn("px-3 py-3 font-medium", align === "right" ? "text-right" : "text-left")}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          active && "text-foreground",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className={cn("size-3", !active && "opacity-40")} />
      </button>
    </th>
  );
}

export function CoinScreener({
  snapshot,
  currency,
}: {
  snapshot: MarketSnapshot | undefined;
  currency: CurrencyCode;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"top" | "privacy">("top");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "rank", dir: "asc" });

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "rank" || key === "name" ? "asc" : "desc" },
    );

  const rows = useMemo(() => {
    if (!snapshot) return [];
    const q = query.trim().toLowerCase();
    const source = tab === "privacy" ? snapshot.privacyCoins : snapshot.coins;
    const filtered = source.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      return (a[sort.key] - b[sort.key]) * dir;
    });
  }, [snapshot, query, sort, tab]);

  return (
    <section className="panel overflow-hidden animate-fade-up" style={{ animationDelay: "200ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Live Screener</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            {tab === "privacy" ? "Privacy coins" : "Top 15 cryptocurrencies"}
          </h2>
        </div>
        <div role="tablist" aria-label="Screener filter" className="flex rounded-xl border border-border bg-secondary/40 p-1">
          {([
            { id: "top", label: "Top 15", icon: Trophy },
            { id: "privacy", label: "Privacy Coins", icon: ShieldHalf },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                tab === t.id
                  ? "bg-primary/15 text-primary shadow-glow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or symbol"
            aria-label="Search coins"
            className="h-10 w-full rounded-xl border border-input bg-secondary/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr className="border-b border-border">
              <SortHeader label="#" k="rank" sort={sort} onSort={onSort} align="left" />
              <SortHeader label="Name" k="name" sort={sort} onSort={onSort} align="left" />
              <SortHeader label="Price" k="price" sort={sort} onSort={onSort} />
              <SortHeader label="1h %" k="change1h" sort={sort} onSort={onSort} />
              <SortHeader label="24h %" k="change24h" sort={sort} onSort={onSort} />
              <SortHeader label="7d %" k="change7d" sort={sort} onSort={onSort} />
              <SortHeader label="Market Cap" k="marketCap" sort={sort} onSort={onSort} />
              <th className="px-3 py-3 pr-6 text-right font-medium">Last 7 days</th>
            </tr>
          </thead>
          <tbody>
            {!snapshot
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td colSpan={8} className="px-6 py-3.5">
                      <Shimmer className="h-7 w-full" />
                    </td>
                  </tr>
                ))
              : rows.map((c) => (
                  <tr key={c.id} className="group border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40">
                    <td className="num px-3 py-3 pl-6 text-muted-foreground">{c.rank}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <CoinLogo id={c.id} symbol={c.symbol} />
                        <div className="leading-tight">
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground">{c.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num px-3 py-3 text-right font-medium">
                      <FlashValue value={c.price}>{formatMoney(c.price, currency)}</FlashValue>
                    </td>
                    <td className="px-3 py-3 text-right"><Pct value={c.change1h} /></td>
                    <td className="px-3 py-3 text-right"><Pct value={c.change24h} /></td>
                    <td className="px-3 py-3 text-right"><Pct value={c.change7d} /></td>
                    <td className="num px-3 py-3 text-right text-muted-foreground">
                      {formatMoney(c.marketCap, currency, { compact: true })}
                    </td>
                    <td className="px-3 py-2 pr-6">
                      <div className="flex justify-end"><Sparkline coin={c} /></div>
                    </td>
                  </tr>
                ))}
            {snapshot && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  {query ? <>No coins match “{query}”.</> : "Privacy coin data isn't available right now."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

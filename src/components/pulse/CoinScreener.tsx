import { ArrowDown, ArrowUp, ArrowUpDown, BarChart3, Building2, ChevronLeft, ChevronRight, Flame, Gauge, Newspaper, PieChart, Download, Search, Star, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { AltIndexPanel, ExchangesPanel, NewsPanel, OverviewPanel, VolumePanel } from "@/components/pulse/ScreenerPanels";
import { CoinDetailModal } from "@/components/pulse/CoinDetailModal";
import { downloadCsv } from "@/lib/csv";
import { toggleWatch, topGainers, topLosers, trending } from "@/lib/insights";
import { STORAGE_PREFIX, useSettings } from "@/lib/settings";

import { CoinLogo, FlashValue, Pct, Shimmer } from "@/components/pulse/primitives";
import { convertFromUsd, formatMoney, type CurrencyCode } from "@/lib/currency";
import { buildPricePath, paginate, SCREENER_LIMIT, SCREENER_PAGE_SIZE, type Coin, type MarketSnapshot } from "@/lib/market";
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

/** Page numbers to show, with "gap" markers, e.g. 1 … 4 5 6 … 10. */
function pageList(page: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i && p - (sorted[i - 1] ?? p) > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

function Pager({
  page,
  pageCount,
  from,
  to,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-transparent px-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-35";
  return (
    <nav
      aria-label="Screener pages"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5 sm:px-6"
    >
      <p className="num text-xs text-muted-foreground">
        Showing <span className="text-foreground">{from}–{to}</span> of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className={cn(btn, "text-muted-foreground hover:border-border hover:text-foreground")}
        >
          <ChevronLeft className="size-4" />
        </button>
        {pageList(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                btn,
                "num",
                p === page
                  ? "border-primary/40 bg-primary/15 text-primary shadow-glow"
                  : "text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
          className={cn(btn, "text-muted-foreground hover:border-border hover:text-foreground")}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  );
}

type TabId = "top" | "trending" | "watchlist" | "overview" | "gainers" | "losers" | "altindex" | "volume" | "exchanges" | "news";
const WATCH_KEY = `${STORAGE_PREFIX}watchlist`;
const TABLE_TABS = new Set<TabId>(["top", "trending", "watchlist", "gainers", "losers"]);
const TABS: { id: TabId; label: string; title: string; icon: typeof Trophy }[] = [
  { id: "top", label: `Top ${SCREENER_LIMIT}`, title: `Top ${SCREENER_LIMIT} cryptocurrencies`, icon: Trophy },
  { id: "trending", label: "Trending", title: "Trending now", icon: Flame },
  { id: "watchlist", label: "Watchlist", title: "Your watchlist", icon: Star },
  { id: "overview", label: "Overview", title: "Market cap by sector", icon: PieChart },
  { id: "gainers", label: "Top Gainers", title: "Top gainers (24h)", icon: TrendingUp },
  { id: "losers", label: "Top Losers", title: "Top losers (24h)", icon: TrendingDown },
  { id: "altindex", label: "Altcoins Index", title: "Altcoin Season Index", icon: Gauge },
  { id: "volume", label: "Crypto Volume", title: "24h volume leaders", icon: BarChart3 },
  { id: "exchanges", label: "Exchanges", title: "Top crypto exchanges", icon: Building2 },
  { id: "news", label: "Latest News", title: "Latest crypto news", icon: Newspaper },
];

export function CoinScreener({
  snapshot,
  currency,
}: {
  snapshot: MarketSnapshot | undefined;
  currency: CurrencyCode;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("top");
  const [detail, setDetail] = useState<Coin | null>(null);
  const { wipeCount } = useSettings();
  const [watch, setWatch] = useState<number[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCH_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      setWatch(Array.isArray(parsed) ? parsed.filter((x): x is number => typeof x === "number") : []);
    } catch {
      setWatch([]);
    }
  }, [wipeCount]);
  const onStar = (id: number) => {
    setWatch((prev) => {
      const next = toggleWatch(prev, id);
      try {
        localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];
  const isTable = TABLE_TABS.has(tab);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "rank", dir: "asc" });
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  const onSort = (key: SortKey) => {
    setPage(1);
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "rank" || key === "name" ? "asc" : "desc" },
    );
  };

  const rows = useMemo(() => {
    if (!snapshot) return [];
    const q = query.trim().toLowerCase();
    const all = snapshot.coins;
    const source =
      tab === "trending" ? trending(all)
      : tab === "watchlist" ? all.filter((c) => watch.includes(c.id))
      : tab === "gainers" ? topGainers(all)
      : tab === "losers" ? topLosers(all)
      : all;
    // Curated tabs keep their own ranking order until the user picks a column.
    if (tab !== "top" && tab !== "watchlist" && sort.key === "rank" && !q) return source;
    const filtered = source.filter(
      (c) => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      return (a[sort.key] - b[sort.key]) * dir;
    });
  }, [snapshot, query, sort, tab, watch]);

  const view = paginate(rows, page, SCREENER_PAGE_SIZE);

  const goToPage = (p: number) => {
    setPage(p);
    // Keep the table header in view when paging from the bottom of a long list.
    const el = sectionRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section ref={sectionRef} className="panel scroll-mt-20 overflow-hidden animate-fade-up" style={{ animationDelay: "200ms" }}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Live Screener</div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            {current?.title}
          </h2>
        </div>
        {isTable && (
        <div className="flex w-full items-center gap-2 sm:w-auto">
        {tab === "watchlist" && snapshot && rows.length > 0 && (
          <button
            type="button"
            onClick={() => downloadCsv(
              [["Rank", "Name", "Symbol", `Price (${currency})`, "1h %", "24h %", "7d %", `Market Cap (${currency})`],
                ...rows.map((c) => [c.rank, c.name, c.symbol, +convertFromUsd(c.price, currency).toPrecision(8), +c.change1h.toFixed(2), +c.change24h.toFixed(2), +c.change7d.toFixed(2), Math.round(convertFromUsd(c.marketCap, currency))])],
              `cryptopulser-watchlist-${new Date().toISOString().slice(0, 10)}.csv`,
            )}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-secondary/40 px-3 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Download className="size-4" /> <span className="hidden sm:inline">Download</span> CSV
          </button>
        )}
        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or symbol  ( / )"
            aria-label="Search coins"
            id="coin-search"
            className="h-10 w-full rounded-xl border border-input bg-secondary/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
        </div>
        </div>
        )}
      </div>
      <div role="tablist" aria-label="Screener views" className="no-scrollbar flex gap-1.5 overflow-x-auto border-b border-border px-5 py-2.5 sm:px-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setPage(1);
              setSort({ key: "rank", dir: "asc" });
            }}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
              tab === t.id
                ? "border-primary/40 bg-primary/15 text-primary shadow-glow"
                : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
            {t.id === "watchlist" && watch.length > 0 && <span className="num text-xs opacity-70">{watch.length}</span>}
          </button>
        ))}
      </div>

      {!isTable && !snapshot && <div className="p-6"><Shimmer className="h-48 w-full" /></div>}
      {!isTable && snapshot && (
        <div key={tab} className="animate-fade-in">
          {tab === "overview" && <OverviewPanel snapshot={snapshot} currency={currency} />}
          {tab === "altindex" && <AltIndexPanel snapshot={snapshot} />}
          {tab === "volume" && <VolumePanel snapshot={snapshot} currency={currency} />}
          {tab === "exchanges" && <ExchangesPanel currency={currency} />}
          {tab === "news" && <NewsPanel />}
        </div>
      )}

      {isTable && (<>
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
          <tbody key={`${tab}-${view.page}`} className={cn(snapshot && "animate-fade-in")}>
            {!snapshot
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td colSpan={8} className="px-6 py-3.5">
                      <Shimmer className="h-7 w-full" />
                    </td>
                  </tr>
                ))
              : view.items.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDetail(c)}
                    className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/40"
                  >
                    <td className="num px-3 py-3 pl-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStar(c.id);
                          }}
                          aria-label={watch.includes(c.id) ? `Remove ${c.name} from watchlist` : `Add ${c.name} to watchlist`}
                          aria-pressed={watch.includes(c.id)}
                          className="rounded p-0.5 transition-transform hover:scale-110"
                        >
                          <Star className={cn("size-4", watch.includes(c.id) ? "fill-primary text-primary" : "text-muted-foreground/50 hover:text-primary")} />
                        </button>
                        {c.rank}
                      </div>
                    </td>
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
                  {query ? <>No coins match “{query}”.</> : tab === "watchlist" ? "Tap the star on any coin to add it to your watchlist." : "No coins to show right now."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {snapshot && view.pageCount > 1 && (
        <Pager
          page={view.page}
          pageCount={view.pageCount}
          from={view.from}
          to={view.to}
          total={view.total}
          onPage={goToPage}
        />
      )}
      </>)}
      <CoinDetailModal coin={detail} currency={currency} onClose={() => setDetail(null)} />
    </section>
  );
}

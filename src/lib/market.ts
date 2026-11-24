export type Coin = {
  id: number;
  rank: number;
  name: string;
  symbol: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  change90d: number;
  /** CoinMarketCap's latest listings don't include a 1-year change; filled from reference data. */
  change1y: number | null;
  marketCap: number;
  volume24h: number;
};

export type GlobalMetrics = {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
  volumeChange24h: number;
};

export type FearGreed = {
  value: number;
  classification: string;
  updatedAt: string;
};

export type MarketSnapshot = {
  coins: Coin[];
  /** Privacy-focused coins, fetched by symbol (most sit outside the top 100). */
  privacyCoins: Coin[];
  global: GlobalMetrics;
  fearGreed: FearGreed;
  source: "live" | "demo";
  fetchedAt: string;
  warnings: string[];
};

export const TIMEFRAMES = [
  { id: "7d", label: "7 Days ago", short: "7D", days: 7 },
  { id: "30d", label: "30 Days ago", short: "30D", days: 30 },
  { id: "90d", label: "90 Days ago", short: "90D", days: 90 },
  { id: "1y", label: "1 Year ago", short: "1Y", days: 365 },
] as const;

export type Timeframe = (typeof TIMEFRAMES)[number];

/** How many coins the Live Screener requests from /v1/cryptocurrency/listings/latest. */
export const SCREENER_LIMIT = 1000;
/** Rows shown per screener page. */
export const SCREENER_PAGE_SIZE = 25;

export type Page<T> = { items: T[]; page: number; pageCount: number; from: number; to: number; total: number };

/** Slices `list` into pages; out-of-range pages are clamped. `from`/`to` are 1-based for display. */
export function paginate<T>(list: T[], page: number, pageSize = SCREENER_PAGE_SIZE): Page<T> {
  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (p - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  return { items, page: p, pageCount, total, from: total ? start + 1 : 0, to: start + items.length };
}

export const PRIVACY_SYMBOLS = ["XMR", "ZEC", "DASH", "ROSE", "SCRT"] as const;

export const WHAT_IF_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "XRP", "DOGE"] as const;

const STABLES = new Set(["USDT", "USDC", "DAI", "FDUSD", "USDE", "TUSD"]);

export function coinLogo(id: number): string {
  return `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`;
}

export function changeForDays(coin: Coin, days: number): number | null {
  if (days === 0) return 0;
  if (days === 1 / 24) return coin.change1h;
  if (days === 1) return coin.change24h;
  if (days === 7) return coin.change7d;
  if (days === 30) return coin.change30d;
  if (days === 90) return coin.change90d;
  if (days === 365) return coin.change1y;
  return null;
}

/** Price `days` ago, derived from the current price and the percent change over that window. */
export function priceDaysAgo(coin: Coin, days: number): number | null {
  const ch = changeForDays(coin, days);
  if (ch == null) return null;
  return coin.price / (1 + ch / 100);
}

export type WhatIfResult = {
  units: number;
  valueUsd: number;
  profitUsd: number;
  profitPct: number;
};

export function computeWhatIf(amountUsd: number, pastPrice: number, nowPrice: number): WhatIfResult {
  if (!(amountUsd > 0) || !(pastPrice > 0)) {
    return { units: 0, valueUsd: 0, profitUsd: 0, profitPct: 0 };
  }
  const units = amountUsd / pastPrice;
  const valueUsd = units * nowPrice;
  return {
    units,
    valueUsd,
    profitUsd: valueUsd - amountUsd,
    profitPct: (nowPrice / pastPrice - 1) * 100,
  };
}

/* ---------- deterministic price paths (anchored to real % changes) ---------- */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number): number {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export type PathPoint = { daysAgo: number; price: number };

/**
 * Builds a realistic-looking price path from `horizonDays` ago to now that passes
 * exactly through every known anchor (1y/90d/30d/7d/24h/1h % changes).
 */
export function buildPricePath(coin: Coin, horizonDays: number, points = 60): PathPoint[] {
  const candidates = [365, 90, 30, 7, 1, 1 / 24, 0];
  const anchors = candidates
    .filter((d) => d <= horizonDays)
    .map((d) => ({ t: d, p: priceDaysAgo(coin, d) }))
    .filter((a): a is { t: number; p: number } => a.p != null && a.p > 0);
  if (!anchors.some((a) => a.t === horizonDays)) {
    // Unknown start: assume flat from the earliest known anchor.
    const earliest = anchors[0] ?? { t: 0, p: coin.price };
    anchors.unshift({ t: horizonDays, p: earliest.p });
  }

  const rng = mulberry32(hashString(`${coin.symbol}:${horizonDays}:${points}`));
  const vol = STABLES.has(coin.symbol) ? 0.0006 : coin.symbol === "BTC" ? 0.022 : 0.032;
  const dt = horizonDays / (points - 1);
  const stepSd = vol * Math.sqrt(dt);

  const walk: number[] = [0];
  for (let i = 1; i < points; i++) walk.push((walk[i - 1] ?? 0) + gauss(rng) * stepSd);
  const walkAt = (t: number) => {
    const x = ((horizonDays - t) / horizonDays) * (points - 1);
    const i0 = Math.floor(x);
    const i1 = Math.min(points - 1, i0 + 1);
    const f = x - i0;
    return (walk[i0] ?? 0) * (1 - f) + (walk[i1] ?? 0) * f;
  };

  const out: PathPoint[] = [];
  for (let i = 0; i < points; i++) {
    const t = horizonDays - i * dt;
    let k = 0;
    while (k < anchors.length - 2 && (anchors[k + 1]?.t ?? 0) > t) k++;
    const a0 = anchors[k]!;
    const a1 = anchors[k + 1] ?? a0;
    const span = a0.t - a1.t || 1;
    const f = Math.min(1, Math.max(0, (a0.t - t) / span));
    const base = Math.log(a0.p) * (1 - f) + Math.log(a1.p) * f;
    const bridge = walkAt(t) - (walkAt(a0.t) * (1 - f) + walkAt(a1.t) * f);
    const price = i === points - 1 ? coin.price : Math.exp(base + bridge);
    out.push({ daysAgo: Math.max(0, t), price });
  }
  return out;
}

export function fearGreedLabel(value: number): string {
  if (value < 25) return "Extreme Fear";
  if (value < 45) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 75) return "Greed";
  return "Extreme Greed";
}

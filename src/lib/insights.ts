import type { Coin } from "@/lib/market";

export const STABLECOINS = new Set(["USDT", "USDC", "DAI", "FDUSD", "USDe", "USDE", "TUSD", "PYUSD", "USDD", "USD1", "BUSD", "USDS", "FRAX"]);

export const SECTORS = ["Layer 1", "DeFi", "AI", "Memes", "Stablecoins"] as const;
export type Sector = (typeof SECTORS)[number] | "Other";

const SECTOR_SYMBOLS: Record<Exclude<Sector, "Other" | "Stablecoins">, string[]> = {
  "Layer 1": ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "TRX", "AVAX", "TON", "DOT", "LTC", "BCH", "NEAR", "APT", "SUI", "ICP", "ETC", "XLM", "HBAR", "ATOM", "ALGO", "KAS", "SEI", "XMR", "VET", "EGLD", "XTZ", "EOS", "FLOW", "MINA", "HYPE", "CRO", "OM"],
  DeFi: ["UNI", "AAVE", "LINK", "MKR", "LDO", "CRV", "INJ", "JUP", "RUNE", "PENDLE", "ENA", "COMP", "SNX", "DYDX", "CAKE", "1INCH", "ONDO", "RAY", "GMX", "JTO"],
  AI: ["FET", "RENDER", "RNDR", "TAO", "AGIX", "OCEAN", "WLD", "GRT", "AKT", "AR", "VIRTUAL", "AI16Z", "THETA", "IO"],
  Memes: ["DOGE", "SHIB", "PEPE", "WIF", "BONK", "FLOKI", "TRUMP", "POPCAT", "BRETT", "MOG", "NEIRO", "FARTCOIN", "PENGU", "SPX"],
};

export function sectorOf(symbol: string): Sector {
  if (STABLECOINS.has(symbol)) return "Stablecoins";
  for (const [s, list] of Object.entries(SECTOR_SYMBOLS)) if (list.includes(symbol)) return s as Sector;
  return "Other";
}

export type SectorSlice = { sector: Sector; marketCap: number; share: number; change24h: number; count: number };

/** Market-cap breakdown by sector; change24h is market-cap weighted. */
export function sectorBreakdown(coins: Coin[]): SectorSlice[] {
  const total = coins.reduce((s, c) => s + c.marketCap, 0) || 1;
  const map = new Map<Sector, { cap: number; w: number; n: number }>();
  for (const c of coins) {
    const s = sectorOf(c.symbol);
    const cur = map.get(s) ?? { cap: 0, w: 0, n: 0 };
    cur.cap += c.marketCap;
    cur.w += c.marketCap * c.change24h;
    cur.n += 1;
    map.set(s, cur);
  }
  return [...SECTORS, "Other" as const].map((sector) => {
    const v = map.get(sector) ?? { cap: 0, w: 0, n: 0 };
    return { sector, marketCap: v.cap, share: (v.cap / total) * 100, change24h: v.cap ? v.w / v.cap : 0, count: v.n };
  });
}

/**
 * Altcoin Season Index (0–100): share of the top 50 non-stable altcoins that beat BTC over 90 days.
 * 75+ = Altcoin Season, 25 or less = Bitcoin Season.
 */
export function altcoinSeasonIndex(coins: Coin[]): number {
  const btc = coins.find((c) => c.symbol === "BTC");
  if (!btc) return 50;
  const alts = coins.filter((c) => c.symbol !== "BTC" && !STABLECOINS.has(c.symbol)).slice(0, 50);
  if (!alts.length) return 50;
  return Math.round((alts.filter((c) => c.change90d > btc.change90d).length / alts.length) * 100);
}

export function altSeasonLabel(v: number): string {
  if (v >= 75) return "Altcoin Season";
  if (v <= 25) return "Bitcoin Season";
  return "Neutral";
}

/** Trending: biggest movers relative to size — 24h volume/market cap blended with absolute 24h change. */
export function trending(coins: Coin[], n = 20): Coin[] {
  const score = (c: Coin) => (c.marketCap ? c.volume24h / c.marketCap : 0) * 100 + Math.abs(c.change24h);
  return coins.filter((c) => !STABLECOINS.has(c.symbol)).sort((a, b) => score(b) - score(a)).slice(0, n);
}

export const topGainers = (coins: Coin[], n = 20) => [...coins].filter((c) => c.change24h > 0).sort((a, b) => b.change24h - a.change24h).slice(0, n);
export const topLosers = (coins: Coin[], n = 20) => [...coins].filter((c) => c.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, n);
export const volumeLeaders = (coins: Coin[], n = 10) => [...coins].sort((a, b) => b.volume24h - a.volume24h).slice(0, n);

export function toggleWatch(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Reference share of spot volume on centralized vs decentralized exchanges (CMC listings don't split this). */
export const CEX_DEX_SHARE = { cex: 0.82, dex: 0.18 };

export type Exchange = { name: string; trust: number; volumeUsd: number; markets: number; kind: "CEX" | "DEX" };
/** Reference figures — CMC exchange endpoints require a paid plan. */
export const EXCHANGES: Exchange[] = [
  { name: "Binance", trust: 10, volumeUsd: 18.4e9, markets: 1810, kind: "CEX" },
  { name: "Coinbase Exchange", trust: 10, volumeUsd: 3.9e9, markets: 590, kind: "CEX" },
  { name: "OKX", trust: 9, volumeUsd: 3.2e9, markets: 820, kind: "CEX" },
  { name: "Bybit", trust: 9, volumeUsd: 3.6e9, markets: 1050, kind: "CEX" },
  { name: "Kraken", trust: 9, volumeUsd: 1.4e9, markets: 1020, kind: "CEX" },
  { name: "Bitget", trust: 8, volumeUsd: 2.1e9, markets: 950, kind: "CEX" },
  { name: "KuCoin", trust: 8, volumeUsd: 1.1e9, markets: 1260, kind: "CEX" },
  { name: "Gate.io", trust: 8, volumeUsd: 1.6e9, markets: 3900, kind: "CEX" },
  { name: "Uniswap v3", trust: 8, volumeUsd: 1.9e9, markets: 1400, kind: "DEX" },
  { name: "Raydium", trust: 7, volumeUsd: 1.2e9, markets: 2100, kind: "DEX" },
];

export type NewsItem = { title: string; summary: string; source: string; ago: string; sentiment: "Bullish" | "Bearish" | "Neutral" };
/** Sample headlines for the demo — not live news. */
export const NEWS: NewsItem[] = [
  { title: "Spot Bitcoin ETFs log fifth straight day of net inflows", summary: "Institutional demand keeps rising as combined ETF holdings hit a new high.", source: "Market Desk", ago: "1h", sentiment: "Bullish" },
  { title: "Ethereum gas fees drop to multi-year lows after network upgrade", summary: "Layer 2 activity climbs while mainnet congestion eases.", source: "Chain Watch", ago: "3h", sentiment: "Bullish" },
  { title: "Regulators propose stricter rules for offshore exchanges", summary: "New reporting requirements could pressure smaller trading venues.", source: "Policy Wire", ago: "5h", sentiment: "Bearish" },
  { title: "Memecoin volumes cool as traders rotate into AI tokens", summary: "AI-sector market cap gains while memecoin open interest falls.", source: "Sector Pulse", ago: "7h", sentiment: "Neutral" },
  { title: "Large whale transfers BTC to exchanges, sparking sell-off fears", summary: "On-chain trackers flag sizeable deposits ahead of the weekly close.", source: "On-Chain Daily", ago: "9h", sentiment: "Bearish" },
  { title: "Solana DeFi TVL climbs to record as new DEX launches", summary: "Liquidity incentives draw users back to the Solana ecosystem.", source: "DeFi Brief", ago: "12h", sentiment: "Bullish" },
];

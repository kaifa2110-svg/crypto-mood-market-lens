import type { Coin, MarketSnapshot } from "./market";
import { fearGreedLabel } from "./market";

type Base = Omit<Coin, "rank">;

// Realistic reference snapshot used for demo mode and for 1-year changes in live mode.
const BASE_COINS: Base[] = [
  { id: 1, name: "Bitcoin", symbol: "BTC", price: 97420, change1h: 0.21, change24h: 1.84, change7d: 4.62, change30d: 12.4, change90d: 38.5, change1y: 162.0, marketCap: 1.928e12, volume24h: 48.2e9 },
  { id: 1027, name: "Ethereum", symbol: "ETH", price: 3486, change1h: -0.12, change24h: 2.41, change7d: 8.9, change30d: 31.2, change90d: 42.0, change1y: 72.0, marketCap: 420.1e9, volume24h: 28.4e9 },
  { id: 825, name: "Tether", symbol: "USDT", price: 1.0002, change1h: 0.01, change24h: -0.02, change7d: 0.03, change30d: 0.01, change90d: 0.02, change1y: 0.05, marketCap: 132.4e9, volume24h: 72.1e9 },
  { id: 52, name: "XRP", symbol: "XRP", price: 2.41, change1h: 0.45, change24h: 6.82, change7d: 38.1, change30d: 182.0, change90d: 310.0, change1y: 288.0, marketCap: 138.2e9, volume24h: 9.8e9 },
  { id: 1839, name: "BNB", symbol: "BNB", price: 672.4, change1h: 0.08, change24h: 1.12, change7d: 3.4, change30d: 12.8, change90d: 24.5, change1y: 168.0, marketCap: 97.1e9, volume24h: 2.1e9 },
  { id: 5426, name: "Solana", symbol: "SOL", price: 241.3, change1h: 0.34, change24h: 3.21, change7d: 9.75, change30d: 42.6, change90d: 71.8, change1y: 302.0, marketCap: 114.6e9, volume24h: 5.6e9 },
  { id: 3408, name: "USDC", symbol: "USDC", price: 0.9999, change1h: 0.0, change24h: 0.01, change7d: -0.01, change30d: 0.0, change90d: 0.01, change1y: 0.0, marketCap: 39.2e9, volume24h: 8.2e9 },
  { id: 74, name: "Dogecoin", symbol: "DOGE", price: 0.4012, change1h: 0.62, change24h: 4.85, change7d: 11.2, change30d: 148.5, change90d: 290.2, change1y: 414.0, marketCap: 59.1e9, volume24h: 6.3e9 },
  { id: 2010, name: "Cardano", symbol: "ADA", price: 1.06, change1h: 0.5, change24h: 5.4, change7d: 22.1, change30d: 205.8, change90d: 220.0, change1y: 175.0, marketCap: 37.2e9, volume24h: 2.4e9 },
  { id: 1958, name: "TRON", symbol: "TRX", price: 0.2061, change1h: -0.05, change24h: 0.62, change7d: 2.8, change30d: 23.4, change90d: 35.0, change1y: 98.0, marketCap: 17.8e9, volume24h: 0.9e9 },
  { id: 5805, name: "Avalanche", symbol: "AVAX", price: 44.12, change1h: 0.31, change24h: 3.9, change7d: 14.6, change30d: 68.2, change90d: 82.5, change1y: 105.0, marketCap: 18.1e9, volume24h: 1.1e9 },
  { id: 11419, name: "Toncoin", symbol: "TON", price: 6.12, change1h: -0.2, change24h: 1.1, change7d: 5.2, change30d: 12.0, change90d: -8.4, change1y: 168.0, marketCap: 15.6e9, volume24h: 0.48e9 },
  { id: 5994, name: "Shiba Inu", symbol: "SHIB", price: 0.00002612, change1h: 0.22, change24h: 2.9, change7d: 4.7, change30d: 52.1, change90d: 88.0, change1y: 205.0, marketCap: 15.4e9, volume24h: 1.4e9 },
  { id: 1975, name: "Chainlink", symbol: "LINK", price: 23.48, change1h: 0.52, change24h: 4.6, change7d: 34.2, change30d: 98.0, change90d: 120.0, change1y: 62.0, marketCap: 14.7e9, volume24h: 1.2e9 },
  { id: 20947, name: "Sui", symbol: "SUI", price: 3.62, change1h: 0.95, change24h: 7.8, change7d: 12.5, change30d: 72.0, change90d: 510.0, change1y: 520.0, marketCap: 10.5e9, volume24h: 1.6e9 },
];

export const REFERENCE_1Y_CHANGE: Record<string, number> = Object.fromEntries(
  BASE_COINS.map((c) => [c.symbol, c.change1y ?? 0]),
);

/** Fresh demo snapshot with tiny random drift so the dashboard feels live. */
export function getDemoSnapshot(): MarketSnapshot {
  const drift = () => 1 + (Math.random() - 0.5) * 0.004;
  const coins: Coin[] = BASE_COINS.map((c, i) => {
    const stable = c.symbol === "USDT" || c.symbol === "USDC";
    const m = stable ? 1 + (Math.random() - 0.5) * 0.0002 : drift();
    const pct = (m - 1) * 100;
    return {
      ...c,
      rank: i + 1,
      price: c.price * m,
      marketCap: c.marketCap * m,
      change1h: c.change1h + pct,
      change24h: c.change24h + pct,
      volume24h: c.volume24h * (1 + (Math.random() - 0.5) * 0.01),
    };
  });
  const totalMarketCap = 3.41e12 * drift();
  const btc = coins[0]!;
  const fg = Math.round(72 + (Math.random() - 0.5) * 2);
  return {
    coins,
    global: {
      totalMarketCap,
      totalVolume24h: 168.4e9 * drift(),
      btcDominance: (btc.marketCap / totalMarketCap) * 100,
      ethDominance: ((coins[1]?.marketCap ?? 0) / totalMarketCap) * 100,
      marketCapChange24h: 2.14 + (Math.random() - 0.5) * 0.1,
      volumeChange24h: -6.2 + (Math.random() - 0.5) * 0.2,
    },
    fearGreed: { value: fg, classification: fearGreedLabel(fg), updatedAt: new Date().toISOString() },
    source: "demo",
    fetchedAt: new Date().toISOString(),
    warnings: [],
  };
}

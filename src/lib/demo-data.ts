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

// Ranks 16–100 for the demo screener: [CMC id, name, symbol, price USD, market cap USD].
// Percent changes for these are generated deterministically (see expandCoin).
const MORE_COINS: [number, string, string, number, number][] = [
  [512, "Stellar", "XLM", 0.4521, 13.6e9],
  [4642, "Hedera", "HBAR", 0.2894, 11.0e9],
  [6636, "Polkadot", "DOT", 8.92, 13.5e9],
  [1831, "Bitcoin Cash", "BCH", 482.6, 9.55e9],
  [2, "Litecoin", "LTC", 118.4, 8.92e9],
  [3957, "UNUS SED LEO", "LEO", 9.12, 8.44e9],
  [7083, "Uniswap", "UNI", 13.84, 8.31e9],
  [24478, "Pepe", "PEPE", 0.00001942, 8.17e9],
  [6535, "NEAR Protocol", "NEAR", 6.42, 7.86e9],
  [32196, "Hyperliquid", "HYPE", 22.9, 7.64e9],
  [21794, "Aptos", "APT", 12.48, 6.95e9],
  [8916, "Internet Computer", "ICP", 12.86, 6.08e9],
  [4943, "Dai", "DAI", 0.9998, 5.36e9],
  [1321, "Ethereum Classic", "ETC", 34.12, 5.14e9],
  [29470, "Ethena USDe", "USDE", 1.0004, 5.02e9],
  [328, "Monero", "XMR", 162.4, 2.99e9],
  [5690, "Render", "RENDER", 9.21, 4.77e9],
  [3635, "Cronos", "CRO", 0.1782, 4.71e9],
  [28321, "POL (ex-MATIC)", "POL", 0.6124, 4.68e9],
  [20396, "Kaspa", "KAS", 0.1802, 4.55e9],
  [22974, "Bittensor", "TAO", 598.2, 4.41e9],
  [11841, "Arbitrum", "ARB", 1.04, 4.33e9],
  [3794, "Cosmos Hub", "ATOM", 10.62, 4.15e9],
  [2280, "Filecoin", "FIL", 6.62, 4.02e9],
  [4030, "Algorand", "ALGO", 0.4682, 3.88e9],
  [3897, "OKB", "OKB", 56.4, 3.38e9],
  [4847, "Stacks", "STX", 2.26, 3.39e9],
  [3077, "VeChain", "VET", 0.0468, 3.79e9],
  [30171, "Ethena", "ENA", 1.12, 3.24e9],
  [11092, "Bitget Token", "BGB", 2.31, 3.23e9],
  [11840, "Optimism", "OP", 2.38, 3.12e9],
  [26081, "First Digital USD", "FDUSD", 0.9996, 3.05e9],
  [7226, "Injective", "INJ", 29.8, 2.91e9],
  [27075, "Mantle", "MNT", 0.8412, 2.82e9],
  [10603, "Immutable", "IMX", 1.64, 2.76e9],
  [6719, "The Graph", "GRT", 0.2812, 2.69e9],
  [3513, "Fantom", "FTM", 0.9412, 2.64e9],
  [7278, "Aave", "AAVE", 172.4, 2.58e9],
  [23095, "Bonk", "BONK", 0.00003512, 2.52e9],
  [28752, "dogwifhat", "WIF", 2.48, 2.48e9],
  [2416, "Theta Network", "THETA", 2.41, 2.41e9],
  [23149, "Sei", "SEI", 0.6012, 2.35e9],
  [1518, "Maker", "MKR", 2481, 2.29e9],
  [21159, "Ondo", "ONDO", 1.42, 2.24e9],
  [10804, "FLOKI", "FLOKI", 0.000226, 2.18e9],
  [8000, "Lido DAO", "LDO", 2.08, 1.86e9],
  [29210, "Jupiter", "JUP", 1.24, 1.68e9],
  [4157, "THORChain", "RUNE", 5.62, 1.88e9],
  [5632, "Arweave", "AR", 21.8, 1.43e9],
  [22861, "Celestia", "TIA", 6.92, 1.47e9],
  [3602, "Bitcoin SV", "BSV", 68.2, 1.35e9],
  [4558, "Flow", "FLOW", 0.8612, 1.33e9],
  [7080, "GALA", "GALA", 0.0412, 1.62e9],
  [6210, "The Sandbox", "SAND", 0.6824, 1.62e9],
  [13502, "Worldcoin", "WLD", 2.61, 1.59e9],
  [28177, "Pyth Network", "PYTH", 0.4412, 1.58e9],
  [3773, "Artificial Superintelligence Alliance", "FET", 1.42, 3.66e9],
  [1966, "Decentraland", "MANA", 0.6624, 1.27e9],
  [6892, "MultiversX", "EGLD", 38.1, 1.04e9],
  [1765, "EOS", "EOS", 0.9821, 1.49e9],
  [2011, "Tezos", "XTZ", 1.38, 1.42e9],
  [6783, "Axie Infinity", "AXS", 7.82, 1.18e9],
  [3155, "Quant", "QNT", 121.6, 1.47e9],
  [1720, "IOTA", "IOTA", 0.3341, 1.12e9],
  [1376, "Neo", "NEO", 16.4, 1.16e9],
  [6538, "Curve DAO Token", "CRV", 0.8912, 1.12e9],
  [4066, "Chiliz", "CHZ", 0.1012, 0.92e9],
  [5665, "Helium", "HNT", 6.42, 1.11e9],
  [2087, "KuCoin Token", "KCS", 11.2, 1.36e9],
  [4269, "GateToken", "GT", 11.8, 1.06e9],
  [10791, "eCash", "XEC", 0.0000452, 0.89e9],
  [7334, "Conflux", "CFX", 0.1912, 0.94e9],
  [7186, "PancakeSwap", "CAKE", 2.82, 0.81e9],
  [8526, "Raydium", "RAY", 5.62, 1.64e9],
  [8425, "JasmyCoin", "JASMY", 0.0412, 2.02e9],
  [22691, "Starknet", "STRK", 0.6124, 1.21e9],
  [7431, "Akash Network", "AKT", 3.92, 0.97e9],
  [28850, "Notcoin", "NOT", 0.0082, 0.84e9],
  [29743, "Brett", "BRETT", 0.1712, 1.69e9],
  [28782, "Popcat", "POPCAT", 1.38, 1.35e9],
  [13855, "Ethereum Name Service", "ENS", 38.2, 1.28e9],
  [9481, "Pendle", "PENDLE", 5.41, 0.88e9],
  [5692, "Compound", "COMP", 84.6, 0.79e9],
  [5176, "Tether Gold", "XAUT", 2652, 0.95e9],
  [1437, "Zcash", "ZEC", 52.3, 0.85e9],
];

const FLAT = new Set(["USDT", "USDC", "DAI", "USDE", "FDUSD", "XAUT"]);

/** Deterministic pseudo-random changes so the demo table is stable between refreshes. */
function expandCoin([id, name, symbol, price, marketCap]: (typeof MORE_COINS)[number]): Base {
  let seed = Math.imul(id, 2654435761) | 0;
  const rnd = () => {
    seed = Math.imul(seed ^ (seed >>> 13), 1274126177);
    seed ^= seed >>> 16;
    return ((seed >>> 0) % 10000) / 10000 - 0.5; // -0.5 .. 0.5
  };
  const k = FLAT.has(symbol) ? 0.02 : 1;
  const r = (spread: number, bias = 0) => Math.round((bias + rnd() * spread) * k * 100) / 100;
  return {
    id, name, symbol, price, marketCap,
    change1h: r(1.6),
    change24h: r(10, 1.5),
    change7d: r(30, 5),
    change30d: r(90, 20),
    change90d: r(180, 40),
    change1y: r(240, 60),
    volume24h: marketCap * (0.03 + (rnd() + 0.5) * 0.12),
  };
}


const PRIVACY_COINS: Coin[] = [
  { id: 328, rank: 27, name: "Monero", symbol: "XMR", price: 162.4, change1h: 0.18, change24h: 1.42, change7d: 3.9, change30d: 11.6, change90d: 4.2, change1y: 12.0, marketCap: 2.99e9, volume24h: 78e6 },
  { id: 1437, rank: 98, name: "Zcash", symbol: "ZEC", price: 52.3, change1h: 0.41, change24h: 3.8, change7d: 12.4, change30d: 38.0, change90d: 61.0, change1y: 85.0, marketCap: 0.85e9, volume24h: 112e6 },
  { id: 131, rank: 132, name: "Dash", symbol: "DASH", price: 38.12, change1h: -0.11, change24h: 2.1, change7d: 9.6, change30d: 52.0, change90d: 48.0, change1y: 22.0, marketCap: 0.46e9, volume24h: 64e6 },
  { id: 7653, rank: 151, name: "Oasis", symbol: "ROSE", price: 0.0982, change1h: 0.33, change24h: 4.6, change7d: -2.4, change30d: 41.0, change90d: 63.0, change1y: 44.0, marketCap: 0.66e9, volume24h: 41e6 },
  { id: 5604, rank: 312, name: "Secret", symbol: "SCRT", price: 0.524, change1h: 0.05, change24h: -1.3, change7d: 6.1, change30d: 28.0, change90d: 70.0, change1y: 31.0, marketCap: 0.15e9, volume24h: 9e6 },
];

// Privacy coins that sit inside the top 100 reuse their hand-written figures so both tabs agree.
const ALL_COINS: Base[] = [
  ...BASE_COINS,
  ...MORE_COINS.map((row) => {
    const known = PRIVACY_COINS.find((p) => p.symbol === row[2]);
    if (!known) return expandCoin(row);
    const { rank: _rank, ...rest } = known;
    return rest;
  }),
].sort((a, b) => b.marketCap - a.marketCap);

// Pad demo mode out to the same 1,000 rows live mode returns: deterministic synthetic
// long-tail coins below the ~hand-written top 100.
function syntheticCoins(count: number): Base[] {
  const out: Base[] = [];
  for (let i = 0; i < count; i++) {
    const n = i + 1;
    const id = 900000 + n;
    const symbol = `D${(n * 7919 % 46656).toString(36).toUpperCase().padStart(3, "0")}`;
    let seed = Math.imul(id, 374761393) | 0;
    const rnd = () => {
      seed = Math.imul(seed ^ (seed >>> 13), 1274126177);
      seed ^= seed >>> 16;
      return ((seed >>> 0) % 10000) / 10000;
    };
    // Cap positions decay smoothly from ~$100M to ~$60k.
    const marketCap = 1.05e8 * Math.pow(60000 / 1.05e8, n / count) * (0.85 + rnd() * 0.3);
    const price = marketCap / (5e5 + rnd() * 5e8);
    out.push({
      id,
      name: `Demo Token ${n}`,
      symbol,
      price,
      marketCap,
      change1h: Math.round((rnd() - 0.5) * 2 * 100) / 100,
      change24h: Math.round((rnd() * 12 - 5) * 100) / 100,
      change7d: Math.round((rnd() * 40 - 16) * 100) / 100,
      change30d: Math.round((rnd() * 120 - 40) * 100) / 100,
      change90d: Math.round((rnd() * 240 - 80) * 100) / 100,
      change1y: Math.round((rnd() * 360 - 120) * 100) / 100,
      volume24h: marketCap * (0.005 + rnd() * 0.09),
    });
  }
  return out;
}

const SYNTHETIC = syntheticCoins(Math.max(0, 1000 - ALL_COINS.length));
const FULL_DEMO_LIST: Base[] = [...ALL_COINS, ...SYNTHETIC];

export const REFERENCE_1Y_CHANGE: Record<string, number> = Object.fromEntries(
  BASE_COINS.map((c) => [c.symbol, c.change1y ?? 0]),
);

/** Fresh demo snapshot with tiny random drift so the dashboard feels live. */
export function getDemoSnapshot(): MarketSnapshot {
  const drift = () => 1 + (Math.random() - 0.5) * 0.004;
  const coins: Coin[] = FULL_DEMO_LIST.map((c, i) => {
    const stable = FLAT.has(c.symbol);
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
  const privacyCoins: Coin[] = PRIVACY_COINS.map((c) => {
    const inTop = coins.find((x) => x.symbol === c.symbol);
    if (inTop) return inTop;
    const m = drift();
    const pct = (m - 1) * 100;
    return { ...c, price: c.price * m, marketCap: c.marketCap * m, change1h: c.change1h + pct, change24h: c.change24h + pct };
  });
  return {
    coins,
    privacyCoins,
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

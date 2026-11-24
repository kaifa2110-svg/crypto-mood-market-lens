import { describe, expect, it } from "vitest";
import { altcoinSeasonIndex, sectorOf, toggleWatch, topGainers, topLosers } from "@/lib/insights";
import type { Coin } from "@/lib/market";

const coin = (symbol: string, change90d: number, change24h = 0): Coin => ({
  id: symbol.length * 100 + change90d, rank: 1, name: symbol, symbol, price: 1, change1h: 0, change24h, change7d: 0,
  change30d: 0, change90d, change1y: null, marketCap: 1, volume24h: 1,
});

describe("insights", () => {
  it("altcoin season index is the % of alts beating BTC over 90d, ignoring stablecoins", () => {
    const coins = [coin("BTC", 10), coin("ETH", 20), coin("SOL", 30), coin("ADA", 5), coin("DOGE", 1), coin("USDT", 50)];
    expect(altcoinSeasonIndex(coins)).toBe(50);
  });
  it("sectors map known symbols", () => {
    expect(sectorOf("USDT")).toBe("Stablecoins");
    expect(sectorOf("DOGE")).toBe("Memes");
    expect(sectorOf("FET")).toBe("AI");
    expect(sectorOf("UNI")).toBe("DeFi");
    expect(sectorOf("SOL")).toBe("Layer 1");
  });
  it("watchlist toggles add and remove", () => {
    expect(toggleWatch([1], 2)).toEqual([1, 2]);
    expect(toggleWatch([1, 2], 1)).toEqual([2]);
  });
  it("gainers/losers sort by 24h change", () => {
    const c = [coin("A", 0, 5), coin("B", 0, -3), coin("C", 0, 9), coin("D", 0, -8)];
    expect(topGainers(c).map((x) => x.symbol)).toEqual(["C", "A"]);
    expect(topLosers(c).map((x) => x.symbol)).toEqual(["D", "B"]);
  });
});

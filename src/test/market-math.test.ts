import { describe, expect, it } from "vitest";

import { convertFromUsd, convertToUsd, CURRENCIES, CURRENCY_CODES } from "@/lib/currency";
import { buildPricePath, computeWhatIf, priceDaysAgo, type Coin } from "@/lib/market";

const coin: Coin = {
  id: 1, rank: 1, name: "Bitcoin", symbol: "BTC", price: 100,
  change1h: 0, change24h: 0, change7d: 100, change30d: 25, change90d: 0, change1y: -50,
  marketCap: 1, volume24h: 1,
};

describe("currency switcher", () => {
  it("offers exactly USD, PKR, EUR, AED and INR", () => {
    expect(CURRENCY_CODES).toEqual(["USD", "PKR", "EUR", "AED", "INR"]);
  });

  it("converts USD to the selected currency and back", () => {
    expect(convertFromUsd(100, "PKR")).toBeCloseTo(100 * CURRENCIES.PKR.rate);
    expect(convertToUsd(convertFromUsd(100, "AED"), "AED")).toBeCloseTo(100);
  });
});

describe("what-if calculator", () => {
  it("doubles an investment when the price doubled", () => {
    const r = computeWhatIf(100, 50, 100);
    expect(r.valueUsd).toBeCloseTo(200);
    expect(r.profitUsd).toBeCloseTo(100);
    expect(r.profitPct).toBeCloseTo(100);
  });

  it("derives the past price from the timeframe's percent change", () => {
    expect(priceDaysAgo(coin, 7)).toBeCloseTo(50);
    expect(priceDaysAgo(coin, 30)).toBeCloseTo(80);
    expect(priceDaysAgo(coin, 365)).toBeCloseTo(200);
  });

  it("chart path starts at the past price and ends at today's price", () => {
    const path = buildPricePath(coin, 30, 40);
    expect(path[0]?.price).toBeCloseTo(80);
    expect(path.at(-1)?.price).toBe(100);
  });
});

describe("privacy features", () => {
  it("panic wipe removes the saved API key and calculation history only", async () => {
    const { wipeLocalData } = await import("@/lib/settings");
    localStorage.setItem("cmc-pulse:settings", JSON.stringify({ apiKey: "secret-key" }));
    localStorage.setItem("cmc-pulse:history", "[]");
    localStorage.setItem("other-app", "keep");
    expect(wipeLocalData(localStorage)).toBe(2);
    expect(localStorage.getItem("cmc-pulse:settings")).toBeNull();
    expect(localStorage.getItem("cmc-pulse:history")).toBeNull();
    expect(localStorage.getItem("other-app")).toBe("keep");
  });

  it("keeps at most 5 recent simulations, newest first, without duplicates", async () => {
    const { addToHistory } = await import("@/lib/settings");
    let h: import("@/lib/settings").Simulation[] = [];
    for (let i = 0; i < 7; i++) h = addToHistory(h, { symbol: "BTC", timeframe: "7d", amountUsd: i + 1, at: String(i) });
    h = addToHistory(h, { symbol: "BTC", timeframe: "7d", amountUsd: 7, at: "again" });
    expect(h).toHaveLength(5);
    expect(h[0]?.at).toBe("again");
    expect(h.filter((x) => x.amountUsd === 7)).toHaveLength(1);
  });

  it("privacy filter tracks Monero, Zcash, Dash and Oasis", async () => {
    const { PRIVACY_SYMBOLS } = await import("@/lib/market");
    expect(PRIVACY_SYMBOLS).toEqual(expect.arrayContaining(["XMR", "ZEC", "DASH", "ROSE"]));
  });
});

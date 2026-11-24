import { describe, expect, it } from "vitest";

import { getDemoSnapshot } from "@/lib/demo-data";
import { paginate, SCREENER_LIMIT, SCREENER_PAGE_SIZE } from "@/lib/market";

const thousand = Array.from({ length: 1000 }, (_, i) => i + 1);

describe("live screener", () => {
  it("requests the top 1000 coins", () => {
    expect(SCREENER_LIMIT).toBe(1000);
  });

  it("shows 25 coins per page, so 1000 coins make 40 pages", () => {
    expect(SCREENER_PAGE_SIZE).toBe(25);
    const first = paginate(thousand, 1);
    expect(first.items).toHaveLength(25);
    expect(first.pageCount).toBe(40);
    const last = paginate(thousand, 40);
    expect(last.items[0]).toBe(976);
    expect(last.to).toBe(1000);
  });

  it("clamps pages past the end to the last page", () => {
    expect(paginate(thousand, 99).page).toBe(40);
    expect(paginate([1, 2, 3], 2).page).toBe(1);
  });

  it("demo mode fills all 1000 rows with unique coins ranked by market cap", () => {
    const { coins } = getDemoSnapshot();
    expect(coins).toHaveLength(1000);
    expect(new Set(coins.map((c) => c.symbol)).size).toBe(1000);
    expect(coins.map((c) => c.rank)).toEqual(thousand);
  });
});

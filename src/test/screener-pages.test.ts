import { describe, expect, it } from "vitest";

import { getDemoSnapshot } from "@/lib/demo-data";
import { paginate, SCREENER_LIMIT, SCREENER_PAGE_SIZE } from "@/lib/market";

const hundred = Array.from({ length: 100 }, (_, i) => i + 1);

describe("live screener", () => {
  it("requests the top 100 coins", () => {
    expect(SCREENER_LIMIT).toBe(100);
  });

  it("shows 20 coins per page, so 100 coins make 5 pages", () => {
    expect(SCREENER_PAGE_SIZE).toBe(20);
    const first = paginate(hundred, 1);
    expect(first.items).toHaveLength(20);
    expect(first.pageCount).toBe(5);
    const last = paginate(hundred, 5);
    expect(last.items[0]).toBe(81);
    expect(last.to).toBe(100);
  });

  it("clamps pages past the end to the last page", () => {
    expect(paginate(hundred, 9).page).toBe(5);
    expect(paginate([1, 2, 3], 2).page).toBe(1);
  });

  it("demo mode fills all 100 rows with unique coins ranked by market cap", () => {
    const { coins } = getDemoSnapshot();
    expect(coins).toHaveLength(100);
    expect(new Set(coins.map((c) => c.symbol)).size).toBe(100);
    expect(coins.map((c) => c.rank)).toEqual(hundred);
  });
});

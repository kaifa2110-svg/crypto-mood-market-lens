import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";
describe("toCsv", () => {
  it("quotes cells with commas and quotes", () => {
    expect(toCsv([["Name", "Price"], ['Bit "coin", X', 1.5]])).toBe('Name,Price\r\n"Bit ""coin"", X",1.5');
  });
});

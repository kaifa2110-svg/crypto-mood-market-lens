export const CURRENCIES = {
  USD: { code: "USD", label: "US Dollar", rate: 1, flag: "🇺🇸" },
  PKR: { code: "PKR", label: "Pakistani Rupee", rate: 281.4, flag: "🇵🇰" },
  EUR: { code: "EUR", label: "Euro", rate: 0.94, flag: "🇪🇺" },
  AED: { code: "AED", label: "UAE Dirham", rate: 3.6725, flag: "🇦🇪" },
  INR: { code: "INR", label: "Indian Rupee", rate: 84.45, flag: "🇮🇳" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

export function convertFromUsd(usd: number, code: CurrencyCode): number {
  return usd * CURRENCIES[code].rate;
}

export function convertToUsd(amount: number, code: CurrencyCode): number {
  return amount / CURRENCIES[code].rate;
}

export function formatMoney(
  usd: number,
  code: CurrencyCode,
  opts: { compact?: boolean; whole?: boolean } = {},
): string {
  const value = convertFromUsd(usd, code);
  const abs = Math.abs(value);
  const base: Intl.NumberFormatOptions = {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  };
  if (opts.compact && abs >= 100_000) {
    return new Intl.NumberFormat("en-US", {
      ...base,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  if (opts.whole && abs >= 1) {
    return new Intl.NumberFormat("en-US", { ...base, maximumFractionDigits: 0 }).format(value);
  }
  if (abs > 0 && abs < 1) {
    return new Intl.NumberFormat("en-US", {
      ...base,
      minimumSignificantDigits: 2,
      maximumSignificantDigits: 4,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    ...base,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function currencySymbol(code: CurrencyCode): string {
  const parts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? code;
}

export function formatPercent(n: number, digits = 2): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

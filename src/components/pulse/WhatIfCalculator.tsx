import { subDays, subHours, format } from "date-fns";
import { Download, History, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CoinLogo, Sensitive, Shimmer } from "@/components/pulse/primitives";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import {
  convertFromUsd,
  convertToUsd,
  currencySymbol,
  formatMoney,
  formatPercent,
  type CurrencyCode,
} from "@/lib/currency";
import {
  TIMEFRAMES,
  WHAT_IF_SYMBOLS,
  buildPricePath,
  computeWhatIf,
  priceDaysAgo,
  type MarketSnapshot,
  type Timeframe,
} from "@/lib/market";
import { downloadCsv } from "@/lib/csv";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const PRESETS_USD = [100, 500, 1000, 5000];
type WhatIfSymbol = (typeof WHAT_IF_SYMBOLS)[number];
const DEFAULT_INPUT = { symbol: "BTC" as WhatIfSymbol, tf: "1y" as Timeframe["id"], amountUsd: 100 };

function isWhatIfSymbol(v: string): v is WhatIfSymbol {
  return (WHAT_IF_SYMBOLS as readonly string[]).includes(v);
}
function isTimeframeId(v: string): v is Timeframe["id"] {
  return TIMEFRAMES.some((t) => t.id === v);
}

function roundForInput(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n * 100) / 100);
}

export function WhatIfCalculator({
  snapshot,
  currency,
}: {
  snapshot: MarketSnapshot | undefined;
  currency: CurrencyCode;
}) {
  const { settings, hydrated, history, recordSimulation, wipeCount } = useSettings();
  const stealth = settings.stealth;
  const [symbol, setSymbolState] = useState<WhatIfSymbol>(DEFAULT_INPUT.symbol);
  const [tfId, setTfIdState] = useState<Timeframe["id"]>(DEFAULT_INPUT.tf);
  const [amountUsd, setAmountUsd] = useState(DEFAULT_INPUT.amountUsd);
  const [draft, setDraft] = useState("100");
  const prevCurrency = useRef(currency);
  const interacted = useRef(false);
  const restored = useRef(false);

  const setSymbol = (s: WhatIfSymbol) => {
    interacted.current = true;
    setSymbolState(s);
  };
  const setTfId = (t: Timeframe["id"]) => {
    interacted.current = true;
    setTfIdState(t);
  };
  const loadInput = (sym: WhatIfSymbol, tf: Timeframe["id"], usd: number) => {
    setSymbolState(sym);
    setTfIdState(tf);
    setAmountUsd(usd);
    setDraft(roundForInput(convertFromUsd(usd, currency)));
  };

  // Restore the most recent simulation once saved history is loaded.
  useEffect(() => {
    if (!hydrated || restored.current) return;
    restored.current = true;
    const last = history[0];
    if (last && isWhatIfSymbol(last.symbol) && isTimeframeId(last.timeframe)) {
      loadInput(last.symbol, last.timeframe, last.amountUsd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Panic wipe: reset the calculator to its defaults.
  useEffect(() => {
    if (wipeCount === 0) return;
    interacted.current = false;
    loadInput(DEFAULT_INPUT.symbol, DEFAULT_INPUT.tf, DEFAULT_INPUT.amountUsd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wipeCount]);

  // Save to local history once the user's inputs settle.
  useEffect(() => {
    if (!interacted.current || !(amountUsd > 0)) return;
    const t = setTimeout(() => recordSimulation({ symbol, timeframe: tfId, amountUsd }), 1200);
    return () => clearTimeout(t);
  }, [symbol, tfId, amountUsd, recordSimulation]);

  // Keep the same real value when the user switches currency (e.g. $100 → ₨28,140).
  useEffect(() => {
    if (prevCurrency.current !== currency) {
      prevCurrency.current = currency;
      setDraft(roundForInput(convertFromUsd(amountUsd, currency)));
    }
  }, [currency, amountUsd]);

  const tf = TIMEFRAMES.find((t) => t.id === tfId) ?? TIMEFRAMES[3];
  const coin = snapshot?.coins.find((c) => c.symbol === symbol);
  const pastPrice = coin ? priceDaysAgo(coin, tf.days) : null;
  const result = coin && pastPrice ? computeWhatIf(amountUsd, pastPrice, coin.price) : null;
  const gain = (result?.profitUsd ?? 0) >= 0;

  const chartData = useMemo(() => {
    if (!coin || !result) return [];
    const now = new Date();
    return buildPricePath(coin, tf.days, 64).map((p) => {
      const date = p.daysAgo >= 1 ? subDays(now, Math.round(p.daysAgo)) : subHours(now, Math.round(p.daysAgo * 24));
      return { ts: date.getTime(), value: result.units * p.price };
    });
  }, [coin, result, tf.days]);

  const animatedValue = useAnimatedNumber(result?.valueUsd ?? 0);
  const sym = currencySymbol(currency);
  const stroke = gain ? "var(--gain)" : "var(--loss)";

  return (
    <section className="panel overflow-hidden animate-fade-up" style={{ animationDelay: "120ms" }}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            <Sparkles className="size-3.5" /> What-If Simulator
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
            What if you had invested earlier?
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Based on CoinMarketCap % changes{tf.id === "1y" ? " · 1Y uses reference history" : ""}
          </p>
          {coin && result && (
            <button
              type="button"
              onClick={() => {
                const c = (usd: number) => Math.round(convertFromUsd(usd, currency) * 100) / 100;
                downloadCsv(
                  [
                    ["Coin", "Timeframe", `Invested (${currency})`, `Price then (${currency})`, `Price now (${currency})`, "Coins bought", `Value today (${currency})`, `Profit (${currency})`, "Profit %"],
                    [coin.symbol, tf.label, c(amountUsd), c(pastPrice ?? 0), c(coin.price), result.units, c(result.valueUsd), c(result.profitUsd), Math.round(result.profitPct * 100) / 100],
                    [],
                    ["Date", `Value (${currency})`],
                    ...chartData.map((d) => [format(d.ts, "yyyy-MM-dd HH:mm"), c(d.value)]),
                  ],
                  `cryptopulser-whatif-${coin.symbol}-${tf.short}.csv`,
                );
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 text-xs font-medium transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Download className="size-3.5" /> Download CSV
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <div className="space-y-6 border-b border-border p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div>
            <div className="mb-2.5 text-xs font-medium text-muted-foreground">Pick a coin</div>
            <div className="grid grid-cols-3 gap-2">
              {WHAT_IF_SYMBOLS.map((s) => {
                const c = snapshot?.coins.find((x) => x.symbol === s);
                const active = s === symbol;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSymbol(s)}
                    disabled={!c}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-medium transition-all",
                      active
                        ? "border-primary/60 bg-primary/10 text-foreground shadow-glow"
                        : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      !c && "opacity-40",
                    )}
                  >
                    {c ? <CoinLogo id={c.id} symbol={s} size={20} /> : <span className="size-5 rounded-full bg-muted" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="mb-2.5 block text-xs font-medium text-muted-foreground">
              Investment amount ({currency})
            </label>
            <div className="flex items-center rounded-xl border border-input bg-secondary/40 px-3 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-ring/30">
              <span className="num text-lg text-muted-foreground">{sym}</span>
              <input
                id="amount"
                type={stealth ? "password" : "text"}
                autoComplete="off"
                inputMode="decimal"
                value={draft}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  interacted.current = true;
                  setDraft(v);
                  const n = parseFloat(v);
                  setAmountUsd(Number.isFinite(n) ? convertToUsd(n, currency) : 0);
                }}
                className="num h-12 w-full bg-transparent px-2 text-xl font-semibold outline-none placeholder:text-muted-foreground/50"
                placeholder="0"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS_USD.map((usd) => {
                const local = Math.round(convertFromUsd(usd, currency));
                return (
                  <button
                    key={usd}
                    type="button"
                    onClick={() => {
                      interacted.current = true;
                      setDraft(String(local));
                      setAmountUsd(convertToUsd(local, currency));
                    }}
                    className="num rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {formatMoney(usd, currency, { compact: true }).replace(/\.00$/, "")}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2.5 text-xs font-medium text-muted-foreground">Invested…</div>
            <div className="grid grid-cols-2 gap-2">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTfId(t.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                    t.id === tfId
                      ? "border-primary/60 bg-primary/10 text-foreground"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <History className="size-3.5" /> Recent simulations
                <span className="text-muted-foreground/60">· saved in this browser</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h) => {
                  const tfShort = TIMEFRAMES.find((t) => t.id === h.timeframe)?.short ?? h.timeframe;
                  return (
                    <button
                      key={h.at}
                      type="button"
                      onClick={() => {
                        if (isWhatIfSymbol(h.symbol) && isTimeframeId(h.timeframe)) {
                          loadInput(h.symbol, h.timeframe, h.amountUsd);
                        }
                      }}
                      className="num rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {h.symbol} · {tfShort} · <Sensitive>{formatMoney(h.amountUsd, currency, { compact: true })}</Sensitive>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="p-5 sm:p-6">
          {!snapshot || !coin ? (
            <div className="space-y-4">
              <Shimmer className="h-5 w-48" />
              <Shimmer className="h-12 w-72" />
              <Shimmer className="h-[260px] w-full" />
            </div>
          ) : !result || amountUsd <= 0 ? (
            <div className="grid h-full min-h-[300px] place-items-center text-center text-sm text-muted-foreground">
              Enter an amount to see what it would be worth today.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    <Sensitive>{formatMoney(amountUsd, currency)}</Sensitive> in {coin.name}{" "}
                    {tf.label.toLowerCase()} would be worth
                  </div>
                  <div className="num mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                    <Sensitive>{formatMoney(animatedValue, currency)}</Sensitive>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-4 py-2.5",
                    gain ? "border-gain/30 bg-gain/10 text-gain" : "border-loss/30 bg-loss/10 text-loss",
                  )}
                >
                  {gain ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
                  <div>
                    <div className="num text-lg font-semibold leading-tight">
                      <Sensitive>{formatPercent(result.profitPct)}</Sensitive>
                    </div>
                    <div className="num text-xs opacity-80">
                      <Sensitive>
                        {gain ? "+" : "−"}
                        {formatMoney(Math.abs(result.profitUsd), currency)}
                      </Sensitive>
                    </div>
                  </div>
                </div>
              </div>

              <div className={cn("mt-6 h-[260px] w-full transition-[filter]", stealth && "stealth-blur")} aria-hidden={stealth}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart key={`${symbol}-${tf.id}`} data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="whatif-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" style={{ stopColor: stroke, stopOpacity: 0.35 }} />
                        <stop offset="100%" style={{ stopColor: stroke, stopOpacity: 0 }} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="ts"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(ts: number) => format(ts, tf.days <= 7 ? "EEE" : tf.days <= 90 ? "MMM d" : "MMM ''yy")}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={32}
                    />
                    <YAxis
                      tickFormatter={(v: number) => (stealth ? "•••" : formatMoney(v, currency, { compact: true, whole: true }))}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={78}
                      domain={["auto", "auto"]}
                    />
                    <ReferenceLine
                      y={amountUsd}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      label={{ value: "Invested", position: "insideTopLeft", fill: "var(--muted-foreground)", fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        const p = payload?.[0]?.payload as { ts: number; value: number } | undefined;
                        if (!active || !p || stealth) return null;
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
                            <div className="text-muted-foreground">{format(p.ts, "MMM d, yyyy")}</div>
                            <div className="num mt-0.5 text-sm font-semibold">{formatMoney(p.value, currency)}</div>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={stroke}
                      strokeWidth={2.25}
                      fill="url(#whatif-fill)"
                      animationDuration={900}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Price then", formatMoney(pastPrice ?? 0, currency)],
                  ["Price now", formatMoney(coin.price, currency)],
                  ["Coins bought", stealth ? "••••••" : `${result.units < 1 ? result.units.toPrecision(4) : result.units.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${coin.symbol}`],
                  ["Multiplier", stealth ? "••••" : `${(result.valueUsd / amountUsd).toFixed(2)}×`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
                    <dd className="num mt-1 truncate text-sm font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";

import { CoinLogo, Pct } from "@/components/pulse/primitives";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { convertFromUsd, formatMoney, type CurrencyCode } from "@/lib/currency";
import type { Coin } from "@/lib/market";
import { cn } from "@/lib/utils";

const TRADINGVIEW_HOST = "s3.tradingview.com";

/** Real-time candlestick widget for BINANCE:{symbol}USDT, styled to the cosmic theme. */
function TradingViewChart({ symbol, dark }: { symbol: string; dark: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const el = containerRef.current;
    if (!el) return;
    const widgetId = `tv-candles-${symbol}`;
    const previous = document.getElementById(widgetId);
    if (previous) previous.remove();

    const json = JSON.stringify({
      symbol: `BINANCE:${symbol}USDT`,
      interval: "15",
      timezone: "Etc/UTC",
      theme: dark ? "dark" : "light",
      style: "1",
      locale: "en",
      backgroundColor: dark ? "#0b0e1d" : "#ffffff",
      gridColor: "rgba(147, 160, 196, 0.12)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });

    const script = document.createElement("script");
    script.id = widgetId;
    script.src = `https://${TRADINGVIEW_HOST}/external-embedding/embed-widget-advanced-chart.js`;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = json;
    script.onerror = () => setFailed(true);
    el.appendChild(script);
    return () => script.remove();
  }, [symbol, dark]);

  return (
    <div className="relative h-[360px] overflow-hidden rounded-xl border border-border bg-secondary/30 sm:h-[420px]">
      <div ref={containerRef} className="h-full w-full" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          Couldn't load the TradingView chart — check your connection. Live stats are shown below.
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "gain" | "loss" }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("num text-sm font-medium", tone === "gain" && "text-gain", tone === "loss" && "text-loss")}>
        {value}
      </span>
    </div>
  );
}

export function CoinDetailModal({
  coin,
  currency,
  onClose,
}: {
  coin: Coin | null;
  currency: CurrencyCode;
  onClose: () => void;
}) {
  const price = coin ? convertFromUsd(coin.price, currency) : 0;
  const cap = coin ? convertFromUsd(coin.marketCap, currency) : 0;
  const vol = coin ? convertFromUsd(coin.volume24h, currency) : 0;
  const circSupply = coin && coin.price > 0 ? coin.marketCap / coin.price : null;
  const volOverCap = coin && coin.marketCap > 0 ? (coin.volume24h / coin.marketCap) * 100 : null;

  return (
    <Dialog open={!!coin} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="panel max-h-[90vh] overflow-y-auto border-border sm:max-w-3xl">
        {coin && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <CoinLogo id={coin.id} symbol={coin.symbol} />
                <div>
                  <DialogTitle className="text-left">
                    {coin.name} <span className="text-muted-foreground">({coin.symbol})</span>
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    Rank #{coin.rank} · Real-time chart & live stats in {currency}
                  </DialogDescription>
                </div>
                <div className="num ml-auto text-lg font-semibold sm:text-xl">
                  {formatMoney(price, currency)}
                  <Pct value={coin.change24h} className="ml-2 align-middle text-sm" />
                </div>
              </div>
            </DialogHeader>

            <TradingViewChart symbol={coin.symbol} dark />

            <div className="grid gap-x-8 sm:grid-cols-2">
              <div>
                <StatRow label="Market cap" value={formatMoney(cap, currency, { compact: true })} />
                <StatRow label="24h volume" value={formatMoney(vol, currency, { compact: true })} />
                <StatRow
                  label="Volume / market cap"
                  value={volOverCap != null ? `${volOverCap.toFixed(2)}%` : "—"}
                />
                <StatRow
                  label="Circulating supply"
                  value={circSupply != null ? circSupply.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                />
              </div>
              <div>
                <StatRow
                  label="1h"
                  value={<Pct value={coin.change1h} />}
                  tone={coin.change1h >= 0 ? "gain" : "loss"}
                />
                <StatRow
                  label="24h"
                  value={<Pct value={coin.change24h} />}
                  tone={coin.change24h >= 0 ? "gain" : "loss"}
                />
                <StatRow
                  label="7d"
                  value={<Pct value={coin.change7d} />}
                  tone={coin.change7d >= 0 ? "gain" : "loss"}
                />
                <StatRow
                  label="30d"
                  value={<Pct value={coin.change30d} />}
                  tone={coin.change30d >= 0 ? "gain" : "loss"}
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { AppHeader } from "@/components/pulse/AppHeader";
import { CoinScreener } from "@/components/pulse/CoinScreener";
import { OverviewCards } from "@/components/pulse/OverviewCards";
import { WhatIfCalculator } from "@/components/pulse/WhatIfCalculator";
import { Button } from "@/components/ui/button";
import { useMarket } from "@/hooks/use-market";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMC Pulse & What-If Simulator — Live Crypto Analytics" },
      {
        name: "description",
        content:
          "Live crypto market dashboard powered by CoinMarketCap: market cap, BTC dominance, Fear & Greed, a top-100 screener and a What-If investment simulator in USD, PKR, EUR, AED and INR.",
      },
      { property: "og:title", content: "CMC Pulse & What-If Simulator" },
      {
        property: "og:description",
        content: "See the crypto market's pulse and find out what your past investment would be worth today.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const market = useMarket();
  const { settings, update } = useSettings();
  const { snapshot } = market;
  const currency = settings.currency;

  return (
    <div className="app-backdrop min-h-screen">
      <AppHeader market={market} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Market <span className="text-gradient">Pulse</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Real-time crypto analytics, prices in {currency}. Simulate any past investment in
              seconds.
            </p>
          </div>
          <div className="num text-xs text-muted-foreground">
            {snapshot ? (
              <>
                {snapshot.source === "live" ? "CoinMarketCap" : "Demo feed"} · updated{" "}
                {new Date(snapshot.fetchedAt).toLocaleTimeString()}
              </>
            ) : (
              "Loading market data…"
            )}
          </div>
        </div>

        {market.error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-highlight/30 bg-highlight/10 px-4 py-3 text-sm animate-fade-up">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-highlight" />
              <div>
                <div className="font-medium text-highlight">Couldn't load live CoinMarketCap data</div>
                <div className="text-muted-foreground">
                  {market.error} {!market.isLive && "Showing demo data meanwhile."}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={market.refetch}>
                <RefreshCw /> Retry
              </Button>
              <Button size="sm" variant="secondary" onClick={() => update({ useDemo: true })}>
                Use demo data
              </Button>
            </div>
          </div>
        )}

        {snapshot?.warnings.map((w) => (
          <div key={w} className="rounded-xl border border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
            {w}
          </div>
        ))}

        <OverviewCards snapshot={snapshot} currency={currency} />
        <WhatIfCalculator snapshot={snapshot} currency={currency} />
        <CoinScreener snapshot={snapshot} currency={currency} />

        <footer className="flex flex-wrap items-center justify-between gap-2 pt-4 text-xs text-muted-foreground">
          <span>Data provided by CoinMarketCap · Built for the CoinMarketCap API Hackathon</span>
          <span>Not financial advice. Exchange rates are indicative.</span>
        </footer>
      </main>
    </div>
  );
}

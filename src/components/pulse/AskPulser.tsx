import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askPulser } from "@/lib/ai.functions";
import { formatMoney, type CurrencyCode } from "@/lib/currency";
import type { MarketSnapshot } from "@/lib/market";
import { useSettings, type ChatMessage } from "@/lib/settings";
import { cn } from "@/lib/utils";

const PROMPTS = [
  "Summarize today's market mood",
  "Which coin is the top gainer today?",
  "Explain the Fear & Greed score",
  "Analyze BTC vs ETH performance",
];

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function buildMarketContext(s: MarketSnapshot, cur: CurrencyCode): string {
  const g = s.global;
  const sorted = [...s.coins].sort((a, b) => b.change24h - a.change24h);
  const line = (c: MarketSnapshot["coins"][number]) =>
    `#${c.rank} ${c.name} (${c.symbol}): price ${formatMoney(c.price, cur)}, 1h ${pct(c.change1h)}, 24h ${pct(c.change24h)}, 7d ${pct(c.change7d)}, 30d ${pct(c.change30d)}, mcap ${formatMoney(c.marketCap, cur, { compact: true })}, vol ${formatMoney(c.volume24h, cur, { compact: true })}`;
  return [
    `Selected currency: ${cur}. Data source: ${s.source === "live" ? "CoinMarketCap live" : "demo feed"}, fetched ${s.fetchedAt}.`,
    `Global: total market cap ${formatMoney(g.totalMarketCap, cur, { compact: true })} (${pct(g.marketCapChange24h)} 24h), 24h volume ${formatMoney(g.totalVolume24h, cur, { compact: true })} (${pct(g.volumeChange24h)}), BTC dominance ${g.btcDominance.toFixed(2)}%, ETH dominance ${g.ethDominance.toFixed(2)}%.`,
    `Fear & Greed: ${s.fearGreed.value}/100 (${s.fearGreed.classification}).`,
    `Top 5 gainers 24h: ${sorted.slice(0, 5).map((c) => `${c.symbol} ${pct(c.change24h)}`).join(", ")}.`,
    `Top 5 losers 24h: ${sorted.slice(-5).reverse().map((c) => `${c.symbol} ${pct(c.change24h)}`).join(", ")}.`,
    "Top 30 coins:",
    ...s.coins.slice(0, 30).map(line),
  ].join("\n");
}

export function AskPulser({ snapshot, currency }: { snapshot: MarketSnapshot | undefined; currency: CurrencyCode }) {
  const { chat, setChat } = useSettings();
  const ask = useServerFn(askPulser);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat, busy, open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy || !snapshot) return;
    const next: ChatMessage[] = [...chat, { role: "user", content: q }];
    setChat(next);
    setInput("");
    setError(null);
    setBusy(true);
    try {
      const res = await ask({ data: { context: buildMarketContext(snapshot, currency), messages: next.slice(-10) } });
      if (res.ok) setChat([...next, { role: "assistant", content: res.text }]);
      else setError(res.error);
    } catch {
      setError("Couldn't reach the assistant. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105"
        >
          <Sparkles className="size-4" /> Ask Crypto Pulser AI
        </button>
      )}
      {open && (
        <div className="panel fixed bottom-4 right-4 z-50 flex h-[min(600px,calc(100vh-6rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden animate-fade-up">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-gradient-primary">
                <Bot className="size-4 text-primary-foreground" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Crypto Pulser AI</div>
                <div className="text-[11px] text-muted-foreground">Uses the market data on screen · {currency}</div>
              </div>
            </div>
            <div className="flex">
              <Button variant="ghost" size="icon" aria-label="Clear chat" onClick={() => setChat([])} disabled={!chat.length}>
                <Trash2 />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Close chat" onClick={() => setOpen(false)}>
                <X />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
            {chat.length === 0 && (
              <p className="text-muted-foreground">Ask anything about today's market. Try a quick prompt below.</p>
            )}
            {chat.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2",
                  m.role === "user" ? "ml-auto bg-primary/15 text-foreground" : "bg-secondary/60",
                )}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2 text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Thinking…
              </div>
            )}
            {error && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive">{error}</div>}
            <div ref={endRef} />
          </div>

          <div className="flex gap-1.5 overflow-x-auto border-t border-border px-3 py-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={busy || !snapshot}
                onClick={() => void send(p)}
                className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-border p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the market…" maxLength={500} />
            <Button type="submit" size="icon" disabled={busy || !input.trim() || !snapshot} aria-label="Send">
              <Send />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, KeyRound, RefreshCw, Settings2, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { MarketState } from "@/hooks/use-market";
import { CURRENCIES, CURRENCY_CODES, isCurrencyCode } from "@/lib/currency";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <svg viewBox="0 0 24 24" className="size-5 stroke-primary-foreground" fill="none" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2 12h4l3-7 4 14 3-7h6" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="hidden text-sm font-semibold tracking-tight sm:block sm:text-base">
          Crypto Mood <span className="text-gradient">Market Lens</span>
        </div>
        <div className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:block">
          Powered by CoinMarketCap API
        </div>
      </div>
    </div>
  );
}

function LiveBadge({ market }: { market: MarketState }) {
  const status = market.error ? "error" : market.isLive ? "live" : "demo";
  const label = status === "live" ? "Live · CMC" : status === "error" ? "Live · fallback" : "Live · Demo";
  return (
    <div
      className={cn(
        "hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium lg:inline-flex",
        status === "live" && "border-gain/30 bg-gain/10 text-gain",
        status === "demo" && "border-primary/25 bg-primary/10 text-primary",
        status === "error" && "border-highlight/30 bg-highlight/10 text-highlight",
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-pulse-ring rounded-full bg-current" />
        <span className="relative inline-flex size-2 rounded-full bg-current" />
      </span>
      <span>Live Market</span>
      <span className="opacity-60">{label.replace("Live · ", "· ")}</span>
    </div>
  );
}

function SettingsDialog() {
  const { settings, update } = useSettings();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(settings.apiKey);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (open) setDraft(settings.apiKey);
  }, [open, settings.apiKey]);

  const save = () => {
    const key = draft.trim();
    update({ apiKey: key, useDemo: key.length === 0 });
    toast.success(key ? "API key saved — loading live CoinMarketCap data" : "Key cleared — using demo data");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border bg-secondary/60">
          {settings.apiKey ? <KeyRound className="text-primary" /> : <Settings2 />}
          <span className="hidden md:inline">{settings.apiKey ? "API key set" : "API Key"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="panel border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>CoinMarketCap connection</DialogTitle>
          <DialogDescription>
            Paste your CoinMarketCap Pro API key to load real market data. It stays in this
            browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cmc-key">API key</Label>
            <div className="relative">
              <Input
                id="cmc-key"
                type={reveal ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. 1a2b3c4d-…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="num pr-10"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={reveal ? "Hide key" : "Show key"}
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              No key yet?{" "}
              <a
                href="https://coinmarketcap.com/api/"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                Get a free one at coinmarketcap.com/api
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-3">
            <div>
              <div className="text-sm font-medium">Use demo data</div>
              <div className="text-xs text-muted-foreground">
                Realistic live-style data, no key needed.
              </div>
            </div>
            <Switch
              checked={settings.useDemo}
              onCheckedChange={(v) => {
                if (!v && !settings.apiKey && !draft.trim()) {
                  toast.error("Add an API key first to switch to live data");
                  return;
                }
                if (!v && draft.trim() && draft.trim() !== settings.apiKey) {
                  update({ apiKey: draft.trim(), useDemo: false });
                } else {
                  update({ useDemo: v });
                }
              }}
            />
          </div>

          <div className="flex justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDraft("");
                update({ apiKey: "", useDemo: true });
                toast("API key removed from this browser");
              }}
              disabled={!settings.apiKey}
            >
              Remove key
            </Button>
            <Button onClick={save}>Save & connect</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PrivacyBadge() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
          aria-label="Privacy details"
        >
          <ShieldCheck className="size-4" />
          <span className="hidden xl:inline">Local & Private</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="panel w-80 border-border text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 text-primary" /> Local & Private
        </div>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li>• Your API key, settings and calculation history are saved only in this browser.</li>
          <li>• No accounts, no cookies, no analytics or tracking in this app.</li>
          <li>
            • In live mode your key is relayed straight to CoinMarketCap to fetch prices (they block
            direct browser calls) and is never saved on any server.
          </li>
        </ul>
        <PanicWipeButton variant="full" />
      </PopoverContent>
    </Popover>
  );
}

function PanicWipeButton({ variant = "icon" }: { variant?: "icon" | "full" }) {
  const { wipe } = useSettings();
  const queryClient = useQueryClient();
  const onWipe = () => {
    wipe();
    // Drop cached live responses (their cache key includes the API key).
    queryClient.removeQueries({ queryKey: ["cmc-snapshot"] });
    toast.success("Wiped: API key and calculation history erased from this browser");
  };
  if (variant === "full") {
    return (
      <Button variant="destructive" size="sm" className="mt-4 w-full" onClick={onWipe}>
        <Trash2 /> Panic Wipe — clear all data
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onWipe}
      aria-label="Panic wipe: clear API key and history"
      title="Panic Wipe — clear API key & history"
      className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
    >
      <Trash2 />
    </Button>
  );
}

function StealthToggle() {
  const { settings, update } = useSettings();
  const on = settings.stealth;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={on}
      aria-label={on ? "Turn off stealth mode" : "Turn on stealth mode"}
      title={on ? "Stealth mode on — amounts hidden" : "Stealth mode — hide amounts"}
      onClick={() => update({ stealth: !on })}
      className={cn(on && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}
    >
      {on ? <EyeOff /> : <Eye />}
    </Button>
  );
}

export function AppHeader({ market }: { market: MarketState }) {
  const { settings, update } = useSettings();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo />
          <LiveBadge market={market} />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <PrivacyBadge />
          <StealthToggle />
          <PanicWipeButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={market.refetch}
            aria-label="Refresh data"
            className="hidden md:inline-flex"
          >
            <RefreshCw className={cn(market.isFetching && "animate-spin")} />
          </Button>
          <Select
            value={settings.currency}
            onValueChange={(v) => isCurrencyCode(v) && update({ currency: v })}
          >
            <SelectTrigger className="h-8 w-[104px] border-border bg-secondary/60 text-sm" aria-label="Currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_CODES.map((c) => (
                <SelectItem key={c} value={c}>
                  <span className="mr-1.5">{CURRENCIES[c].flag}</span>
                  <span className="font-medium">{c}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
}

import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleHelp, Eye, EyeOff, Ghost, Lock, KeyRound, Loader2, RefreshCw, Settings2, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { testCmcKey } from "@/lib/cmc.functions";
import { LOCK_EVENT } from "@/lib/csv";
import type { MarketState } from "@/hooks/use-market";
import { CURRENCIES, CURRENCY_CODES, isCurrencyCode } from "@/lib/currency";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

function Tip({ text, children }: { text: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-60 text-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

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
          CryptoPulser<span className="text-gradient">.com</span>
        </div>
        <div className="hidden text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:block">
          Privacy-First Crypto Intelligence • Powered by CoinMarketCap API
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
  const [test, setTest] = useState<{ state: "idle" | "busy" | "ok" | "err"; msg?: string }>({ state: "idle" });
  const runTest = useServerFn(testCmcKey);
  const onTest = async () => {
    const key = draft.trim();
    if (!key) return setTest({ state: "err", msg: "Paste a key first." });
    setTest({ state: "busy" });
    try {
      const r = await runTest({ data: { apiKey: key } });
      setTest(r.ok
        ? { state: "ok", msg: r.creditsLeft != null ? `Key is valid · ${r.creditsLeft.toLocaleString()} credits left this month` : "Key is valid" }
        : { state: "err", msg: r.message });
    } catch {
      setTest({ state: "err", msg: "Couldn't reach CoinMarketCap. Try again." });
    }
  };

  useEffect(() => {
    if (open) {
      setDraft(settings.apiKey);
      setReveal(false);
      setTest({ state: "idle" });
    }
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
                onChange={(e) => {
                  setDraft(e.target.value);
                  setTest({ state: "idle" });
                }}
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
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onTest} disabled={test.state === "busy" || !draft.trim()}>
                {test.state === "busy" ? <Loader2 className="animate-spin" /> : <KeyRound />} Test API Key
              </Button>
              {test.state === "ok" && (
                <span role="status" className="inline-flex items-center gap-1 text-xs text-gain"><CheckCircle2 className="size-4" />{test.msg}</span>
              )}
              {test.state === "err" && (
                <span role="alert" className="inline-flex items-center gap-1 text-xs text-loss"><XCircle className="size-4 shrink-0" />{test.msg}</span>
              )}
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

function PrivacySwitch({ icon: Icon, label, hint, checked, onChange }: {
  icon: typeof Lock;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Tip text={hint}>
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-2.5">
      <span className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 text-primary" />
        <span>
          <span className="block text-xs font-medium text-foreground">{label}</span>
          <span className="block text-[11px] text-muted-foreground">{hint}</span>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
    </Tip>
  );
}

function PrivacyBadge() {
  const { settings, update } = useSettings();
  return (
    <Popover>
      <Tip text="Privacy center: Auto-Lock, Incognito and Panic Wipe. Your data stays in this browser.">
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
      </Tip>
      <PopoverContent align="end" className="panel w-80 border-border text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4 text-primary" /> Local & Private
        </div>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li>• Your API key, settings, calculation history and chat are saved only in this browser.</li>
          <li>• No accounts, no cookies, no analytics or tracking in this app.</li>
          <li>
            • In live mode your key is relayed straight to CoinMarketCap to fetch prices (they block
            direct browser calls) and is never saved on any server.
          </li>
        </ul>
        <div className="mt-4 space-y-2">
          <PrivacySwitch icon={Lock} label="Auto-Lock Shield" hint="Blur the screen after 60s of inactivity" checked={settings.autoLock} onChange={(v) => update({ autoLock: v })} />
          <PrivacySwitch icon={Ghost} label="Incognito Mode" hint="Don't save calculations or chat in this browser" checked={settings.incognito} onChange={(v) => update({ incognito: v })} />
        </div>
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
    toast.success("Wiped: API key, history and chat erased — session reset");
  };
  if (variant === "full") {
    return (
      <Button variant="destructive" size="sm" className="mt-4 w-full" onClick={onWipe}>
        <Trash2 /> Panic Wipe — clear all data
      </Button>
    );
  }
  return (
    <Tip text="Panic Wipe: instantly erase your API key, watchlist, history and chat from this browser.">
    <Button
      variant="ghost"
      size="icon"
      onClick={onWipe}
      aria-label="Panic wipe: clear API key and history"
      className="text-destructive hover:bg-destructive/15 hover:text-destructive"
    >
      <Trash2 />
    </Button>
    </Tip>
  );
}

function StealthToggle() {
  const { settings, update } = useSettings();
  const on = settings.stealth;
  return (
    <Tip text={on ? "Stealth on — amounts are hidden. Click or press Alt+H to show." : "Stealth Mode: hide your amounts and profits (Alt+H)."}>
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={on}
      aria-label={on ? "Turn off stealth mode" : "Turn on stealth mode"}
      onClick={() => update({ stealth: !on })}
      className={cn(on && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}
    >
      {on ? <EyeOff /> : <Eye />}
    </Button>
    </Tip>
  );
}

const SHORTCUTS = [
  ["Alt + H", "Toggle Stealth Mode"],
  ["Alt + L", "Lock the screen now"],
  ["/", "Jump to the coin search"],
  ["?", "Open this help guide"],
] as const;

const FEATURES = [
  ["Market overview", "Global market cap, 24h volume, BTC dominance and the Fear & Greed gauge."],
  ["What-If Simulator", "Pick a coin, amount and date to see what your investment would be worth today. Download the result as CSV."],
  ["Live Screener", "Top 100 coins plus Trending, Watchlist (tap the star), sectors, gainers/losers, Altcoin Index, volume, exchanges and news."],
  ["Currency switcher", "Show every figure in USD, PKR, EUR, AED or INR."],
  ["Ask Crypto Pulser AI", "Ask questions about the data on screen from the button at the bottom right."],
  ["Privacy tools", "Stealth hides amounts, Auto-Lock blurs after 60s idle, Incognito saves nothing, Panic Wipe erases everything."],
  ["API key", "Demo data works out of the box. Add your CoinMarketCap key for live data and use Test API Key to check it."],
] as const;

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="num rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-foreground">{children}</kbd>;
}

function HelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Tip text="Help & keyboard shortcuts (?)">
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Help and keyboard shortcuts">
            <CircleHelp />
          </Button>
        </DialogTrigger>
      </Tip>
      <DialogContent className="panel max-h-[85vh] overflow-y-auto border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Welcome to CryptoPulser.com</DialogTitle>
          <DialogDescription>Privacy-first crypto intelligence. Here's what you can do.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="text-sm">
              <div className="font-medium">{t}</div>
              <div className="text-muted-foreground">{d}</div>
            </li>
          ))}
        </ul>
        <div className="mt-2 rounded-xl border border-border bg-secondary/40 p-3">
          <div className="mb-2 text-sm font-medium">Keyboard shortcuts</div>
          <dl className="space-y-1.5">
            {SHORTCUTS.map(([k, d]) => (
              <div key={k} className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-muted-foreground">{d}</dt>
                <dd><Kbd>{k}</Kbd></dd>
              </div>
            ))}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useShortcuts(onHelp: () => void) {
  const { settings, update } = useSettings();
  const stealthRef = useRef(settings.stealth);
  stealthRef.current = settings.stealth;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyH") {
        e.preventDefault();
        update({ stealth: !stealthRef.current });
        toast(stealthRef.current ? "Stealth Mode off" : "Stealth Mode on — amounts hidden");
      } else if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === "KeyL") {
        e.preventDefault();
        window.dispatchEvent(new Event(LOCK_EVENT));
      } else if (!typing && !e.altKey && !e.ctrlKey && !e.metaKey && e.key === "/") {
        const el = document.getElementById("coin-search");
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus({ preventScroll: true });
        }
      } else if (!typing && e.key === "?") {
        e.preventDefault();
        onHelp();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [update, onHelp]);
}

export function AppHeader({ market }: { market: MarketState }) {
  const { settings, update } = useSettings();
  const [help, setHelp] = useState(false);
  const openHelp = useCallback(() => setHelp(true), []);
  useShortcuts(openHelp);
  return (
    <TooltipProvider delayDuration={250}>
    <header className="sticky top-0 z-40 border-b border-border bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-4">
          <Logo />
          <LiveBadge market={market} />
        </div>
        <div className="flex min-w-0 items-center gap-0.5 sm:gap-2">
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
            <SelectTrigger className="h-8 w-[84px] sm:w-[104px] border-border bg-secondary/60 text-sm" aria-label="Currency">
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
          <HelpDialog open={help} onOpenChange={setHelp} />
          <SettingsDialog />
        </div>
      </div>
    </header>
    </TooltipProvider>
  );
}

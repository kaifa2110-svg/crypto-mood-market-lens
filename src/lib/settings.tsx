import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { isCurrencyCode, type CurrencyCode } from "./currency";

export type AppSettings = {
  currency: CurrencyCode;
  apiKey: string;
  useDemo: boolean;
};

const STORAGE_KEY = "cmc-pulse:settings";
const DEFAULTS: AppSettings = { currency: "USD", apiKey: "", useDemo: true };

type Ctx = {
  settings: AppSettings;
  hydrated: boolean;
  update: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({
          currency: isCurrencyCode(parsed.currency) ? parsed.currency : DEFAULTS.currency,
          apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
          useDemo: typeof parsed.useDemo === "boolean" ? parsed.useDemo : !parsed.apiKey,
        });
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, hydrated, update }), [settings, hydrated, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

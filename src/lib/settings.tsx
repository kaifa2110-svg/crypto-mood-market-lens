import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { isCurrencyCode, type CurrencyCode } from "./currency";

export type AppSettings = {
  currency: CurrencyCode;
  apiKey: string;
  useDemo: boolean;
  /** Stealth Balance Mode: masks investment amounts and profit figures. */
  stealth: boolean;
  /** Blur the screen after 60s of inactivity. */
  autoLock: boolean;
  /** Incognito: nothing new (history, chat) is written to this browser. */
  incognito: boolean;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type Simulation = {
  symbol: string;
  timeframe: string;
  amountUsd: number;
  at: string;
};

/** Every key this app writes to localStorage starts with this prefix. */
export const STORAGE_PREFIX = "cmc-pulse:";
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;
const HISTORY_KEY = `${STORAGE_PREFIX}history`;
const CHAT_KEY = `${STORAGE_PREFIX}chat`;
export const CHAT_LIMIT = 30;
export const HISTORY_LIMIT = 5;

const DEFAULTS: AppSettings = { currency: "USD", apiKey: "", useDemo: true, stealth: false, autoLock: false, incognito: false };

/** Removes every app-owned key (API key, settings, calculation history). Returns how many were removed. */
export function wipeLocalData(storage: Storage): number {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => storage.removeItem(k));
  return keys.length;
}

export function addToHistory(history: Simulation[], sim: Simulation): Simulation[] {
  const same = (a: Simulation) =>
    a.symbol === sim.symbol &&
    a.timeframe === sim.timeframe &&
    Math.abs(a.amountUsd - sim.amountUsd) < 0.005;
  return [sim, ...history.filter((h) => !same(h))].slice(0, HISTORY_LIMIT);
}

type Ctx = {
  settings: AppSettings;
  hydrated: boolean;
  update: (patch: Partial<AppSettings>) => void;
  history: Simulation[];
  recordSimulation: (sim: Omit<Simulation, "at">) => void;
  /** Panic wipe: erases API key, settings and history from this browser. */
  wipe: () => void;
  /** Increments on every wipe so components can reset their local state. */
  wipeCount: number;
  chat: ChatMessage[];
  setChat: (msgs: ChatMessage[]) => void;
};

const SettingsContext = createContext<Ctx | null>(null);

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [history, setHistory] = useState<Simulation[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [wipeCount, setWipeCount] = useState(0);
  const [chat, setChatState] = useState<ChatMessage[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings({
          currency: isCurrencyCode(parsed.currency) ? parsed.currency : DEFAULTS.currency,
          apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
          useDemo: typeof parsed.useDemo === "boolean" ? parsed.useDemo : !parsed.apiKey,
          stealth: parsed.stealth === true,
          autoLock: parsed.autoLock === true,
          incognito: parsed.incognito === true,
        });
      }
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory) as unknown;
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, HISTORY_LIMIT) as Simulation[]);
      }
      const rawChat = localStorage.getItem(CHAT_KEY);
      if (rawChat) {
        const parsed = JSON.parse(rawChat) as unknown;
        if (Array.isArray(parsed)) setChatState(parsed.slice(-CHAT_LIMIT) as ChatMessage[]);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  const incognitoRef = useRef(false);
  incognitoRef.current = settings.incognito;

  const setChat = useCallback((msgs: ChatMessage[]) => {
    const next = msgs.slice(-CHAT_LIMIT);
    setChatState(next);
    if (!incognitoRef.current) persist(CHAT_KEY, next);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      persist(SETTINGS_KEY, next);
      // Entering incognito removes previously saved history and chat.
      if (patch.incognito && !prev.incognito) {
        try {
          localStorage.removeItem(HISTORY_KEY);
          localStorage.removeItem(CHAT_KEY);
        } catch {
          /* storage unavailable */
        }
      }
      return next;
    });
  }, []);

  const recordSimulation = useCallback((sim: Omit<Simulation, "at">) => {
    setHistory((prev) => {
      const next = addToHistory(prev, { ...sim, at: new Date().toISOString() });
      if (!incognitoRef.current) persist(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const wipe = useCallback(() => {
    try {
      wipeLocalData(localStorage);
    } catch {
      /* storage unavailable */
    }
    // Keep stealth on screen if it was on, but don't write anything back to storage.
    setSettings((prev) => ({ ...DEFAULTS, stealth: prev.stealth }));
    setHistory([]);
    setChatState([]);
    setWipeCount((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ settings, hydrated, update, history, recordSimulation, wipe, wipeCount, chat, setChat }),
    [settings, hydrated, update, history, recordSimulation, wipe, wipeCount, chat, setChat],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

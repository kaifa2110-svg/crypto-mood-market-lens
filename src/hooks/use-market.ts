import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { fetchCmcSnapshot } from "@/lib/cmc.functions";
import { getDemoSnapshot } from "@/lib/demo-data";
import type { MarketSnapshot } from "@/lib/market";
import { useSettings } from "@/lib/settings";

export type MarketState = {
  snapshot: MarketSnapshot | undefined;
  wantsLive: boolean;
  isLive: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
};

export function useMarket(): MarketState {
  const { settings, hydrated } = useSettings();
  const wantsLive = !settings.useDemo && settings.apiKey.trim().length > 0;
  const fetchSnapshot = useServerFn(fetchCmcSnapshot);

  const live = useQuery({
    queryKey: ["cmc-snapshot", settings.apiKey],
    enabled: hydrated && wantsLive,
    queryFn: async () => {
      const res = await fetchSnapshot({ data: { apiKey: settings.apiKey.trim() } });
      if (!res.ok) {
        const hint =
          res.status === 401 || res.status === 403
            ? "API key was rejected — check it in Settings."
            : res.status === 429
              ? "Rate limit reached — try again in a minute."
              : res.error;
        throw new Error(hint);
      }
      return res.snapshot;
    },
    // CMC free plans have limited credits; refresh every 2 minutes.
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 1,
  });

  const useDemoFallback = !wantsLive || (live.isError && !live.data);
  const demo = useQuery({
    queryKey: ["demo-snapshot"],
    enabled: hydrated && useDemoFallback,
    queryFn: async () => getDemoSnapshot(),
    refetchInterval: 6_000,
  });

  const snapshot = wantsLive && live.data ? live.data : useDemoFallback ? demo.data : undefined;

  return {
    snapshot,
    wantsLive,
    isLive: wantsLive && !!live.data,
    isLoading: !snapshot,
    isFetching: wantsLive ? live.isFetching : demo.isFetching,
    error: wantsLive && live.error ? live.error.message : null,
    refetch: () => {
      void (wantsLive ? live.refetch() : demo.refetch());
    },
  };
}

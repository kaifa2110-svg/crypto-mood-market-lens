import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { REFERENCE_1Y_CHANGE } from "./demo-data";
import { PRIVACY_SYMBOLS, fearGreedLabel, type Coin, type MarketSnapshot } from "./market";

const CMC_BASE = "https://pro-api.coinmarketcap.com";

type CmcStatus = { error_code?: number; error_message?: string | null };

type CmcResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

async function cmcGet<T>(path: string, apiKey: string): Promise<CmcResult<T>> {
  try {
    const res = await fetch(`${CMC_BASE}${path}`, {
      headers: { "X-CMC_PRO_API_KEY": apiKey, Accept: "application/json" },
    });
    const body = (await res.json().catch(() => null)) as { status?: CmcStatus; data?: T } | null;
    if (!res.ok || !body || body.data == null) {
      const msg = body?.status?.error_message || `CoinMarketCap responded with ${res.status}`;
      console.error(`CMC ${path} failed`, res.status, msg);
      return { ok: false, status: res.status, message: msg };
    }
    return { ok: true, data: body.data };
  } catch (err) {
    console.error(`CMC ${path} network error`, err);
    return { ok: false, status: 0, message: "Could not reach CoinMarketCap" };
  }
}

type UsdQuote = {
  price: number;
  volume_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  percent_change_90d: number;
  market_cap: number;
};

type Listing = { id: number; name: string; symbol: string; cmc_rank: number | null; quote: { USD: UsdQuote } };

function mapListing(l: Listing): Coin {
  const q = l.quote.USD;
  return {
    id: l.id,
    rank: l.cmc_rank ?? 0,
    name: l.name,
    symbol: l.symbol,
    price: q.price,
    change1h: q.percent_change_1h ?? 0,
    change24h: q.percent_change_24h ?? 0,
    change7d: q.percent_change_7d ?? 0,
    change30d: q.percent_change_30d ?? 0,
    change90d: q.percent_change_90d ?? 0,
    change1y: REFERENCE_1Y_CHANGE[l.symbol] ?? null,
    marketCap: q.market_cap,
    volume24h: q.volume_24h,
  };
}

type GlobalData = {
  btc_dominance: number;
  eth_dominance: number;
  quote: {
    USD: {
      total_market_cap: number;
      total_volume_24h: number;
      total_market_cap_yesterday_percentage_change?: number;
      total_volume_24h_yesterday_percentage_change?: number;
    };
  };
};

type FearGreedData = { value: number; value_classification: string; update_time: string };

export type CmcSnapshotResponse =
  | { ok: true; snapshot: MarketSnapshot }
  | { ok: false; error: string; status: number };

/**
 * Server-side proxy to the CoinMarketCap Pro API. CMC blocks browser (CORS) calls,
 * so the user's key is sent here per request and forwarded as X-CMC_PRO_API_KEY.
 * The key is never stored on the server.
 */
export const fetchCmcSnapshot = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ apiKey: z.string().trim().min(8).max(128) }).parse(data),
  )
  .handler(async ({ data }): Promise<CmcSnapshotResponse> => {
    const key = data.apiKey;
    const [listings, global, fear, privacy] = await Promise.all([
      cmcGet<Listing[]>("/v1/cryptocurrency/listings/latest?start=1&limit=15&convert=USD", key),
      cmcGet<GlobalData>("/v1/global-metrics/quotes/latest?convert=USD", key),
      cmcGet<FearGreedData>("/v3/fear-and-greed/latest", key),
      cmcGet<Record<string, Listing[]>>(
        `/v2/cryptocurrency/quotes/latest?symbol=${PRIVACY_SYMBOLS.join(",")}&convert=USD`,
        key,
      ),
    ]);

    if (!listings.ok) return { ok: false, error: listings.message, status: listings.status };
    if (!global.ok) return { ok: false, error: global.message, status: global.status };

    const warnings: string[] = [];
    const coins: Coin[] = listings.data.map(mapListing);

    // Several tokens can share a symbol; keep the highest-ranked active one.
    const privacyCoins: Coin[] = [];
    if (privacy.ok) {
      for (const sym of PRIVACY_SYMBOLS) {
        const best = (privacy.data[sym] ?? [])
          .filter((l) => l.cmc_rank != null && l.quote?.USD?.price != null)
          .sort((a, b) => (a.cmc_rank ?? 1e9) - (b.cmc_rank ?? 1e9))[0];
        if (best) privacyCoins.push(mapListing(best));
      }
    } else {
      warnings.push(`Privacy coins unavailable: ${privacy.message}`);
    }

    let fearGreed = { value: 50, classification: "Neutral", updatedAt: new Date().toISOString() };
    if (fear.ok) {
      fearGreed = {
        value: Math.round(fear.data.value),
        classification: fear.data.value_classification || fearGreedLabel(fear.data.value),
        updatedAt: fear.data.update_time,
      };
    } else {
      warnings.push(`Fear & Greed unavailable: ${fear.message}`);
    }

    const g = global.data;
    const snapshot: MarketSnapshot = {
      coins,
      privacyCoins,
      global: {
        totalMarketCap: g.quote.USD.total_market_cap,
        totalVolume24h: g.quote.USD.total_volume_24h,
        btcDominance: g.btc_dominance,
        ethDominance: g.eth_dominance,
        marketCapChange24h: g.quote.USD.total_market_cap_yesterday_percentage_change ?? 0,
        volumeChange24h: g.quote.USD.total_volume_24h_yesterday_percentage_change ?? 0,
      },
      fearGreed,
      source: "live",
      fetchedAt: new Date().toISOString(),
      warnings,
    };
    return { ok: true, snapshot };
  });

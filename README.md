# CryptoPulser.com

**Powered by the CoinMarketCap API** — built for the CoinMarketCap API Hackathon.

CryptoPulser.com is a dark-mode crypto analytics dashboard that reads the market's mood at a glance and answers the question every holder asks: *"What if I had invested back then?"*

**Live app**: https://crypto-mood-market-lens.lovable.app

## Features

- **Real-time CMC Market Overview** — Global market cap, 24h volume, and BTC dominance cards, refreshed live from CoinMarketCap (`/v1/global-metrics/quotes/latest`).
- **Fear & Greed Gauge** — A visual sentiment meter powered by `/v3/fear-and-greed/latest`, so you can read the market's mood in one look.
- **Multi-Currency Switcher** — Every price, market cap, and calculator value converts instantly between USD, PKR, EUR, AED, and INR.
- **What-If Investment Simulator** — Pick a coin (BTC, ETH, SOL, BNB, XRP, DOGE), an amount, and a past timeframe (7D / 30D / 90D / 1Y) to see what that investment would be worth today, with profit/loss and a growth chart.
- **Top 100 Live Screener** — A searchable, sortable table of the top 100 cryptocurrencies (`/v1/cryptocurrency/listings/latest?limit=100`) with rank, price, 1h/24h/7d changes, market cap, and sparklines — paginated 20 per page, plus a Privacy Coins filter (XMR, ZEC, DASH, ROSE, SCRT).
- **Privacy Stealth Mode** — One tap masks all sensitive amounts (investment, profit, portfolio figures) behind `••••••` so nobody looking over your shoulder sees your numbers.
- **Local & Private by design** — Your API key, settings, and calculation history live only in your browser's localStorage. A one-click **Panic Wipe** erases everything instantly. No accounts, no cookies, no analytics.

## Demo mode — no key needed

Judges can try the full app immediately: without an API key it runs on realistic built-in demo data. Paste a free CoinMarketCap Pro key under **API Key** in the header to switch to live data (refreshes every 2 minutes to respect free-plan credits).

## How it connects to CoinMarketCap

All CMC calls go through a server-side proxy function with the `X-CMC_PRO_API_KEY` header, because CoinMarketCap blocks direct browser (CORS) requests. The key is sent per request and is **never stored server-side** — it only exists in your browser.

Endpoints used:

| Endpoint | Powers |
| --- | --- |
| `/v1/cryptocurrency/listings/latest` | Top 100 screener |
| `/v1/global-metrics/quotes/latest` | Market cap, volume, BTC dominance |
| `/v3/fear-and-greed/latest` | Fear & Greed gauge |

## Setup (for judges)

The hosted app needs no setup — open the live URL above. To run locally:

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Then open the local URL, click **API Key** in the header, and paste a free key from [coinmarketcap.com/api](https://coinmarketcap.com/api/) — or just leave it empty to explore with demo data.

## Tech stack

- React 19 + TanStack Start (SSR) + Vite
- Tailwind CSS v4 design system, dark-only fintech theme
- TanStack Query for live data caching and refresh
- Recharts for the What-If growth chart and sparklines

## Notes

- Exchange rates for the currency switcher are fixed, realistic values (e.g. 1 USD = 281.4 PKR), not live forex rates.
- Chart paths are anchored to real CMC percent changes; the in-between points are illustrative, since CMC historical endpoints require paid plans.

---

Built with [Lovable](https://lovable.dev).

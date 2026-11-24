# Crypto Mood Market Lens

Build a modern, sleek dark-mode crypto analytics web app called "CMC Pulse & What-If Simulator" built for the CoinMarketCap API Hackathon. Include the following features:

1. Header, Currency Switcher & API Key Input: A clean top navigation bar with the app logo, a "Live Market" badge, a Global Currency Switcher dropdown (USD, PKR, EUR, AED, INR) that dynamically converts all prices, market caps, and calculator values across the entire app using realistic exchange rates, and a sleek settings button/input field where the user can paste their CoinMarketCap Pro API Key (stored safely in browser localStorage, with a toggle to use built-in realistic live-style demo data if no key is entered yet so judges can test immediately).

2. Market Overview Cards: Top 4 cards showing Global Market Cap, 24h Volume, BTC Dominance, and a visual Crypto Fear & Greed Gauge meter.

3. Crypto "What-If" Investment Calculator: An interactive tool where users pick a coin (BTC, ETH, SOL, BNB, XRP, DOGE), enter an investment amount in their selected currency (e.g., $100 or equivalent in PKR/EUR/AED/INR), select a past timeframe (7 Days ago, 30 Days ago, 90 Days ago, 1 Year ago), and immediately see what that investment would be worth today, profit/loss percentage, and a clean area chart showing the growth.

4. Top Coins Live Screener Table: A searchable, sortable table of top 15 cryptocurrencies showing Rank, Name/Symbol, Live Price (in selected currency), 1h %, 24h %, 7d %, Market Cap, and a mini sparkline trend indicator.

5. CoinMarketCap API Integration: Configure real fetch calls to CoinMarketCap API endpoints (/v1/cryptocurrency/listings/latest, /v1/global-metrics/quotes/latest, and /v3/fear-and-greed/latest) using the X-CMC_PRO_API_KEY header via a CORS-friendly proxy fallback so real data loads seamlessly when the user enters their API key.

Make the UI look like a high-end fintech dashboard with smooth animations, responsive design, and clear error/loading states.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://crypto-mood-market-lens.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d681e470-8b20-47bf-818b-d462bce662e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

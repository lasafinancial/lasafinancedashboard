# LASA Dashboard - Complete Guide

## How The Dashboard Works

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW ARCHITECTURE                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │       GOOGLE SHEETS              │
                    │  (Your Source of Truth)          │
                    │                                  │
                    │  ┌────────────────────────┐      │
                    │  │ EOD Sheet (lasa-master)│      │
                    │  │ - Stock prices         │      │
                    │  │ - RSI, Trends          │      │
                    │  │ - Support/Resistance   │      │
                    │  │ - 1582 stocks          │      │
                    │  └────────────────────────┘      │
                    │                                  │
                    │  ┌────────────────────────┐      │
                    │  │ Swing Sheet (DATA)     │      │
                    │  │ - Market Strength      │      │
                    │  │ - ML predictions       │      │
                    │  │ - FG Above/Below       │      │
                    │  └────────────────────────┘      │
                    └──────────────┬───────────────────┘
                                   │
                                   │ Google Sheets API
                                   │ (needs Service Account)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API SERVER                                          │
│                                                                                  │
│   LOCAL (server.cjs)              │    VERCEL (api/fetch-data.js)               │
│   ─────────────────               │    ─────────────────────────                │
│   - Reads from local JSON key     │    - Reads from ENV variable                │
│   - Runs on port 3001             │    - Serverless function                    │
│   - You run: node server.cjs      │    - Auto-deployed                          │
│                                   │                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTP Request: GET /api/fetch-data
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                       │
│                                                                                  │
│   ┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────┐   │
│   │ googleSheetsService │───▶│    useLiveData      │───▶│   Dashboard      │   │
│   │                     │    │    (React Hook)     │    │   Components     │   │
│   │ - Fetches /api/     │    │                     │    │                  │   │
│   │ - Caches 5 min      │    │ - stockData         │    │ - Charts         │   │
│   │ - Auto-refreshes    │    │ - marketMood        │    │ - Tables         │   │
│   │                     │    │ - marketStrength    │    │ - Cards          │   │
│   └─────────────────────┘    │ - topMovers         │    │                  │   │
│                              │ - marketPosition    │    └──────────────────┘   │
│                              └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Website Pages & Their Files

| Page | URL Route | Main File | Description |
|------|-----------|-----------|-------------|
| Landing Page | `/` | `src/pages/Landing.tsx` | Welcome page with 3D animation |
| Dashboard | `/dashboard` | `src/pages/Dashboard.tsx` | Main market overview |
| Stock Analysis | `/stock-analysis` | `src/pages/StockAnalysis.tsx` | Individual stock details |
| Sectors | `/sectors` | `src/pages/Sectors.tsx` | Sector-wise breakdown |
| Multibagger | `/multibagger` | `src/pages/Multibagger.tsx` | Potential multibagger stocks |
| Backtests | `/backtests` | `src/pages/Backtests.tsx` | Strategy backtesting |

---

## Dashboard Components & File Mapping

### DASHBOARD PAGE (`/dashboard`)

| Section on Screen | Component File | Data Hook | Data Source |
|-------------------|----------------|-----------|-------------|
| **Navigation Bar** | `src/components/layout/Navbar.tsx` | - | Static |
| **Theme Toggle (Dark/Light)** | `src/components/layout/ThemeToggle.tsx` | - | Local state |
| **Market Strength Meter** | `src/components/charts/MarketStrengthMeter.tsx` | `useMarketStrength()` | Google Sheets → Swing DATA |
| **ML Strength Meter** | `src/components/charts/MLStrengthMeter.tsx` | `useMarketStrength()` | Google Sheets → Swing DATA |
| **Market Balance Indicator** | `src/components/charts/MarketBalanceIndicator.tsx` | `useMarketStrength()` | Google Sheets → Swing DATA |
| **Market Position Structure** | `src/components/charts/MarketPositionStructure.tsx` | `useMarketPosition()` | Google Sheets → Swing DATA |
| **Nifty Close Chart** | `src/components/charts/NiftyCloseChart.tsx` | - | Static data |
| **RSI Gauge** | `src/components/charts/RSIGauge.tsx` | - | Props from parent |
| **Sentiment Pie Chart** | `src/components/charts/SentimentPieChart.tsx` | - | Props from parent |
| **Overall Sentiment** | `src/components/charts/OverallSentiment.tsx` | - | Props from parent |
| **Top Gainers/Losers** | Inside `Dashboard.tsx` | `useTopMovers()` | Google Sheets → EOD |
| **Indices Performance** | `src/components/cards/IndicesPerformance.tsx` | `useStockData()` | Google Sheets → EOD |
| **Sector Cards** | `src/components/cards/SectorCard.tsx` | - | Props from parent |
| **AI Chatbot** | `src/components/AIChatbot.tsx` | - | AI API |

### STOCK ANALYSIS PAGE (`/stock-analysis`)

| Section on Screen | Component File | Data Hook | Data Source |
|-------------------|----------------|-----------|-------------|
| **Stock Data Table** | `src/components/tables/StockDataTable.tsx` | `useStockData()` | Google Sheets → EOD |
| **Stock Price Chart** | `src/components/charts/StockPriceChart.tsx` | - | Props from parent |
| **Stock Strength Zone** | `src/components/charts/StockStrengthZone.tsx` | - | Props from parent |
| **Glowing Line Chart** | `src/components/charts/GlowingLineChart.tsx` | - | Props from parent |

---

## Data Flow: File by File

### Backend Files (API Layer)

| File | Type | Purpose | When Used |
|------|------|---------|-----------|
| `server.cjs` | CommonJS | Local API server | Run with `node server.cjs` locally |
| `api/fetch-data.js` | ES Module | Vercel serverless function | Auto-runs on Vercel |
| `secerate_googlekey/*.json` | JSON | Google Service Account credentials | Read by server.cjs locally |

### Frontend Service Files

| File | Type | Purpose | Key Functions |
|------|------|---------|---------------|
| `src/lib/googleSheetsService.ts` | TypeScript | Fetches data from API | `fetchGoogleSheetsData()`, `subscribeToData()`, `refreshAllData()` |
| `src/hooks/useLiveData.ts` | TypeScript | React hooks for live data | `useStockData()`, `useMarketStrength()`, `useTopMovers()`, `useMarketPosition()` |
| `src/data/stockData.ts` | TypeScript | Static fallback data | Used when API fails |
| `src/lib/market-analysis.ts` | TypeScript | Market calculations | Helper functions for analysis |

---

## Component Dependency Tree

```
App.tsx
├── Navbar.tsx (layout)
│   ├── NavLink.tsx
│   └── ThemeToggle.tsx
│
├── Landing.tsx (page: /)
│   ├── interactive-hero.tsx
│   ├── spline-scene-basic.tsx
│   └── twitter-testimonial-cards.tsx
│
├── Dashboard.tsx (page: /dashboard)
│   │
│   ├── ┌─────────────────────────────────────┐
│   │   │     MARKET OVERVIEW SECTION         │
│   │   ├─────────────────────────────────────┤
│   │   │ MarketStrengthMeter.tsx             │ ← useMarketStrength()
│   │   │ MLStrengthMeter.tsx                 │ ← useMarketStrength()
│   │   │ MarketBalanceIndicator.tsx          │ ← useMarketStrength()
│   │   └─────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────┐
│   │   │     MARKET POSITION SECTION         │
│   │   ├─────────────────────────────────────┤
│   │   │ MarketPositionStructure.tsx         │ ← useMarketPosition()
│   │   └─────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────┐
│   │   │     TOP MOVERS SECTION              │
│   │   ├─────────────────────────────────────┤
│   │   │ (Built into Dashboard.tsx)          │ ← useTopMovers()
│   │   │ Shows Top Gainers & Top Losers      │
│   │   └─────────────────────────────────────┘
│   │
│   ├── ┌─────────────────────────────────────┐
│   │   │     INDICES SECTION                 │
│   │   ├─────────────────────────────────────┤
│   │   │ IndicesPerformance.tsx              │ ← useStockData()
│   │   └─────────────────────────────────────┘
│   │
│   └── AIChatbot.tsx
│
├── StockAnalysis.tsx (page: /stock-analysis)
│   ├── StockDataTable.tsx                    │ ← useStockData()
│   ├── StockPriceChart.tsx
│   └── StockStrengthZone.tsx
│
├── Sectors.tsx (page: /sectors)
│   └── SectorCard.tsx
│
├── Multibagger.tsx (page: /multibagger)
│
└── Backtests.tsx (page: /backtests)
```

---

## Data Hooks Explained

| Hook | File | What It Returns | Where Data Comes From |
|------|------|-----------------|----------------------|
| `useStockData()` | `useLiveData.ts` | `{ stocks, isLoading }` | EOD sheet (all 1582 stocks) |
| `useMarketStrength()` | `useLiveData.ts` | `{ marketStrength, isLoading }` | Swing DATA sheet (FG Above/Below, ML values) |
| `useTopMovers()` | `useLiveData.ts` | `{ topMovers, isLoading }` | Calculated from EOD data |
| `useMarketPosition()` | `useLiveData.ts` | `{ data, isLoading }` | Swing DATA sheet |

---

## Google Sheets → Dashboard Mapping

### EOD Sheet (lasa-master) Columns:

| Sheet Column | Used In | Component |
|--------------|---------|-----------|
| SYMBOL | Stock table, search | StockDataTable.tsx |
| NAME | Display name | StockDataTable.tsx |
| CLOSE | Current price | Dashboard.tsx, StockDataTable.tsx |
| CHANGE% | Price change | IndicesPerformance.tsx, Top Movers |
| RSI | RSI gauge | RSIGauge.tsx |
| TREND | Trend indicator | StockDataTable.tsx |
| SUPPORT | Support level | StockStrengthZone.tsx |
| RESISTANCE | Resistance level | StockStrengthZone.tsx |
| SECTOR | Sector filtering | Sectors.tsx |

### Swing DATA Sheet Columns:

| Sheet Column | Used In | Component |
|--------------|---------|-----------|
| FG ABOVE | Market strength | MarketStrengthMeter.tsx |
| FG BELOW | Market strength | MarketStrengthMeter.tsx |
| ML 1.0 | ML prediction | MLStrengthMeter.tsx |
| ML 1.5 | ML prediction | MLStrengthMeter.tsx |
| MODEL | Position structure | MarketPositionStructure.tsx |
| S.R. | Support/Resistance | MarketPositionStructure.tsx |

---

## Service Account & API Keys

### What is a Service Account?

A Service Account is like a robot user that can access your Google Sheets without needing to log in.

```
Your Service Account:
┌────────────────────────────────────────────────────────────────┐
│  Email: something@key-partition-484615-n5.iam.gserviceaccount.com │
│  Private Key: (inside the JSON file)                            │
│  Location: secerate_googlekey/key-partition-484615-n5-*.json    │
└────────────────────────────────────────────────────────────────┘
```

### How Authentication Works

```
┌──────────────────────────────────────────────────────────────────┐
│                     LOCAL DEVELOPMENT                             │
├──────────────────────────────────────────────────────────────────┤
│   server.cjs reads the JSON file directly from:                  │
│   secerate_googlekey/key-partition-484615-n5-52acc9edc675.json   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     VERCEL PRODUCTION                             │
├──────────────────────────────────────────────────────────────────┤
│   api/fetch-data.js reads from Environment Variable:             │
│   GOOGLE_SERVICE_ACCOUNT_KEY = (entire JSON content as string)   │
│   Set in: Vercel Dashboard → Settings → Environment Variables    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Running Locally (Your Laptop)

### You Need TWO Terminals

```
┌─────────────────────────────────────────────────────────────────┐
│  TERMINAL 1: API Server (Live Data)                              │
├─────────────────────────────────────────────────────────────────┤
│  cd "C:\Users\THARAN\Downloads\LASA dashboard\market-pulse-dashboard-main" │
│  node server.cjs                                                 │
│                                                                   │
│  Output: API server running on http://localhost:3001             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TERMINAL 2: Frontend (Vite Dev Server)                          │
├─────────────────────────────────────────────────────────────────┤
│  cd "C:\Users\THARAN\Downloads\LASA dashboard\market-pulse-dashboard-main" │
│  npm run dev                                                     │
│                                                                   │
│  Output: Local: http://localhost:8080                            │
└─────────────────────────────────────────────────────────────────┘
```

### Local Development Flow

```
Your Browser (localhost:8080)
         │
         │ GET /api/fetch-data
         ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Vite Server   │ proxy   │   API Server    │  API    │  Google Sheets  │
│   (port 8080)   │────────▶│   (port 3001)   │────────▶│                 │
│                 │         │   server.cjs    │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## Deploying to Vercel (Production)

```
STEP 1: Push to GitHub
────────────────────────────────────────────────────────────────────
$ git add .
$ git commit -m "Ready for deployment"
$ git push origin main

STEP 2: Connect to Vercel
────────────────────────────────────────────────────────────────────
1. Go to vercel.com
2. Click "Add New Project"
3. Import your GitHub repository

STEP 3: Add Environment Variable (CRITICAL!)
────────────────────────────────────────────────────────────────────
In Vercel Dashboard → Settings → Environment Variables:

  Name:  GOOGLE_SERVICE_ACCOUNT_KEY
  Value: (paste ENTIRE content of your JSON key file)

STEP 4: Deploy
────────────────────────────────────────────────────────────────────
Click "Deploy" - Done!
```

---

## Complete File Reference Table

| File Path | Type | Purpose | Connects To |
|-----------|------|---------|-------------|
| **API LAYER** |
| `server.cjs` | CommonJS | Local API server | Google Sheets API |
| `api/fetch-data.js` | ES Module | Vercel serverless API | Google Sheets API |
| `secerate_googlekey/*.json` | JSON | Credentials | Used by server.cjs |
| **DATA LAYER** |
| `src/lib/googleSheetsService.ts` | TypeScript | Frontend API client | server.cjs or api/fetch-data.js |
| `src/hooks/useLiveData.ts` | TypeScript | React data hooks | googleSheetsService.ts |
| `src/data/stockData.ts` | TypeScript | Static fallback data | Used when API fails |
| `src/lib/market-analysis.ts` | TypeScript | Analysis helpers | Used by components |
| **PAGES** |
| `src/App.tsx` | React | Main app + routing | All pages |
| `src/pages/Landing.tsx` | React | Home page | UI components |
| `src/pages/Dashboard.tsx` | React | Main dashboard | All chart components |
| `src/pages/StockAnalysis.tsx` | React | Stock details | Table + chart components |
| `src/pages/Sectors.tsx` | React | Sector view | SectorCard |
| `src/pages/Multibagger.tsx` | React | Multibagger stocks | Data hooks |
| `src/pages/Backtests.tsx` | React | Backtesting | Data hooks |
| **CHART COMPONENTS** |
| `src/components/charts/MarketStrengthMeter.tsx` | React | FG Above/Below gauge | useMarketStrength() |
| `src/components/charts/MLStrengthMeter.tsx` | React | ML prediction gauge | useMarketStrength() |
| `src/components/charts/MarketBalanceIndicator.tsx` | React | Bull/Bear balance | useMarketStrength() |
| `src/components/charts/MarketPositionStructure.tsx` | React | Model/SR structure | useMarketPosition() |
| `src/components/charts/NiftyCloseChart.tsx` | React | Nifty price chart | Static data |
| `src/components/charts/RSIGauge.tsx` | React | RSI indicator | Props |
| `src/components/charts/SentimentPieChart.tsx` | React | Market sentiment | Props |
| `src/components/charts/OverallSentiment.tsx` | React | Overall mood | Props |
| `src/components/charts/StockPriceChart.tsx` | React | Individual stock chart | Props |
| `src/components/charts/StockStrengthZone.tsx` | React | Support/Resistance | Props |
| `src/components/charts/GlowingLineChart.tsx` | React | Animated line chart | Props |
| **CARD COMPONENTS** |
| `src/components/cards/IndicesPerformance.tsx` | React | Index cards | useStockData() |
| `src/components/cards/SectorCard.tsx` | React | Sector summary | Props |
| **TABLE COMPONENTS** |
| `src/components/tables/StockDataTable.tsx` | React | Stock data grid | useStockData() |
| **LAYOUT COMPONENTS** |
| `src/components/layout/Navbar.tsx` | React | Navigation | NavLink |
| `src/components/layout/ThemeToggle.tsx` | React | Dark/Light toggle | Local state |
| `src/components/NavLink.tsx` | React | Nav item | React Router |
| **OTHER** |
| `src/components/AIChatbot.tsx` | React | AI assistant | AI API |
| `vite.config.ts` | TypeScript | Dev server config | Proxy to server.cjs |

---

## Data Refresh Cycle

```
┌────────────────────────────────────────────────────────────────────┐
│                    AUTO-REFRESH EVERY 5 MINUTES                    │
└────────────────────────────────────────────────────────────────────┘

Time ────────────────────────────────────────────────────────────────▶
0:00      5:00      10:00     15:00     20:00
  │         │         │         │         │
  ▼         ▼         ▼         ▼         ▼
┌───┐     ┌───┐     ┌───┐     ┌───┐     ┌───┐
│API│     │API│     │API│     │API│     │API│
└───┘     └───┘     └───┘     └───┘     └───┘
  │         │         │         │         │
  ▼         ▼         ▼         ▼         ▼
Dashboard updates automatically with fresh data
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank screen locally | Make sure `node server.cjs` is running in Terminal 1 |
| "No credentials found" | Check `secerate_googlekey/` folder has the JSON file |
| Data not updating | Refresh browser, check server.cjs console for errors |
| Vercel shows error | Check Environment Variables are set correctly |

---

## Security Notes

```
NEVER commit your service account JSON key to GitHub!

The .gitignore file already excludes:
  - secerate_googlekey/
  - *.json (except package.json, tsconfig*.json)
  - .env files

For Vercel: The key is stored securely in Environment Variables.
```

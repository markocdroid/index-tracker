# Global Index Tracker

A modern stock market tracker tracking the **Top 20 Global Market Indexes**.

Features dynamic tile sizing based on market standing, high-contrast Red (Down) and Green (Up) live tiles, interactive 3D flip cards, market breadth analysis, trading session clocks, responsive design across mobile/tablet/desktop, and a built-in real-time market engine.

---

## 🚀 Quick Start

### 1. Run the Development Server
From the workspace root or inside `Index-Tracker`:

```bash
npm run dev
# or
npm --prefix Index-Tracker run dev
```

Open your browser at `http://localhost:5173`.

---

## 🌐 Top 20 Global Indexes Tracked

| # | Index Name | Benchmark Ticker | Proxy Symbol | Region | Country |
|---|------------|------------------|--------------|--------|---------|
| 1 | **S&P 500** | `^GSPC` | `SPY` | Americas | 🇺🇸 United States |
| 2 | **NASDAQ 100** | `^NDX` | `QQQ` | Americas | 🇺🇸 United States |
| 3 | **Dow Jones Industrial** | `^DJI` | `DIA` | Americas | 🇺🇸 United States |
| 4 | **Russell 2000** | `^RUT` | `IWM` | Americas | 🇺🇸 United States |
| 5 | **FTSE 100** | `^FTSE` | `EWU` | Europe | 🇬🇧 United Kingdom |
| 6 | **DAX 40** | `^GDAXI` | `EWG` | Europe | 🇩🇪 Germany |
| 7 | **CAC 40** | `^FCHI` | `EWQ` | Europe | 🇫🇷 France |
| 8 | **Nikkei 225** | `^N225` | `EWJ` | Asia-Pacific | 🇯🇵 Japan |
| 9 | **Hang Seng Index** | `^HSI` | `EWH` | Asia-Pacific | 🇭🇰 Hong Kong |
| 10 | **CSI 300** | `000300.SS` | `ASHR` | Asia-Pacific | 🇨🇳 China |
| 11 | **Euro Stoxx 50** | `^STOXX50E` | `FEZ` | Europe | 🇪🇺 Eurozone |
| 12 | **S&P/TSX 60** | `^TX60` | `EWC` | Americas | 🇨🇦 Canada |
| 13 | **S&P/ASX 200** | `^AXJO` | `EWA` | Asia-Pacific | 🇦🇺 Australia |
| 14 | **NIFTY 50** | `^NSEI` | `INDA` | Asia-Pacific | 🇮🇳 India |
| 15 | **KOSPI 200** | `^KS11` | `EWY` | Asia-Pacific | 🇰🇷 South Korea |
| 16 | **Bovespa (Ibovespa)** | `^BVSP` | `EWZ` | Americas | 🇧🇷 Brazil |
| 17 | **Swiss Market Index (SMI)** | `^SSMI` | `EWL` | Europe | 🇨🇭 Switzerland |
| 18 | **S&P/BMV IPC** | `^MXX` | `EWW` | Americas | 🇲🇽 Mexico |
| 19 | **Straits Times Index (STI)** | `^STI` | `EWS` | Asia-Pacific | 🇸🇬 Singapore |
| 20 | **MSCI ACWI (All Country World)** | `ACWI` | `ACWI` | Global | 🌐 Global |

---

## 📱 Cross-Device Responsive Design

- **Desktop & PC (1200px+)**: Multi-column live grid with dense packing; Large (2x2), Wide (2x1), Medium (1x1), and Small tiles pack with zero gaps.
- **Tablets (768px - 1199px)**: 3-to-4 column responsive grid, horizontal-scrollable region tabs and market sessions.
- **Mobile Phones (< 540px)**: 2-column mobile layout with optimized typography, touch-friendly controls, full-screen slideout modal and drawer, and smooth horizontal scrolling for session badges and region selectors.

---

## 🎨 Key Features

1. **Red if Down, Green if Up**:
   - **Green** (`#107c10` / `#008a00`): Advancing indices, upward arrow `▲`, positive change.
   - **Red** (`#e81123` / `#d83b01`): Declining indices, downward arrow `▼`, negative change.
   - Switchable between **Vibrant Color Tiles** and **Matte Dark Surface**.
2. **Dynamic Tile Sizing ("Where They Stand")**:
   - **Move Magnitude (Default)**: Today's biggest market movers receive **Large (2x2)** tiles with full SVG sparklines and Day High/Low bars; moderate movers receive **Wide (2x1)**, and stable indices receive **Medium (1x1)** tiles.
   - **Leaderboard Standing**: Ranks indices from #1 to #20 with prominent placement for top gainers/decliners.
   - **Global Market Tier**: Mega-cap anchor indices (S&P 500, NASDAQ, Nikkei, FTSE, DAX) are prioritized.
   - **Custom Resize**: Change individual tiles between Small, Medium, Wide, and Large.
3. **Live Tile Flip Animation**:
   - Click `⟲` on any tile to rotate in 3D and reveal deeper technical statistics (Open, Previous Close, Day High/Low, 52W High/Low, P/E ratio).
4. **Interactive Modal Dialog**:
   - Click any tile to open a modal with multi-timeframe charts (1D, 5D, 1M, 6M, 1Y, 5Y), full index descriptions, and deep technical statistics.
5. **Settings Panel**:
   - Slide-in drawer to manage live simulation playback, audio feedback toggles, and instant baseline resets.
6. **Generic Financial Branding**:
   - Custom financial candlestick and trend line icon for brand header and browser favicon.
7. **Live Online Symbol & Index Lookup**:
   - When a search query matches none of the 20 local benchmarks, the application automatically queries global financial markets online (e.g. `NVDA`, `AAPL`, `MSFT`, `^VIX`, `BTC-USD`), fetches live prices, ranges, and sparklines, and renders a live interactive tile right into the grid.

---

## TradingView Embeds & Compliance

This app embeds official TradingView widgets as-is and keeps required attribution visible.

- Attribution is preserved (for example, “Track all markets on TradingView” / TradingView links).
- Widgets load directly from TradingView CDN embeds.
- Underlying TradingView widget data is not scraped, stored, republished, or redistributed outside widget usage.
- Widget containers use explicit heights and visible overflow to avoid clipping widget controls/popups.
- Time zone/localization are configurable in the chart widget configuration.

For custom data feeds, white-labeling, deeper API control, or enterprise/commercial arrangements beyond standard widget embedding, review TradingView’s official docs and policies:

- https://www.tradingview.com/widget-docs/
- https://www.tradingview.com/policies/

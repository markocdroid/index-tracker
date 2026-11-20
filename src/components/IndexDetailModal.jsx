import { useState, useEffect, useMemo } from 'react';
import { playFeedbackSound } from '../utils/audioUtils';
import { getTradingViewSymbol } from '../utils/tradingViewSymbols';
import TradingViewChart from './TradingViewChart';

const TIMEFRAME_CONFIG = {
  '1D': { count: 12, volatility: 0.015 },
  '5D': { count: 24, volatility: 0.03 },
  '1M': { count: 30, volatility: 0.06 },
  '6M': { count: 40, volatility: 0.12 },
  '1Y': { count: 52, volatility: 0.20 },
  '5Y': { count: 60, volatility: 0.35 },
};

const DEFAULT_TIMEFRAME_CONFIG = TIMEFRAME_CONFIG['1D'];

// Pure deterministic curve generator based on index characteristics
function generateDeterministicChartPoints(index, tf) {
  const base = index.basePrice;
  const isUp = index.baseChangePercent >= 0;
  const { count, volatility } = TIMEFRAME_CONFIG[tf] ?? DEFAULT_TIMEFRAME_CONFIG;
  const seed = (index.ticker.charCodeAt(0) || 50) + (index.proxySymbol.charCodeAt(0) || 30);
  const points = [];
  const startPrice = isUp ? base * (1 - volatility * 0.7) : base * (1 + volatility * 0.7);
  let cur = startPrice;

  for (let i = 0; i < count; i++) {
    const sineFactor = Math.sin((i + seed) * 0.8) * Math.cos((i * 0.4) + seed);
    const trendDrift = (base - startPrice) / count;
    cur += (sineFactor * (base * volatility * 0.08)) + trendDrift;
    points.push(cur);
  }
  points[points.length - 1] = base;
  return points;
}

export default function IndexDetailModal({
  index,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('tradingview'); // 'tradingview' | 'svg'
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const chartData = useMemo(() => {
    if (!index) return [];
    return generateDeterministicChartPoints(index, selectedTimeframe);
  }, [index, selectedTimeframe]);

  if (!index) return null;

  const tvSymbol = getTradingViewSymbol(index);
  const isUp = index.baseChangePercent >= 0;
  const statusColorClass = isUp ? 'tile-up-green' : 'tile-down-red';
  const timeframes = ['1D', '5D', '1M', '6M', '1Y', '5Y'];

  const minVal = chartData.length > 0 ? Math.min(...chartData) : index.basePrice;
  const maxVal = chartData.length > 0 ? Math.max(...chartData) : index.basePrice;
  const spread = Math.max(0.01, maxVal - minVal);
  const chartWidth = 600;
  const chartHeight = 200;

  const svgPoints = chartData.map((val, idx) => {
    const x = (idx / (chartData.length - 1)) * chartWidth;
    const y = chartHeight - ((val - minVal) / spread) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Top Bar */}
        <div className={`modal-header-strip ${statusColorClass}`}>
          <div className="modal-title-wrap">
            <span className="modal-flag">{index.flag}</span>
            <div>
              <div id="modal-title" className="modal-index-name">{index.fullName}</div>
              <div className="modal-index-meta">
                <span>{index.ticker}</span>
                <span className="divider">•</span>
                <span>{index.exchange}</span>
                <span className="divider">•</span>
                <span>{index.country} ({index.region})</span>
              </div>
            </div>
          </div>

          <div className="modal-price-strip">
            <span className="modal-price">{index.currency} {Number(index.basePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="modal-change">
              {isUp ? '▲ +' : '▼ '}
              {Number(index.baseChange).toFixed(2)} ({Number(index.baseChangePercent).toFixed(2)}%)
            </span>
          </div>

          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)" aria-label="Close dialog">
            ✕
          </button>
        </div>

        {/* Modal Tab Switcher: TradingView Live vs SVG Overview */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'tradingview' ? 'active' : ''}`}
            onClick={() => {
              playFeedbackSound('click');
              setActiveTab('tradingview');
            }}
          >
            📊 TradingView Live Chart
          </button>
          <button
            className={`modal-tab ${activeTab === 'svg' ? 'active' : ''}`}
            onClick={() => {
              playFeedbackSound('click');
              setActiveTab('svg');
            }}
          >
            📈 Technical Curve
          </button>
        </div>

        {/* Content: Overview & Chart */}
        <div className="modal-tab-content">
          <p className="modal-description">{index.description}</p>

          {activeTab === 'tradingview' ? (
            <div className="modal-tv-widget-wrap">
              <div className="tv-widget-header">
                <span className="tv-symbol-label">
                  TRADINGVIEW REAL-TIME FEED • <span className="text-accent">{tvSymbol}</span>
                </span>
                <span className="tv-public-badge">Public Widget (No API Key)</span>
              </div>
              <TradingViewChart symbol={tvSymbol} height={260} theme="dark" />
            </div>
          ) : (
            <>
              {/* Timeframe Selector */}
              <div className="chart-header">
                <span className="chart-title">HISTORICAL PERFORMANCE</span>
                <div className="timeframe-buttons">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      className={`tf-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                      onClick={() => {
                        playFeedbackSound('click');
                        setSelectedTimeframe(tf);
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="modal-chart-box">
                <div className="chart-axes">
                  <span>High: {maxVal.toFixed(2)}</span>
                  <span>Low: {minVal.toFixed(2)}</span>
                </div>
                <svg className="modal-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isUp ? '#107c10' : '#e81123'} stopOpacity="0.35" />
                      <stop offset="100%" stopColor={isUp ? '#107c10' : '#e81123'} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    fill="url(#chartGradient)"
                    points={`0,${chartHeight} ${svgPoints} ${chartWidth},${chartHeight}`}
                  />
                  <polyline
                    fill="none"
                    stroke={isUp ? '#107c10' : '#e81123'}
                    strokeWidth="3"
                    points={svgPoints}
                  />
                </svg>
              </div>
            </>
          )}

          {/* Technical Stats Grid */}
          <div className="modal-stats-grid">
            <div className="metric-box">
              <span className="m-label">OPEN</span>
              <span className="m-val">{Number(index.openPrice).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">PREVIOUS CLOSE</span>
              <span className="m-val">{Number(index.prevClose).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">DAY HIGH</span>
              <span className="m-val">{Number(index.dayHigh).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">DAY LOW</span>
              <span className="m-val">{Number(index.dayLow).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">52-WEEK HIGH</span>
              <span className="m-val">{Number(index.yearHigh).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">52-WEEK LOW</span>
              <span className="m-val">{Number(index.yearLow).toFixed(2)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">TRADING VOLUME</span>
              <span className="m-val">{index.volume}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">EST. MARKET CAP</span>
              <span className="m-val">{index.marketCap}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">TRADINGVIEW SYMBOL</span>
              <span className="m-val text-accent">{tvSymbol}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">BENCHMARK PROXY</span>
              <span className="m-val text-accent">{index.proxySymbol}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="footer-tip">
            <span>TradingView Widget Integration • Press ESC to close</span>
          </div>
          <button className="app-button secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

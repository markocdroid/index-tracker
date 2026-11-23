import { useState, useEffect } from 'react';
import { playFeedbackSound } from '../utils/audioUtils';
import { getTradingViewSymbol } from '../utils/tradingViewSymbols';
import TradingViewChart from './TradingViewChart';
import TradingViewTileQuote from './TradingViewTileQuote';

export default function IndexDetailModal({
  index,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('tradingview'); // 'tradingview' | 'svg'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!index) return null;

  const tvSymbol = getTradingViewSymbol(index);
  const statusColorClass = 'tile-up-green';

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

          <div className="modal-price-strip modal-tv-quote-strip">
            <TradingViewTileQuote
              symbol={tvSymbol}
              height={54}
              theme="dark"
              locale="en"
            />
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
            📈 Technical Curve (TradingView)
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
              <TradingViewChart symbol={tvSymbol} interval="D" height={260} theme="dark" />
            </div>
          ) : (
            <div className="modal-tv-widget-wrap">
              <div className="tv-widget-header">
                <span className="tv-symbol-label">
                  TRADINGVIEW TECHNICAL CURVE • <span className="text-accent">{tvSymbol}</span>
                </span>
                <span className="tv-public-badge">TradingView Data</span>
              </div>
              <TradingViewChart symbol={tvSymbol} interval="60" height={260} theme="dark" />
            </div>
          )}

          {/* TradingView Source Grid */}
          <div className="modal-stats-grid">
            <div className="metric-box">
              <span className="m-label">LIVE SOURCE</span>
              <span className="m-val">TradingView Widget</span>
            </div>
            <div className="metric-box">
              <span className="m-label">TRADINGVIEW SYMBOL</span>
              <span className="m-val text-accent">{tvSymbol}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">INDEX TICKER</span>
              <span className="m-val">{index.ticker}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">BENCHMARK PROXY</span>
              <span className="m-val text-accent">{index.proxySymbol}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">EXCHANGE</span>
              <span className="m-val">{index.exchange}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">COUNTRY</span>
              <span className="m-val">{index.country}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">REGION</span>
              <span className="m-val">{index.region}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">ATTRIBUTION</span>
              <span className="m-val">Track all markets on TradingView</span>
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

import { useEffect, useMemo, useState } from 'react';
import { playFeedbackSound } from '../utils/audioUtils';
import { fetchYahooIndexHistory } from '../services/yahooIndexService';

const formatNumber = (value, digits = 2) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
};

const formatVolume = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

const buildPath = (values, width = 780, height = 180) => {
  const clean = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (clean.length < 2) return '';

  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const span = max - min || 1;

  return clean
    .map((v, i) => {
      const x = (i / (clean.length - 1)) * width;
      const y = height - ((v - min) / span) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};

export default function IndexDetailModal({
  index,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('1d');
  const [historyData, setHistoryData] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!index) return;

    let cancelled = false;

    const load = async () => {
      setIsHistoryLoading(true);
      try {
        const range = activeTab === '1d' ? '1d' : '1mo';
        const interval = activeTab === '1d' ? '5m' : '1d';
        const points = await fetchYahooIndexHistory(index.ticker, range, interval);
        if (!cancelled) {
          setHistoryData(points);
          setHistoryError('');
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(err instanceof Error ? err.message : 'Unable to load chart data');
          setHistoryData([]);
        }
      } finally {
        if (!cancelled) {
          setIsHistoryLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [index, activeTab]);

  if (!index) return null;

  const hasLiveQuote = Number.isFinite(Number(index.basePrice));
  const statusColorClass = !hasLiveQuote
    ? 'tile-neutral'
    : index.baseChangePercent >= 0
      ? 'tile-up-green'
      : 'tile-down-red';
  const chartSeries = useMemo(() => {
    if (historyData.length > 1) {
      return historyData.map((p) => p.close);
    }
    const fallback = Array.isArray(index.sparkline) ? index.sparkline : [];
    return fallback.map((v) => Number(v)).filter((v) => Number.isFinite(v));
  }, [historyData, index.sparkline, index.prevClose, index.basePrice]);

  const chartMin = chartSeries.length ? Math.min(...chartSeries) : 0;
  const chartMax = chartSeries.length ? Math.max(...chartSeries) : 0;
  const changePrefix = index.baseChangePercent >= 0 ? '+' : '';

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
            <span className="modal-price">{hasLiveQuote ? formatNumber(index.basePrice) : '—'}</span>
            {hasLiveQuote ? (
              <span className="modal-change">
                {changePrefix}{formatNumber(index.baseChange)} ({changePrefix}{formatNumber(index.baseChangePercent)}%)
              </span>
            ) : (
              <span className="modal-change">Waiting for live quote…</span>
            )}
          </div>

          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)" aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === '1d' ? 'active' : ''}`}
            onClick={() => {
              playFeedbackSound('click');
              setActiveTab('1d');
            }}
          >
            📊 1D Intraday
          </button>
          <button
            className={`modal-tab ${activeTab === '1mo' ? 'active' : ''}`}
            onClick={() => {
              playFeedbackSound('click');
              setActiveTab('1mo');
            }}
          >
            📈 1M Trend
          </button>
        </div>

        <div className="modal-tab-content">
          <p className="modal-description">{index.description}</p>

          <div className="modal-chart-box">
            <div className="chart-header">
              <span className="chart-title">
                YAHOO FINANCE {activeTab === '1d' ? 'INTRADAY' : '1-MONTH'} • {index.ticker}
              </span>
              <div className="timeframe-buttons">
                <button className={`tf-btn ${activeTab === '1d' ? 'active' : ''}`} onClick={() => setActiveTab('1d')}>1D</button>
                <button className={`tf-btn ${activeTab === '1mo' ? 'active' : ''}`} onClick={() => setActiveTab('1mo')}>1M</button>
              </div>
            </div>

            <div className="chart-axes">
              <span>{formatNumber(chartMin)}</span>
              <span>{isHistoryLoading ? 'Loading…' : historyData.length ? `${historyData.length} points` : 'Fallback'}</span>
              <span>{formatNumber(chartMax)}</span>
            </div>

            <svg className="modal-svg" viewBox="0 0 780 180" preserveAspectRatio="none" role="img" aria-label="Index chart">
              {chartSeries.length > 1 && (
                <path
                  d={buildPath(chartSeries, 780, 180)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {historyError && (
              <div className="tv-widget-header">
                <span className="tv-public-badge" style={{ color: '#ffb3b3' }}>{historyError}</span>
              </div>
            )}
          </div>

          <div className="modal-stats-grid">
            <div className="metric-box">
              <span className="m-label">SOURCE</span>
              <span className="m-val">Yahoo Finance</span>
            </div>
            <div className="metric-box">
              <span className="m-label">INDEX TICKER</span>
              <span className="m-val text-accent">{index.ticker}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">DAY HIGH / LOW</span>
              <span className="m-val">{formatNumber(index.dayHigh)} / {formatNumber(index.dayLow)}</span>
            </div>
            <div className="metric-box">
              <span className="m-label">52W HIGH / LOW</span>
              <span className="m-val text-accent">{formatNumber(index.yearHigh)} / {formatNumber(index.yearLow)}</span>
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
              <span className="m-label">VOLUME</span>
              <span className="m-val">{formatVolume(index.volume)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-tip">
            <span>
              Public data by <a className="source-link" href="https://finance.yahoo.com/" target="_blank" rel="noopener nofollow">Yahoo Finance</a> • Press ESC to close
            </span>
          </div>
          <button className="app-button secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

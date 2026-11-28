import { useMemo, useState } from 'react';
import { playFeedbackSound } from '../utils/audioUtils';

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

const sparklinePath = (points, width = 240, height = 44) => {
  const series = points
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (series.length < 2) return '';

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;

  return series
    .map((price, i) => {
      const x = (i / (series.length - 1)) * width;
      const y = height - ((price - min) / span) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
};

export default function IndexTile({
  index,
  size = 'medium',
  standingRank,
  standingLabel,
  tileStyle = 'vibrant',
  onSelectIndex,
  onResizeTile,
  standingMode
}) {
  const [tiltStyle, setTiltStyle] = useState({});
  const hasLiveQuote = Number.isFinite(Number(index.basePrice));
  const change = Number(index.baseChange);
  const changePct = Number(index.baseChangePercent);
  const isUp = changePct >= 0;
  const trendClass = !hasLiveQuote ? 'tile-neutral' : isUp ? 'tile-up-green' : 'tile-down-red';

  const rangePosition = useMemo(() => {
    const low = Number(index.dayLow || 0);
    const high = Number(index.dayHigh || 0);
    const price = Number(index.basePrice || 0);
    if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
      return 50;
    }
    return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100));
  }, [index.basePrice, index.dayHigh, index.dayLow]);

  const handleMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 10;
    const rotateY = (x / rect.width) * 10;

    setTiltStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(0.97)`,
      transition: 'transform 0.05s ease-out'
    });
  };

  const handleMouseUp = () => {
    setTiltStyle({
      transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)'
    });
  };

  const handleTileClick = (e) => {
    if (e.target.closest('.tile-action-btn') || e.target.closest('.tile-resize-dropdown')) {
      return;
    }
    playFeedbackSound('tile_click');
    onSelectIndex(index);
  };

  return (
    <div
      className={`market-tile tile-${size} style-${tileStyle} ${trendClass}`}
      style={tiltStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleTileClick}
      title={`${index.fullName} (${index.ticker}) - Click for details`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelectIndex(index); }}
    >
      <div className="tile-inner">
        <div className="tile-face tile-front">
          <div className="tile-header">
            <div className="tile-title-group">
              <span className="tile-flag" title={index.country}>{index.flag}</span>
              <span className="tile-ticker">{index.name}</span>
              <span className="tile-code">{index.ticker}</span>
            </div>
            <div className="tile-badge-group">
              {standingRank && (
                <span className="standing-badge" title={`Ranked ${standingRank} by ${standingMode}`}>
                  #{standingRank}
                </span>
              )}
            </div>
          </div>

          {(size === 'large' || size === 'wide') && (
            <div className="tile-subheading">
              <span className="full-name">{index.fullName}</span>
              <span className="exchange-tag">{index.exchange}</span>
            </div>
          )}

          <div className="tile-body">
            <div className="price-container">
              <span className="currency-prefix">{index.currency}</span>
              <span className="main-price">{hasLiveQuote ? formatNumber(index.basePrice) : '—'}</span>
            </div>

            <div className="change-container">
              {hasLiveQuote ? (
                <>
                  <span className="direction-icon">{isUp ? '▲' : '▼'}</span>
                  <span>{isUp ? '+' : ''}{formatNumber(change)}</span>
                  <span className="percent-change-badge">{isUp ? '+' : ''}{formatNumber(changePct)}%</span>
                </>
              ) : (
                <span>Waiting for live quote…</span>
              )}
            </div>

            {size === 'large' && (
              <div className="tile-large-details">
                <div className="sparkline-wrapper">
                  <div className="sparkline-header">
                    <span>INTRADAY</span>
                    <span>{index.marketState || 'REGULAR'}</span>
                  </div>
                  <svg className="tile-sparkline-svg" viewBox="0 0 240 44" preserveAspectRatio="none" role="img" aria-label="Intraday sparkline">
                    <path
                      d={sparklinePath(index.sparkline || [index.prevClose, index.basePrice], 240, 44)}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="day-range-wrapper">
                  <div className="range-labels">
                    <span>L: {formatNumber(index.dayLow)}</span>
                    <span>H: {formatNumber(index.dayHigh)}</span>
                  </div>
                  <div className="range-bar-track">
                    <span className="range-bar-fill" style={{ left: `${rangePosition}%` }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="tile-small-footer">
            <span className="mini-standing-label">{standingLabel || 'INDEX'}</span>
            <span className="mini-proxy" title="Source: Yahoo Finance">YF: {index.ticker}</span>
            <a
              href={`https://finance.yahoo.com/quote/${encodeURIComponent(index.ticker)}`}
              target="_blank"
              rel="noopener nofollow"
              className="tile-tv-link"
              onClick={(e) => e.stopPropagation()}
              title="Open quote page"
            >
              source
            </a>
          </div>

          {standingMode === 'custom' && (
            <div className="custom-resize-selector" onClick={(e) => e.stopPropagation()}>
              <select
                value={size}
                onChange={(e) => onResizeTile && onResizeTile(index.id, e.target.value)}
                className="tile-resize-dropdown"
                aria-label="Resize tile"
              >
                <option value="large">Large (2x2)</option>
                <option value="wide">Wide (2x1)</option>
                <option value="medium">Medium (1x1)</option>
                <option value="small">Small (1x1)</option>
              </select>
            </div>
          )}
        </div>

        <div className="tile-face tile-back">
          <div className="tile-header">
            <span className="tile-ticker">{index.name} METRICS</span>
          </div>
          <div className="back-grid">
            <div className="back-stat">
              <span className="back-label">SOURCE</span>
              <span className="back-val">Yahoo Finance</span>
            </div>
            <div className="back-stat">
              <span className="back-label">TICKER</span>
              <span className="back-val">{index.ticker}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">EXCHANGE</span>
              <span className="back-val">{index.exchange}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">COUNTRY</span>
              <span className="back-val">{index.country}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">REGION</span>
              <span className="back-val">{index.region}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">VOLUME</span>
              <span className="back-val">{formatVolume(index.volume)}</span>
            </div>
          </div>

          <div className="back-footer">
            <span>Click tile to open detailed chart</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { playFeedbackSound } from '../utils/audioUtils';

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
  const [isFlipped, setIsFlipped] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});

  const isUp = index.baseChangePercent >= 0;
  const isZero = index.baseChangePercent === 0;

  // Color classes: Red if down, Green if up
  const statusColorClass = isZero
    ? 'tile-neutral'
    : isUp
    ? 'tile-up-green'
    : 'tile-down-red';

  const formattedPrice = Number(index.basePrice).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedChange = (index.baseChange > 0 ? '+' : '') + Number(index.baseChange).toFixed(2);
  const formattedPercent = (index.baseChangePercent > 0 ? '+' : '') + Number(index.baseChangePercent).toFixed(2) + '%';

  // Day Low -> High position
  const rangeSpan = Math.max(0.01, index.dayHigh - index.dayLow);
  const currentRangePosition = Math.min(100, Math.max(0, ((index.basePrice - index.dayLow) / rangeSpan) * 100));

  // Render SVG Sparkline Points
  const renderSparkline = (height = 42, width = 160) => {
    if (!index.sparkline || index.sparkline.length < 2) return null;
    const min = Math.min(...index.sparkline);
    const max = Math.max(...index.sparkline);
    const spread = Math.max(0.001, max - min);

    const points = index.sparkline.map((val, i) => {
      const x = (i / (index.sparkline.length - 1)) * width;
      const y = height - ((val - min) / spread) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="tile-sparkline-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="rgba(255, 255, 255, 0.9)"
          strokeWidth="2.2"
          strokeLinecap="square"
          strokeLinejoin="miter"
          points={points}
        />
      </svg>
    );
  };

  // 3D perspective tilt on mouse press
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

  const toggleFlip = (e) => {
    e.stopPropagation();
    playFeedbackSound('flip');
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={`market-tile tile-${size} ${statusColorClass} style-${tileStyle} ${isFlipped ? 'is-flipped' : ''}`}
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
        {/* FRONT FACE */}
        <div className="tile-face tile-front">
          {/* Header: Flag, Ticker, Standing & Actions */}
          <div className="tile-header">
            <div className="tile-title-group">
              <span className="tile-flag" title={index.country}>{index.flag}</span>
              <span className="tile-ticker">{index.name}</span>
              <span className="tile-code">{index.ticker}</span>
            </div>

            <div className="tile-badge-group">
              {index.isOnlineFetched && (
                <span className="online-badge" title="Live quote fetched online">
                  ONLINE
                </span>
              )}
              {standingRank && (
                <span className="standing-badge" title={`Ranked ${standingRank} by ${standingMode}`}>
                  #{standingRank}
                </span>
              )}
              {/* Flip button */}
              <button
                type="button"
                className="tile-action-btn flip-btn"
                onClick={toggleFlip}
                title="Flip tile for key metrics"
                aria-label="Flip tile"
              >
                ⟲
              </button>
            </div>
          </div>

          {/* Subheading: Full name & exchange */}
          {(size === 'large' || size === 'wide') && (
            <div className="tile-subheading">
              <span className="full-name">{index.fullName}</span>
              <span className="exchange-tag">{index.exchange}</span>
            </div>
          )}

          {/* Core Metrics: Live Price & Percentage */}
          <div className="tile-body">
            <div className="price-container">
              <span className="currency-prefix">{index.currency}</span>
              <span className="main-price">{formattedPrice}</span>
            </div>

            <div className="change-container">
              <span className="direction-icon">{isUp ? '▲' : '▼'}</span>
              <span className="points-change">{formattedChange}</span>
              <span className="percent-change-badge">{formattedPercent}</span>
            </div>
          </div>

          {/* LARGE TILE: Trend Line, Range Bar, and Multi-metrics */}
          {size === 'large' && (
            <div className="tile-large-details">
              <div className="sparkline-wrapper">
                <div className="sparkline-header">
                  <span>INTRADAY TREND</span>
                  <span className="proxy-hint">Proxy: {index.proxySymbol}</span>
                </div>
                {renderSparkline(50, 240)}
              </div>

              {/* Day Range Bar */}
              <div className="day-range-wrapper">
                <div className="range-labels">
                  <span>L: {Number(index.dayLow).toFixed(2)}</span>
                  <span className="range-title">DAY RANGE</span>
                  <span>H: {Number(index.dayHigh).toFixed(2)}</span>
                </div>
                <div className="range-bar-track">
                  <div
                    className="range-bar-fill"
                    style={{ left: `${currentRangePosition}%` }}
                  ></div>
                </div>
              </div>

              {/* Large Stats Footer */}
              <div className="large-tile-footer">
                <div className="stat-item">
                  <span className="stat-label">VOL</span>
                  <span className="stat-val">{index.volume}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">52W HIGH</span>
                  <span className="stat-val">{Number(index.yearHigh).toFixed(1)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">MCAP</span>
                  <span className="stat-val">{index.marketCap}</span>
                </div>
              </div>
            </div>
          )}

          {/* WIDE TILE: Mini Sparkline & Stats */}
          {size === 'wide' && (
            <div className="tile-wide-details">
              <div className="wide-sparkline">
                {renderSparkline(30, 110)}
              </div>
              <div className="wide-stats">
                <div className="wide-stat">
                  <span className="mini-label">RANGE</span>
                  <span className="mini-val">{Number(index.dayLow).toFixed(0)} - {Number(index.dayHigh).toFixed(0)}</span>
                </div>
                <div className="wide-stat">
                  <span className="mini-label">VOL</span>
                  <span className="mini-val">{index.volume}</span>
                </div>
              </div>
            </div>
          )}

          {/* MEDIUM & SMALL: Clean footer */}
          {(size === 'medium' || size === 'small') && standingLabel && (
            <div className="tile-small-footer">
              <span className="mini-standing-label">{standingLabel}</span>
              <span className="mini-proxy">ETF: {index.proxySymbol}</span>
            </div>
          )}

          {/* Custom Size Selector */}
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

        {/* BACK FACE: Key Fundamentals */}
        <div className="tile-face tile-back">
          <div className="tile-header">
            <span className="tile-ticker">{index.name} METRICS</span>
            <button
              type="button"
              className="tile-action-btn flip-btn"
              onClick={toggleFlip}
              title="Flip back"
              aria-label="Flip back"
            >
              ⟲
            </button>
          </div>

          <div className="back-grid">
            <div className="back-stat">
              <span className="back-label">OPEN</span>
              <span className="back-val">{Number(index.openPrice).toFixed(2)}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">PREV CLOSE</span>
              <span className="back-val">{Number(index.prevClose).toFixed(2)}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">DAY HIGH</span>
              <span className="back-val">{Number(index.dayHigh).toFixed(2)}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">DAY LOW</span>
              <span className="back-val">{Number(index.dayLow).toFixed(2)}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">52W HIGH</span>
              <span className="back-val">{Number(index.yearHigh).toFixed(2)}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">52W LOW</span>
              <span className="back-val">{Number(index.yearLow).toFixed(2)}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">P/E RATIO</span>
              <span className="back-val">{index.peRatio || 'N/A'}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">API BENCHMARK</span>
              <span className="back-val">{index.proxySymbol}</span>
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

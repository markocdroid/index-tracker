import { useState } from 'react';
import { playFeedbackSound } from '../utils/audioUtils';
import { getTradingViewSymbol } from '../utils/tradingViewSymbols';
import TradingViewTileQuote from './TradingViewTileQuote';

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
  const tvSymbol = getTradingViewSymbol(index);
  const trendClass = index.baseChangePercent > 0
    ? 'tile-up-green'
    : index.baseChangePercent < 0
      ? 'tile-down-red'
      : 'tile-neutral';

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

  return (
    <div
      className={`market-tile tile-${size} tile-tv-source style-${tileStyle} ${trendClass}`}
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
            <TradingViewTileQuote
              symbol={tvSymbol}
              height={size === 'large' ? 78 : size === 'wide' ? 64 : size === 'medium' ? 56 : 50}
              theme="dark"
              locale="en"
            />
          </div>

          {/* LARGE TILE: TV-only source note */}
          {size === 'large' && (
            <div className="tile-large-details">
              <div className="tv-only-note">LIVE QUOTE SOURCE: TRADINGVIEW ({tvSymbol})</div>
            </div>
          )}

          {/* WIDE TILE: TV-only source note */}
          {size === 'wide' && (
            <div className="tile-wide-details">
              <span className="tv-only-note">LIVE QUOTE SOURCE: TRADINGVIEW ({tvSymbol})</span>
            </div>
          )}

          {/* MEDIUM & SMALL: Clean footer */}
          {(size === 'medium' || size === 'small') && standingLabel && (
            <div className="tile-small-footer">
              <span className="mini-standing-label">{standingLabel}</span>
              <span className="mini-proxy">TV: {tvSymbol}</span>
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
          </div>
          <div className="back-grid">
            <div className="back-stat">
              <span className="back-label">SOURCE</span>
              <span className="back-val">TradingView</span>
            </div>
            <div className="back-stat">
              <span className="back-label">SYMBOL</span>
              <span className="back-val">{tvSymbol}</span>
            </div>
            <div className="back-stat">
              <span className="back-label">INDEX</span>
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
              <span className="back-label">DETAILS</span>
              <span className="back-val">Open modal chart</span>
            </div>
            <div className="back-stat">
              <span className="back-label">ATTRIBUTION</span>
              <span className="back-val">TradingView link in widget</span>
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

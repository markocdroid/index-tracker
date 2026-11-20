import { playFeedbackSound } from '../utils/audioUtils';

export default function MarketTickerBanner({
  indexes,
  onSelectIndex
}) {
  if (!indexes || indexes.length === 0) return null;

  // Top gainers, losers, and remaining benchmarks
  const sortedByChange = [...indexes].sort((a, b) => b.baseChangePercent - a.baseChangePercent);
  const topGainers = sortedByChange.slice(0, 4);
  const topLosers = [...sortedByChange].reverse().slice(0, 4);

  const gainerIds = new Set(topGainers.map((idx) => idx.id));
  const loserIds = new Set(topLosers.map((idx) => idx.id));
  const otherBenchmarks = sortedByChange.filter((idx) => !gainerIds.has(idx.id) && !loserIds.has(idx.id));

  const advancingCount = indexes.filter(idx => idx.baseChangePercent > 0).length;
  const decliningCount = indexes.filter(idx => idx.baseChangePercent < 0).length;
  const neutralCount = indexes.filter(idx => idx.baseChangePercent === 0).length;

  const renderBadge = (idx, keyPrefix = '') => {
    const isUp = idx.baseChangePercent >= 0;
    return (
      <div
        key={`${keyPrefix}-${idx.id}`}
        className={`ticker-badge ${isUp ? 'ticker-up' : 'ticker-down'}`}
        onClick={() => {
          playFeedbackSound('tile_click');
          onSelectIndex(idx);
        }}
        title={`${idx.fullName} (${idx.ticker}) - Click to view details`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onSelectIndex(idx); }}
      >
        <span className="tb-flag">{idx.flag}</span>
        <span className="tb-ticker">{idx.name}</span>
        <span className="tb-val">
          {isUp ? '+' : ''}{Number(idx.baseChangePercent).toFixed(2)}%
        </span>
      </div>
    );
  };

  const renderTickerTrack = (trackKey) => (
    <div key={trackKey} className="ticker-marquee-track">
      <div className="ticker-section-title">TOP GAINERS:</div>
      {topGainers.map((idx) => renderBadge(idx, trackKey))}

      <div className="ticker-separator">|</div>

      <div className="ticker-section-title">TOP DECLINERS:</div>
      {topLosers.map((idx) => renderBadge(idx, trackKey))}

      {otherBenchmarks.length > 0 && (
        <>
          <div className="ticker-separator">|</div>
          <div className="ticker-section-title">GLOBAL BENCHMARKS:</div>
          {otherBenchmarks.map((idx) => renderBadge(idx, trackKey))}
        </>
      )}

      <div className="ticker-separator">|</div>
    </div>
  );

  return (
    <div className="market-ticker-banner">
      {/* Breadth Indicator */}
      <div className="ticker-breadth-indicator">
        <span className="breadth-label">MARKET BREADTH:</span>
        <span className="breadth-up" title={`${advancingCount} indexes advancing`}>
          ▲ {advancingCount} UP
        </span>
        <span className="breadth-slash">/</span>
        <span className="breadth-down" title={`${decliningCount} indexes declining`}>
          ▼ {decliningCount} DOWN
        </span>
        {neutralCount > 0 && (
          <span className="breadth-neutral">({neutralCount} FLAT)</span>
        )}
      </div>

      {/* Continuous Marquee Ticker Scroller */}
      <div className="ticker-marquee-wrapper" title="Hover to pause marquee">
        <div className="ticker-marquee-content">
          {renderTickerTrack('track-1')}
          {renderTickerTrack('track-2')}
        </div>
      </div>
    </div>
  );
}
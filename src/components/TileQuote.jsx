import { memo } from 'react';

function YahooFinanceTileQuoteBridge({ symbol = '^SPX', height = 88 }) {
  return (
    <div className="tv-tile-quote-wrap" style={{ height: `${height}px`, display: 'grid', placeItems: 'center' }}>
      <a href={`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`} target="_blank" rel="noopener nofollow" className="source-link">
        Yahoo Finance: {symbol}
      </a>
    </div>
  );
}

export default memo(YahooFinanceTileQuoteBridge);

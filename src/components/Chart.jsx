import { memo } from 'react';

function YahooFinanceChartBridge({ symbol = '^SPX', height = 480 }) {
  const chartUrl = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`;

  return (
    <div style={{ width: '100%', height: `${height}px`, minHeight: `${height}px`, border: '1px solid #333', display: 'grid', placeItems: 'center' }}>
      <a href={chartUrl} target="_blank" rel="noopener nofollow" className="source-link">
        Open chart on Yahoo Finance ({symbol})
      </a>
    </div>
  );
}

export default memo(YahooFinanceChartBridge);

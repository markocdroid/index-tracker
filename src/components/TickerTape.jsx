import { memo } from 'react';
import { YAHOO_FINANCE_TICKERS } from '../utils/yahoo_financeSymbols';

function YahooFinanceTickerTapeBridge() {
  return (
    <div className="market-ticker-embed" style={{ minHeight: 36, display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', overflow: 'hidden' }}>
      {YAHOO_FINANCE_TICKERS.slice(0, 12).map((item) => (
        <span key={item.id} style={{ fontSize: 11, opacity: 0.78, whiteSpace: 'nowrap' }}>
          {item.symbol}
        </span>
      ))}
    </div>
  );
}

export default memo(YahooFinanceTickerTapeBridge);

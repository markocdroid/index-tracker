import { memo, useEffect, useRef } from 'react';

function TradingViewTileQuote({ symbol, height = 88, locale = 'en', theme = 'dark' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetWrap = document.createElement('div');
    widgetWrap.className = 'tradingview-widget-container__widget';
    widgetWrap.style.width = '100%';
    widgetWrap.style.height = `${height}px`;
    container.appendChild(widgetWrap);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      colorTheme: theme,
      isTransparent: true,
      locale,
      largeChartUrl: '',
      support_host: 'https://www.tradingview.com'
    });

    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [symbol, height, locale, theme]);

  return (
    <div className="tradingview-widget-container tv-tile-quote-wrap" ref={containerRef} />
  );
}

export default memo(TradingViewTileQuote);

import { useEffect, useRef, memo } from 'react';

/**
 * Embeds the official TradingView Advanced Chart widget.
 * Documentation: https://www.tradingview.com/widget/advanced-chart/
 * No API key required - 100% public client-side embed.
 */
function TradingViewChart({
  symbol = 'FOREXCOM:SPXUSD',
  theme = 'dark',
  height = 480,
  timezone = 'Etc/UTC',
  locale = 'en'
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous widget
    container.innerHTML = '';

    const widgetWrap = document.createElement('div');
    widgetWrap.className = 'tradingview-widget-container__widget';
    widgetWrap.style.width = '100%';
    widgetWrap.style.height = '100%';
    container.appendChild(widgetWrap);

    // Official TradingView attribution (must stay visible and unmodified).
    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright';
    copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
    container.appendChild(copyrightDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: 'D',
      timezone: timezone,
      theme: theme,
      style: '1',
      locale: locale,
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: true,
      hide_legend: false,
      save_image: false,
      backgroundColor: 'rgba(20, 20, 20, 1)',
      gridColor: 'rgba(42, 42, 42, 0.5)'
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, theme, timezone, locale]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{ width: '100%', height: `${height}px`, minHeight: `${height}px` }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default memo(TradingViewChart);

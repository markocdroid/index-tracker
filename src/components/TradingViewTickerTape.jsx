import { useEffect, useRef, memo } from 'react';

/**
 * Embeds the official TradingView Ticker Tape widget.
 * Complies with TradingView Terms of Use:
 * - Attribution kept intact (<div class="tradingview-widget-copyright"> with official link)
 * - Embedded as-is from TradingView CDN
 * - Explicit height and no overflow clipping
 */
function TradingViewTickerTape({ theme = 'dark', locale = 'en' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetWrap = document.createElement('div');
    widgetWrap.className = 'tradingview-widget-container__widget';
    container.appendChild(widgetWrap);

    // Official TradingView copyright attribution (mandatory per Terms of Use)
    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright';
    copyrightDiv.innerHTML = '<a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a>';
    container.appendChild(copyrightDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500 Index' },
        { proName: 'FOREXCOM:NSXUSD', title: 'Nasdaq 100' },
        { proName: 'FOREXCOM:DJI', title: 'Dow Jones' },
        { proName: 'AMEX:IWM', title: 'Russell 2000' },
        { proName: 'FOREXCOM:GER40', title: 'DAX 40' },
        { proName: 'FOREXCOM:UK100', title: 'FTSE 100' },
        { proName: 'FOREXCOM:FRA40', title: 'CAC 40' },
        { proName: 'FOREXCOM:JP225', title: 'Nikkei 225' },
        { proName: 'FOREXCOM:HK50', title: 'Hang Seng' },
        { proName: 'AMEX:ASHR', title: 'CSI 300' },
        { proName: 'FOREXCOM:EUSTX50', title: 'Euro Stoxx 50' },
        { proName: 'INDEX:NIFTY', title: 'Nifty 50' },
        { proName: 'AMEX:EWC', title: 'TSX 60' },
        { proName: 'FOREXCOM:AUS200', title: 'ASX 200' },
        { proName: 'AMEX:EWZ', title: 'Bovespa' },
        { proName: 'AMEX:ACWI', title: 'MSCI ACWI' }
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: 'adaptive',
      colorTheme: theme,
      locale: locale
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [theme, locale]);

  return (
    <div
      ref={containerRef}
    />
  );
}

export default memo(TradingViewTickerTape);

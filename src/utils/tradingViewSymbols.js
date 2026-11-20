// Official TradingView symbol mapping for the top 20 global market benchmarks
// and utility function to resolve any symbol or proxy for TradingView widgets

export const TRADINGVIEW_SYMBOLS = {
  sp500: 'FOREXCOM:SPXUSD',
  nasdaq: 'FOREXCOM:NSXUSD',
  dow: 'FOREXCOM:DJI',
  russell2000: 'AMEX:IWM',
  ftse100: 'FOREXCOM:UK100',
  dax: 'FOREXCOM:GER40',
  cac40: 'FOREXCOM:FRA40',
  nikkei: 'FOREXCOM:JP225',
  hangseng: 'FOREXCOM:HK50',
  csi300: 'AMEX:ASHR',
  stoxx50: 'FOREXCOM:EUSTX50',
  tsx: 'AMEX:EWC',
  asx200: 'FOREXCOM:AUS200',
  nifty50: 'INDEX:NIFTY',
  kospi: 'AMEX:EWY',
  bovespa: 'AMEX:EWZ',
  smi: 'FOREXCOM:SWI20',
  ipc: 'AMEX:EWW',
  sti: 'AMEX:EWS',
  acwi: 'AMEX:ACWI'
};

export const TRADINGVIEW_TICKER_SYMBOLS = [
  { proName: 'FOREXCOM:SPXUSD', title: 'S&P 500' },
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
];

export function getTradingViewSymbol(index) {
  if (!index) return 'FOREXCOM:SPXUSD';
  if (TRADINGVIEW_SYMBOLS[index.id]) {
    return TRADINGVIEW_SYMBOLS[index.id];
  }
  if (index.tradingViewSymbol) {
    return index.tradingViewSymbol;
  }
  if (index.proxySymbol) {
    return `AMEX:${index.proxySymbol}`;
  }
  if (index.ticker) {
    const clean = index.ticker.replace(/^\^/, '');
    return clean;
  }
  return 'FOREXCOM:SPXUSD';
}

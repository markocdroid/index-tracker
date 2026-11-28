export const YAHOO_FINANCE_SYMBOLS = {
  sp500: '^SPX',
  nasdaq: '^NDX',
  dow: '^DJI',
  russell2000: '^RUT',
  ftse100: '^FTSE',
  dax: '^GDAXI',
  cac40: '^FCHI',
  nikkei: '^N225',
  hangseng: '^HSI',
  csi300: '000300.SS',
  stoxx50: '^STOXX50E',
  tsx: '^GSPTSE',
  asx200: '^AXJO',
  nifty50: '^NSEI',
  kospi: '^KS11',
  bovespa: '^BVSP',
  smi: '^SSMI',
  ipc: '^MXX',
  sti: '^STI',
  acwi: '^W1DOW'
};

export const YAHOO_FINANCE_TICKERS = [
  { id: 'sp500', symbol: '^SPX', title: 'S&P 500 INDEX' },
  { id: 'nasdaq', symbol: '^NDX', title: 'NASDAQ-100' },
  { id: 'dow', symbol: '^DJI', title: 'Dow Jones Industrial Average' },
  { id: 'russell2000', symbol: '^RUT', title: 'Russell 2000 Index' },
  { id: 'ftse100', symbol: '^FTSE', title: 'FTSE 100' },
  { id: 'dax', symbol: '^GDAXI', title: 'DAX' },
  { id: 'cac40', symbol: '^FCHI', title: 'CAC 40' },
  { id: 'nikkei', symbol: '^N225', title: 'Nikkei 225' },
  { id: 'hangseng', symbol: '^HSI', title: 'Hang Seng Index' },
  { id: 'csi300', symbol: '000300.SS', title: 'CSI 300 Index' },
  { id: 'stoxx50', symbol: '^STOXX50E', title: 'EURO STOXX 50' },
  { id: 'tsx', symbol: '^GSPTSE', title: 'S&P/TSX Composite Index' },
  { id: 'asx200', symbol: '^AXJO', title: 'S&P/ASX 200' },
  { id: 'nifty50', symbol: '^NSEI', title: 'NIFTY 50' },
  { id: 'kospi', symbol: '^KS11', title: 'KOSPI Composite Index' },
  { id: 'bovespa', symbol: '^BVSP', title: 'IBOVESPA' },
  { id: 'smi', symbol: '^SSMI', title: 'SMI' },
  { id: 'ipc', symbol: '^MXX', title: 'S&P/BMV IPC' },
  { id: 'sti', symbol: '^STI', title: 'STI Index' },
  { id: 'acwi', symbol: '^W1DOW', title: 'Dow Jones Global Index' }
];

export function getYahooFinanceSymbol(index) {
  if (!index) return '^SPX';
  if (index.id && YAHOO_FINANCE_SYMBOLS[index.id]) {
    return YAHOO_FINANCE_SYMBOLS[index.id];
  }
  if (index.ticker) {
    return index.ticker;
  }
  return '^SPX';
}

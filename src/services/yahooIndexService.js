import { getYahooFinanceSymbol } from '../utils/yahoo_financeSymbols';

const YAHOO_SPARK_ENDPOINT = 'https://query1.finance.yahoo.com/v7/finance/spark';
const YAHOO_CHART_ENDPOINT = 'https://query1.finance.yahoo.com/v8/finance/chart';
const CORS_PROXY_IO_ENDPOINT = 'https://corsproxy.io/?';
const JINA_RELAY_ENDPOINT = 'https://r.jina.ai/http://';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sanitizeSeries = (series = []) => {
  const cleaned = series
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (cleaned.length >= 2) {
    return cleaned.slice(-30).map((v) => Number(v.toFixed(2)));
  }

  return [];
};

async function fetchJsonWithFallback(url) {
  const isBrowser = typeof window !== 'undefined';
  const withoutProtocol = url.replace(/^https?:\/\//, '');

  // Server/Node path: try direct Yahoo first.
  if (!isBrowser) {
    try {
      const direct = await fetch(url, { cache: 'no-store' });
      if (direct.ok) {
        return await direct.json();
      }
    } catch {
      // Ignore and retry through proxy fallbacks.
    }
  }

  // Browser/static-host path: relay-first to avoid direct Yahoo CORS failures.
  try {
    const relay = await fetch(`${JINA_RELAY_ENDPOINT}${withoutProtocol}`, {
      cache: 'no-store'
    });

    if (relay.ok) {
      const relayText = await relay.text();
      const firstBrace = relayText.indexOf('{');
      const lastBrace = relayText.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const jsonText = relayText.slice(firstBrace, lastBrace + 1);
        return JSON.parse(jsonText);
      }
    }
  } catch {
    // Continue to next fallback.
  }

  try {
    const corsProxyIo = await fetch(`${CORS_PROXY_IO_ENDPOINT}${encodeURIComponent(url)}`, {
      cache: 'no-store'
    });

    if (corsProxyIo.ok) {
      const text = await corsProxyIo.text();
      return JSON.parse(text);
    }
  } catch {
    // Continue to terminal failure.
  }

  // Final direct retry (non-browser or permissive CORS environments).
  try {
    const directRetry = await fetch(url, { cache: 'no-store' });
    if (directRetry.ok) {
      return await directRetry.json();
    }
  } catch {
    // Continue to throw below.
  }

  throw new Error('Quote request failed across all relay paths');
}

function normalizeSparkResult(index, payload) {
  const response = payload?.response?.[0];
  const meta = response?.meta || {};
  const quote = response?.indicators?.quote?.[0] || {};

  const closeSeries = sanitizeSeries(quote.close);
  const previousCloseRaw = meta.previousClose ?? meta.chartPreviousClose;
  const previousClose = Number(previousCloseRaw);
  const latestPrice =
    toNumber(meta.regularMarketPrice, NaN) ||
    closeSeries.at(-1);

  if (!Number.isFinite(latestPrice) || !Number.isFinite(previousClose)) {
    return null;
  }

  const computedChange = latestPrice - previousClose;
  const baseChange = Number(
    toNumber(meta.regularMarketChange || meta.fulldayChange, computedChange).toFixed(2)
  );

  const rawPct =
    toNumber(meta.regularMarketChangePercent || meta.fulldayChangePercent, NaN) ||
    (previousClose ? (baseChange / previousClose) * 100 : 0);

  const baseChangePercent = Number(rawPct.toFixed(2));

  return {
    basePrice: Number(latestPrice.toFixed(2)),
    baseChange,
    baseChangePercent,
    prevClose: Number(previousClose.toFixed(2)),
    dayHigh: Number(toNumber(meta.regularMarketDayHigh, latestPrice).toFixed(2)),
    dayLow: Number(toNumber(meta.regularMarketDayLow, latestPrice).toFixed(2)),
    volume: toNumber(meta.regularMarketVolume, 0),
    yearHigh: Number(toNumber(meta.fiftyTwoWeekHigh, latestPrice).toFixed(2)),
    yearLow: Number(toNumber(meta.fiftyTwoWeekLow, latestPrice).toFixed(2)),
    sparkline: closeSeries.length >= 2 ? closeSeries : [previousClose, latestPrice],
    fullName: meta.longName || index.fullName,
    exchange: meta.fullExchangeName || index.exchange,
    currency: meta.currency || index.currency,
    marketState: meta.marketState || 'REGULAR',
    dataSource: 'Yahoo Finance',
    isOnlineFetched: true,
    lastUpdated: new Date().toISOString()
  };
}

export async function fetchYahooIndexBatch(indexes) {
  const normalized = indexes.map((idx) => ({
    ...idx,
    ticker: getYahooFinanceSymbol(idx)
  }));

  const tickerById = new Map(normalized.map((idx) => [idx.ticker, idx]));
  const symbols = normalized.map((idx) => encodeURIComponent(idx.ticker)).join(',');
  const url = `${YAHOO_SPARK_ENDPOINT}?symbols=${symbols}&range=1d&interval=5m`;
  const payload = await fetchJsonWithFallback(url);
  const results = payload?.spark?.result || [];

  const liveMap = {};

  for (const item of results) {
    const index = tickerById.get(item.symbol);
    if (!index) continue;
    const normalized = normalizeSparkResult(index, item);
    if (!normalized) continue;
    liveMap[index.id] = normalized;
  }

  return liveMap;
}

export async function fetchYahooIndexHistory(ticker, range = '1mo', interval = '1d') {
  const url = `${YAHOO_CHART_ENDPOINT}/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
  const payload = await fetchJsonWithFallback(url);
  const result = payload?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];

  const points = [];
  for (let i = 0; i < timestamps.length; i += 1) {
    const close = Number(closes[i]);
    if (!Number.isFinite(close)) continue;
    points.push({
      ts: timestamps[i],
      close: Number(clamp(close, 0, Number.MAX_SAFE_INTEGER).toFixed(2))
    });
  }

  return points;
}

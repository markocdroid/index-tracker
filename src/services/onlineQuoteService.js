/**
 * Online Market Quote Service
 * Fetches real-time quotes, charts, and metadata for symbols/indices not in local benchmarks.
 * Uses Vite dev proxy with resilient multi-tier public CORS proxy fallbacks.
 */

function inferRegionAndCountry(meta) {
  const tz = (meta.exchangeTimezoneName || '').toLowerCase();
  const ex = (meta.exchangeName || '').toUpperCase();
  const sym = (meta.symbol || '').toUpperCase();
  const inst = (meta.instrumentType || '').toUpperCase();

  if (sym.includes('-USD') || sym.includes('-EUR') || sym.includes('BTC') || sym.includes('ETH') || inst === 'CRYPTOCURRENCY') {
    return { region: 'Global', country: 'Global Crypto', countryCode: 'GL', flag: '🪙' };
  }
  if (tz.includes('new_york') || ['NMS', 'NYQ', 'NYSE', 'NASDAQ', 'CBOE', 'BATS', 'ARCX'].includes(ex)) {
    return { region: 'Americas', country: 'United States', countryCode: 'US', flag: '🇺🇸' };
  }
  if (tz.includes('london') || ex.includes('LSE') || ex.includes('FTSE')) {
    return { region: 'Europe', country: 'United Kingdom', countryCode: 'GB', flag: '🇬🇧' };
  }
  if (tz.includes('berlin') || ex.includes('GER') || ex.includes('FRA') || ex.includes('XETRA')) {
    return { region: 'Europe', country: 'Germany', countryCode: 'DE', flag: '🇩🇪' };
  }
  if (tz.includes('paris') || ex.includes('PAR') || ex.includes('EPA')) {
    return { region: 'Europe', country: 'France', countryCode: 'FR', flag: '🇫🇷' };
  }
  if (tz.includes('tokyo') || ex.includes('JPX') || ex.includes('TSE')) {
    return { region: 'Asia-Pacific', country: 'Japan', countryCode: 'JP', flag: '🇯🇵' };
  }
  if (tz.includes('hong_kong') || ex.includes('HKG') || ex.includes('HKEX')) {
    return { region: 'Asia-Pacific', country: 'Hong Kong', countryCode: 'HK', flag: '🇭🇰' };
  }
  if (tz.includes('shanghai') || ex.includes('SHH') || ex.includes('SHZ')) {
    return { region: 'Asia-Pacific', country: 'China', countryCode: 'CN', flag: '🇨🇳' };
  }
  if (tz.includes('toronto') || ex.includes('TOR') || ex.includes('TSX')) {
    return { region: 'Americas', country: 'Canada', countryCode: 'CA', flag: '🇨🇦' };
  }
  if (tz.includes('sydney') || ex.includes('ASX')) {
    return { region: 'Asia-Pacific', country: 'Australia', countryCode: 'AU', flag: '🇦🇺' };
  }
  if (tz.includes('kolkata') || ex.includes('NSE') || ex.includes('BSE')) {
    return { region: 'Asia-Pacific', country: 'India', countryCode: 'IN', flag: '🇮🇳' };
  }
  if (tz.includes('europe') || tz.includes('zurich') || tz.includes('amsterdam')) {
    return { region: 'Europe', country: 'Europe', countryCode: 'EU', flag: '🇪🇺' };
  }
  return { region: 'Global', country: 'International', countryCode: 'GL', flag: '🌐' };
}

function formatMagnitude(num, isCurrency = false) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  const prefix = isCurrency ? '$' : '';
  if (num >= 1e12) return `${prefix}${(num / 1e12).toFixed(2)} Trillion`;
  if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(1)}K`;
  return `${prefix}${num}`;
}

async function fetchWithFallback(urlPath, directUrl) {
  const host = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : '';
  const isLocalDev = host === 'localhost' || host === '127.0.0.1';

  const envProxyBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_YAHOO_PROXY_URL)
    ? String(import.meta.env.VITE_YAHOO_PROXY_URL).trim().replace(/\/+$/, '')
    : '';

  const localStorageProxyBase = (() => {
    try {
      const v = localStorage.getItem('index_tracker_yahoo_proxy_url');
      return v ? String(v).trim().replace(/\/+$/, '') : '';
    } catch {
      return '';
    }
  })();

  const inferredGithubWorkerBase = (() => {
    if (!host.endsWith('.github.io')) return '';
    const owner = host.split('.')[0];
    if (!owner) return '';
    return `https://index-tracker-yahoo-proxy.${owner}.workers.dev`;
  })();

  const configuredProxyBase = envProxyBase || localStorageProxyBase || inferredGithubWorkerBase;

  const normalizeYahooUrl = (candidateUrl, candidatePath) => {
    if (candidateUrl && /^https?:\/\//i.test(candidateUrl)) {
      const url = new URL(candidateUrl);
      if (url.hostname.includes('finance.yahoo.com')) {
        return candidateUrl;
      }
      if (url.pathname.startsWith('/api/yahoo/')) {
        return `https://query1.finance.yahoo.com${url.pathname.replace('/api/yahoo', '')}${url.search}`;
      }
    }

    if (candidatePath && candidatePath.startsWith('/api/yahoo/')) {
      return `https://query1.finance.yahoo.com${candidatePath.replace('/api/yahoo', '')}`;
    }

    return candidateUrl;
  };

  const resolvedDirectUrl = normalizeYahooUrl(directUrl, urlPath);

  const parseJsonSafely = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    const rawText = await response.text();
    try {
      return JSON.parse(rawText);
    } catch {
      // Some public proxies may prepend/append non-JSON text.
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const candidate = rawText.slice(firstBrace, lastBrace + 1);
        return JSON.parse(candidate);
      }
      throw new Error('Unable to parse proxy response as JSON');
    }
  };

  const withQuery2Fallback = (url) => {
    if (!url) return [];
    const variants = [url];
    if (url.includes('query1.finance.yahoo.com')) {
      variants.push(url.replace('query1.finance.yahoo.com', 'query2.finance.yahoo.com'));
    }
    return variants;
  };

  const directCandidates = withQuery2Fallback(resolvedDirectUrl);

  const buildConfiguredProxyCandidates = (directCandidate) => {
    if (!configuredProxyBase || !directCandidate) return [];

    const directUrlObj = new URL(directCandidate);
    const yahooPathWithQuery = `${directUrlObj.pathname}${directUrlObj.search}`;

    return [
      // Preferred Worker route: https://<worker-domain>/yahoo/v8/finance/chart/AAPL?interval=1d&range=1d
      `${configuredProxyBase}/yahoo${yahooPathWithQuery}`,
      // Fallback Worker route: https://<worker-domain>/?url=https://query1.finance.yahoo.com/...
      `${configuredProxyBase}/?url=${encodeURIComponent(directCandidate)}`
    ];
  };

  // 1) Try local Vite dev proxy only on localhost dev
  if (isLocalDev && typeof urlPath === 'string' && urlPath.startsWith('/api/yahoo/')) {
    try {
      const res = await fetch(urlPath, {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && !data.chart?.error) return data;
      }
    } catch {
      // Continue to remote proxy fallbacks
    }
  }

  // 2) Prefer dedicated proxy (Cloudflare Worker) for static deployments.
  for (const directCandidate of directCandidates) {
    const configuredProxyCandidates = buildConfiguredProxyCandidates(directCandidate);

    for (const proxyUrl of configuredProxyCandidates) {
      try {
        const res = await fetch(proxyUrl, {
          headers: { Accept: 'application/json, text/plain;q=0.9, */*;q=0.8' }
        });
        if (!res.ok) continue;
        const data = await parseJsonSafely(res);
        if (data && !data.chart?.error) return data;
      } catch {
        // Continue to next configured proxy candidate
      }
    }

    // If a dedicated proxy is configured but failed, skip noisy public proxies.
    // This avoids repeated blocked requests under VPN/adblock/privacy filtering.
    if (configuredProxyBase) {
      continue;
    }

    // 3) Public CORS proxy fallbacks (best-effort only)
    const proxyCandidates = [
      `https://corsproxy.io/?url=${encodeURIComponent(directCandidate)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(directCandidate)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(directCandidate)}`,
      `https://thingproxy.freeboard.io/fetch/${directCandidate}`,
      `https://r.jina.ai/http://${directCandidate.replace(/^https?:\/\//i, '')}`
    ];

    for (const proxyUrl of proxyCandidates) {
      try {
        const res = await fetch(proxyUrl, {
          headers: { Accept: 'application/json, text/plain;q=0.9, */*;q=0.8' }
        });
        if (!res.ok) continue;
        const data = await parseJsonSafely(res);
        if (data && !data.chart?.error) return data;
      } catch {
        // Try next proxy fallback
      }
    }
  }

  return null;
}

export async function fetchOnlineQuote(rawQuery) {
  if (!rawQuery || !rawQuery.trim()) {
    return { success: false, message: 'Please enter a symbol or index name.' };
  }

  const query = rawQuery.trim();
  let candidateSymbol = query.toUpperCase();

  // If query contains spaces or appears to be a descriptive name, try search autocomplete
  if (query.includes(' ') || (query.length > 5 && !query.startsWith('^') && !query.includes('-'))) {
    const searchPath = `/api/yahoo/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=3`;
    const searchDirect = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=3`;
    const searchData = await fetchWithFallback(searchPath, searchDirect);

    if (searchData?.quotes && searchData.quotes.length > 0) {
      const topMatch =
        searchData.quotes.find(
          (q) => q.symbol && (q.quoteType === 'INDEX' || q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        ) || searchData.quotes[0];
      if (topMatch?.symbol) {
        candidateSymbol = topMatch.symbol.toUpperCase();
      }
    }
  }

  // Fetch chart for candidate symbol
  const chartPath = `/api/yahoo/v8/finance/chart/${encodeURIComponent(candidateSymbol)}?interval=1d&range=1d`;
  const chartDirect = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(candidateSymbol)}?interval=1d&range=1d`;
  let chartData = await fetchWithFallback(chartPath, chartDirect);

  // If failed and query doesn't start with ^, try index prefix ^ (e.g. VIX -> ^VIX)
  if (!chartData?.chart?.result && !candidateSymbol.startsWith('^') && !candidateSymbol.includes('-')) {
    const altSymbol = `^${candidateSymbol}`;
    const altPath = `/api/yahoo/v8/finance/chart/${encodeURIComponent(altSymbol)}?interval=1d&range=1d`;
    const altDirect = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(altSymbol)}?interval=1d&range=1d`;
    const altData = await fetchWithFallback(altPath, altDirect);
    if (altData?.chart?.result) {
      chartData = altData;
    }
  }

  const result = chartData?.chart?.result?.[0];
  if (!result || !result.meta) {
    const errorMsg = chartData?.chart?.error?.description || `No online quote found for "${query}".`;
    return { success: false, message: errorMsg };
  }

  const meta = result.meta;
  const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = Number((price - prevClose).toFixed(2));
  const changePercent = prevClose ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
  const dayHigh = meta.regularMarketDayHigh ?? price;
  const dayLow = meta.regularMarketDayLow ?? price;
  const openPrice = meta.regularMarketOpen ?? prevClose;
  const location = inferRegionAndCountry(meta);

  // Parse sparkline
  const rawCloses = result.indicators?.quote?.[0]?.close || [];
  const validCloses = rawCloses.filter((v) => typeof v === 'number' && !isNaN(v));
  let sparkline = validCloses.slice(-10);
  if (sparkline.length < 2) {
    sparkline = [
      prevClose,
      Number((prevClose + (price - prevClose) * 0.25).toFixed(2)),
      Number((prevClose + (price - prevClose) * 0.5).toFixed(2)),
      Number((prevClose + (price - prevClose) * 0.75).toFixed(2)),
      price
    ];
  }

  const cleanId = `online_${meta.symbol.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const indexItem = {
    id: cleanId,
    name: meta.shortName || meta.symbol,
    fullName: meta.longName || meta.shortName || `${meta.symbol} Benchmark`,
    ticker: meta.symbol,
    proxySymbol: meta.symbol,
    country: location.country,
    countryCode: location.countryCode,
    flag: location.flag,
    region: location.region,
    exchange: meta.exchangeName || 'Market',
    currency: meta.currency || 'USD',
    marketCap: formatMagnitude(meta.marketCap, true),
    importanceTier: 2,
    basePrice: Number(price.toFixed(2)),
    baseChange: change,
    baseChangePercent: changePercent,
    openPrice: Number(openPrice.toFixed(2)),
    dayHigh: Number(dayHigh.toFixed(2)),
    dayLow: Number(dayLow.toFixed(2)),
    prevClose: Number(prevClose.toFixed(2)),
    volume: formatMagnitude(meta.regularMarketVolume),
    yearHigh: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : dayHigh,
    yearLow: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : dayLow,
    peRatio: meta.trailingPE ? String(meta.trailingPE.toFixed(1)) : 'N/A',
    description: `${meta.longName || meta.shortName || meta.symbol} (${meta.symbol}) - Real-time market benchmark quote fetched online from global exchanges.`,
    sparkline,
    isOnlineFetched: true
  };

  return {
    success: true,
    data: indexItem
  };
}

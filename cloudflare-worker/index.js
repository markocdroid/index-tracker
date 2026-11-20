export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (reqUrl.pathname === '/health') {
      return jsonResponse({ ok: true, service: 'index-tracker-yahoo-proxy' });
    }

    // Route 1 (preferred): /yahoo/<path>?<query>
    // Example: /yahoo/v8/finance/chart/AAPL?interval=1d&range=1d
    let targetUrl = '';
    if (reqUrl.pathname.startsWith('/yahoo/')) {
      const yahooPath = reqUrl.pathname.replace('/yahoo', '');
      targetUrl = `https://query1.finance.yahoo.com${yahooPath}${reqUrl.search}`;
    }

    // Route 2 (fallback): /?url=<absolute yahoo url>
    if (!targetUrl) {
      const direct = reqUrl.searchParams.get('url');
      if (direct) {
        try {
          const parsed = new URL(direct);
          if (parsed.hostname.endsWith('finance.yahoo.com')) {
            targetUrl = parsed.toString();
          }
        } catch {
          return jsonResponse({ error: 'Invalid url parameter' }, 400);
        }
      }
    }

    if (!targetUrl) {
      return jsonResponse({
        error: 'Missing target. Use /yahoo/<path>?<query> or ?url=https://query1.finance.yahoo.com/...'
      }, 400);
    }

    try {
      const upstream = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IndexTrackerYahooProxy/1.0 (+https://github.com/markocdroid/index-tracker)'
        }
      });

      const body = await upstream.text();
      const headers = {
        ...corsHeaders(),
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=20, s-maxage=20'
      };

      return new Response(body, {
        status: upstream.status,
        headers
      });
    } catch {
      return jsonResponse({ error: 'Upstream fetch failed' }, 502);
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Vary': 'Origin'
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

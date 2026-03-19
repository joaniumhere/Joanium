// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Features/Chat/ToolExecutor.js
//  Executes a tool call decided by the AI and returns a result string.
//  Free API tools (weather, crypto, FRED, etc.) call APIs directly from renderer.
// ─────────────────────────────────────────────

/* ══════════════════════════════════════════
   WEATHER CODE MAP  (Open-Meteo WMO codes)
══════════════════════════════════════════ */
const WMO_CODES = {
  0: '☀️ Clear sky',        1: '🌤️ Mainly clear',     2: '⛅ Partly cloudy',
  3: '☁️ Overcast',          45: '🌫️ Foggy',            48: '🌫️ Icy fog',
  51: '🌦️ Light drizzle',    53: '🌦️ Drizzle',          55: '🌦️ Heavy drizzle',
  61: '🌧️ Slight rain',      63: '🌧️ Moderate rain',    65: '🌧️ Heavy rain',
  71: '🌨️ Slight snow',      73: '🌨️ Moderate snow',    75: '❄️ Heavy snow',
  77: '🌨️ Snow grains',      80: '🌦️ Light showers',    81: '🌧️ Showers',
  82: '⛈️ Violent showers',  85: '🌨️ Snow showers',     86: '❄️ Heavy snow showers',
  95: '⛈️ Thunderstorm',     96: '⛈️ Thunderstorm + hail', 99: '⛈️ Thunderstorm + heavy hail',
};

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
function fmt(n, decimals = 2) {
  return n != null ? Number(n).toLocaleString('en-US', { maximumFractionDigits: decimals }) : 'N/A';
}

function fmtBig(n) {
  if (n == null) return 'N/A';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmt(n)}`;
}

async function safeJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
  return res.json();
}

/**
 * Execute a single tool call.
 * @param {string} toolName
 * @param {object} params
 * @param {function} onStage  — callback(message) to update the UI during execution
 * @returns {Promise<string>} — a plain-text result to feed back to the AI
 */
export async function executeTool(toolName, params, onStage = () => {}) {
  switch (toolName) {

    /* ════════════════════════════════════════════
       GMAIL TOOLS
    ════════════════════════════════════════════ */

    case 'gmail_send_email': {
      const { to, subject, body } = params;
      if (!to || !subject || !body) throw new Error('Missing required params: to, subject, body');
      onStage(`📤 Sending email to **${to}**…`);
      const res = await window.electronAPI?.gmailSend?.(to, subject, body);
      if (!res?.ok) throw new Error(res?.error ?? 'Failed to send email');
      return `Email sent successfully to ${to} with subject "${subject}".`;
    }

    case 'gmail_read_inbox': {
      const maxResults = params.maxResults ?? 15;
      onStage(`📬 Connecting to Gmail…`);
      onStage(`📥 Fetching unread emails…`);
      const res = await window.electronAPI?.gmailGetBrief?.(maxResults);
      if (!res?.ok) throw new Error(res?.error ?? 'Gmail not connected');
      onStage(`📖 Reading ${res.count} email${res.count !== 1 ? 's' : ''}…`);
      if (res.count === 0) return 'Inbox is empty — no unread emails.';
      return `Found ${res.count} unread email(s):\n\n${res.text}`;
    }

    case 'gmail_search_emails': {
      const { query, maxResults = 10 } = params;
      if (!query) throw new Error('Missing required param: query');
      onStage(`🔍 Searching Gmail for **"${query}"**…`);
      const res = await window.electronAPI?.gmailSearch?.(query, maxResults);
      if (!res?.ok) throw new Error(res?.error ?? 'Gmail error');
      if (!res.emails?.length) return `No emails found matching "${query}".`;
      const lines = res.emails.map((e, i) =>
        `${i + 1}. Subject: "${e.subject}" | From: ${e.from}\n   Preview: ${e.snippet}`
      ).join('\n\n');
      return `Found ${res.emails.length} email(s) matching "${query}":\n\n${lines}`;
    }

    /* ════════════════════════════════════════════
       GITHUB TOOLS
    ════════════════════════════════════════════ */

    case 'github_list_repos': {
      onStage(`🐙 Connecting to GitHub…`);
      onStage(`📦 Fetching repositories…`);
      const res = await window.electronAPI?.githubGetRepos?.();
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub not connected');
      const lines = res.repos.slice(0, 20).map(r =>
        `- ${r.full_name}: ${r.description || 'No description'} [${r.language || 'unknown'}] ⭐${r.stargazers_count}`
      ).join('\n');
      return `User has ${res.repos.length} repos (showing top 20):\n\n${lines}`;
    }

    case 'github_get_issues': {
      const { owner, repo } = params;
      if (!owner || !repo) throw new Error('Missing required params: owner, repo');
      onStage(`🐛 Fetching issues from **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetIssues?.(owner, repo);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      if (!res.issues?.length) return `No open issues in ${owner}/${repo}.`;
      const lines = res.issues.map(i => `#${i.number}: ${i.title} (by ${i.user?.login})`).join('\n');
      return `${res.issues.length} open issue(s) in ${owner}/${repo}:\n\n${lines}`;
    }

    case 'github_get_pull_requests': {
      const { owner, repo } = params;
      if (!owner || !repo) throw new Error('Missing required params: owner, repo');
      onStage(`🔀 Fetching pull requests from **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetPRs?.(owner, repo);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      if (!res.prs?.length) return `No open pull requests in ${owner}/${repo}.`;
      const lines = res.prs.map(p => `#${p.number}: ${p.title} (by ${p.user?.login})`).join('\n');
      return `${res.prs.length} open PR(s) in ${owner}/${repo}:\n\n${lines}`;
    }

    case 'github_get_file': {
      const { owner, repo, filePath } = params;
      if (!owner || !repo || !filePath) throw new Error('Missing required params: owner, repo, filePath');
      onStage(`📂 Loading \`${filePath}\` from **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetFile?.(owner, repo, filePath);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      const preview = res.content.length > 4000
        ? res.content.slice(0, 4000) + '\n...(truncated)'
        : res.content;
      return `Contents of ${res.path} from ${owner}/${repo}:\n\`\`\`\n${preview}\n\`\`\``;
    }

    case 'github_get_file_tree': {
      const { owner, repo } = params;
      if (!owner || !repo) throw new Error('Missing required params: owner, repo');
      onStage(`🌲 Reading file tree of **${owner}/${repo}**…`);
      const res = await window.electronAPI?.githubGetTree?.(owner, repo);
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      const blobs = res.tree.filter(f => f.type === 'blob');
      const files = blobs.slice(0, 100).map(f => f.path).join('\n');
      return `File tree of ${owner}/${repo} (${blobs.length} files):\n\n${files}`;
    }

    case 'github_get_notifications': {
      onStage(`🔔 Fetching GitHub notifications…`);
      const res = await window.electronAPI?.githubGetNotifications?.();
      if (!res?.ok) throw new Error(res?.error ?? 'GitHub error');
      const n = res.notifications ?? [];
      if (!n.length) return 'No unread GitHub notifications.';
      const lines = n.slice(0, 10).map((n2, i) =>
        `${i + 1}. ${n2.subject?.title} in ${n2.repository?.full_name}`
      ).join('\n');
      return `${n.length} unread notification(s):\n\n${lines}`;
    }

    /* ════════════════════════════════════════════
       WEATHER  (Open-Meteo — free, no key)
    ════════════════════════════════════════════ */

    case 'get_weather': {
      const { location, units = 'celsius' } = params;
      if (!location) throw new Error('Missing required param: location');
      onStage(`🌍 Locating **${location}**…`);

      // Step 1: Geocode
      const geoData = await safeJson(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&format=json`
      );
      if (!geoData.results?.length) {
        return `Couldn't find a location called "${location}". Try a specific city name like "Mumbai" or "London".`;
      }
      const { latitude, longitude, name, country, timezone } = geoData.results[0];
      onStage(`🌡️ Fetching weather for **${name}, ${country}**…`);

      // Step 2: Weather
      const tz = encodeURIComponent(timezone ?? 'auto');
      const weatherData = await safeJson(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,` +
        `weather_code,precipitation,cloud_cover,surface_pressure` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
        `&temperature_unit=${units}&wind_speed_unit=kmh&timezone=${tz}&forecast_days=3`
      );

      const c = weatherData.current;
      const d = weatherData.daily;
      const deg = units === 'fahrenheit' ? '°F' : '°C';
      const desc = WMO_CODES[c.weather_code] ?? '🌡️ Unknown conditions';

      const forecast = d?.time?.slice(0, 3).map((date, i) => {
        const wc = WMO_CODES[d.weathercode[i]] ?? '';
        return `  ${date}: ${wc.split(' ').slice(1).join(' ')} | ${d.temperature_2m_max[i]}${deg} / ${d.temperature_2m_min[i]}${deg} | Precip: ${d.precipitation_sum[i]}mm`;
      }).join('\n') ?? 'No forecast data';

      return [
        `📍 ${name}, ${country}`,
        ``,
        `Current Conditions: ${desc}`,
        `🌡️  Temperature: ${c.temperature_2m}${deg} (feels like ${c.apparent_temperature}${deg})`,
        `💧 Humidity: ${c.relative_humidity_2m}%`,
        `💨 Wind: ${c.wind_speed_10m} km/h`,
        `☁️  Cloud cover: ${c.cloud_cover}%`,
        `🌧️  Precipitation: ${c.precipitation}mm`,
        `⚙️  Pressure: ${c.surface_pressure} hPa`,
        ``,
        `3-Day Forecast:`,
        forecast,
        ``,
        `Source: Open-Meteo (open-meteo.com)`,
      ].join('\n');
    }

    /* ════════════════════════════════════════════
       CRYPTO  (CoinGecko — free, no key)
    ════════════════════════════════════════════ */

    case 'get_crypto_price': {
      const { coin, vs_currency = 'usd' } = params;
      if (!coin) throw new Error('Missing required param: coin (e.g. "bitcoin", "ethereum", "BTC")');
      onStage(`🔍 Searching for **${coin}**…`);

      // Search for coin ID
      const searchData = await safeJson(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(coin)}`
      );
      const coinResult = searchData.coins?.[0];
      if (!coinResult) {
        return `Couldn't find cryptocurrency "${coin}". Try common names like "bitcoin", "ethereum", "solana", "dogecoin".`;
      }

      onStage(`📈 Loading market data for **${coinResult.name}**…`);

      const currencies = [vs_currency, 'usd', 'eur', 'inr'].filter((v, i, a) => a.indexOf(v) === i).join(',');
      const priceData = await safeJson(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinResult.id}` +
        `&vs_currencies=${currencies}` +
        `&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`
      );

      const d = priceData[coinResult.id];
      if (!d) return `Price data temporarily unavailable for "${coinResult.name}". Try again shortly.`;

      const change = d[`${vs_currency}_24h_change`]?.toFixed(2) ?? 'N/A';
      const changeDir = parseFloat(change) >= 0 ? '📈' : '📉';
      const changeLabel = parseFloat(change) >= 0 ? `+${change}%` : `${change}%`;
      const lastUpdated = d.last_updated_at
        ? new Date(d.last_updated_at * 1000).toLocaleString()
        : 'N/A';

      const lines = [
        `🪙 ${coinResult.name} (${coinResult.symbol.toUpperCase()})`,
        ``,
        `Price (${vs_currency.toUpperCase()}): ${fmt(d[vs_currency])} ${changeDir} ${changeLabel} (24h)`,
        `Market Cap: ${fmtBig(d[`${vs_currency}_market_cap`])}`,
        `24h Volume: ${fmtBig(d[`${vs_currency}_24h_vol`])}`,
      ];

      // Add other currencies
      if (vs_currency !== 'usd' && d.usd)  lines.push(`USD: $${fmt(d.usd)}`);
      if (vs_currency !== 'eur' && d.eur)  lines.push(`EUR: €${fmt(d.eur)}`);
      if (vs_currency !== 'inr' && d.inr)  lines.push(`INR: ₹${fmt(d.inr, 0)}`);
      lines.push(``, `Last updated: ${lastUpdated}`, `Source: CoinGecko`);

      return lines.join('\n');
    }

    case 'get_crypto_trending': {
      onStage(`🔥 Fetching trending coins…`);

      const data = await safeJson('https://api.coingecko.com/api/v3/search/trending');
      const trending = data.coins?.slice(0, 7) ?? [];
      if (!trending.length) return 'No trending coins data available right now.';

      const lines = trending.map((t, i) => {
        const c = t.item;
        return `${i + 1}. ${c.name} (${c.symbol}) — Rank #${c.market_cap_rank ?? '?'}`;
      });

      return `🔥 Trending on CoinGecko right now:\n\n${lines.join('\n')}\n\nSource: CoinGecko`;
    }

    /* ════════════════════════════════════════════
       EXCHANGE RATES  (open.er-api.com — free)
    ════════════════════════════════════════════ */

    case 'get_exchange_rate': {
      const { from = 'USD', to } = params;
      const fromUpper = from.toUpperCase();
      onStage(`💱 Fetching exchange rates for **${fromUpper}**…`);

      const data = await safeJson(`https://open.er-api.com/v6/latest/${fromUpper}`);

      if (data.result !== 'success') {
        throw new Error(`Exchange rate API error: ${data['error-type'] ?? 'Unknown error'}. Try a valid ISO currency code like USD, EUR, GBP, JPY, INR.`);
      }

      const rates = data.rates;
      const updated = new Date(data.time_last_update_utc).toLocaleString();

      if (to) {
        // Specific conversion requested
        const toUpper = to.toUpperCase();
        const rate = rates[toUpper];
        if (!rate) return `Currency "${to}" not found. Use ISO codes like USD, EUR, GBP, JPY, INR, AUD, CAD, CHF, CNY, SGD.`;

        // Build a few reference rates
        const MAJORS = ['USD','EUR','GBP','JPY','INR','CAD','AUD','CHF','CNY','SGD','AED'];
        const refs = MAJORS.filter(c => c !== fromUpper).slice(0, 8)
          .map(c => `  ${c}: ${fmt(rates[c], 4)}`)
          .join('\n');

        return [
          `💱 Exchange Rates (1 ${fromUpper})`,
          ``,
          `➤ ${toUpper}: **${fmt(rate, 6)}**`,
          `  (1 ${toUpper} = ${fmt(1 / rate, 6)} ${fromUpper})`,
          ``,
          `Other major rates:`,
          refs,
          ``,
          `Last updated: ${updated}`,
          `Source: open.er-api.com`,
        ].join('\n');
      }

      // General rates
      const DISPLAY = ['USD','EUR','GBP','JPY','INR','CAD','AUD','CHF','CNY','SGD','AED','BRL','MXN','KRW','THB'];
      const rateLines = DISPLAY.filter(c => c !== fromUpper && rates[c])
        .map(c => `  ${c}: ${fmt(rates[c], 4)}`)
        .join('\n');

      return [
        `💱 Exchange Rates (1 ${fromUpper})`,
        ``,
        rateLines,
        ``,
        `Last updated: ${updated}`,
        `Source: open.er-api.com`,
      ].join('\n');
    }

    /* ════════════════════════════════════════════
       US TREASURY  (fiscaldata.treasury.gov — free)
    ════════════════════════════════════════════ */

    case 'get_treasury_data': {
      const { type = 'debt' } = params;
      onStage(`🏛️ Fetching US Treasury data (${type})…`);

      const BASE = 'https://api.fiscaldata.treasury.gov/services/api/v1';
      let url, title, formatter;

      switch (type) {
        case 'debt':
          url = `${BASE}/debt/od/debt_to_penny/?fields=record_date,tot_pub_debt_out_amt&sort=-record_date&limit=7`;
          title = '🏛️ US National Debt (Total Public Debt Outstanding)';
          formatter = rows => rows.map(r => {
            const debt = (parseFloat(r.tot_pub_debt_out_amt) / 1e12).toFixed(3);
            return `  ${r.record_date}: $${debt} trillion`;
          }).join('\n');
          break;

        case 'rates':
          url = `${BASE}/debt/od/avg_interest_rates/?fields=record_date,security_type_desc,avg_interest_rate_amt&sort=-record_date&limit=12`;
          title = '📊 US Treasury Average Interest Rates';
          formatter = rows => rows.map(r =>
            `  ${r.record_date} | ${r.security_type_desc}: ${r.avg_interest_rate_amt}%`
          ).join('\n');
          break;

        case 'balance':
          url = `${BASE}/accounting/dts/dts_table_1/?fields=record_date,open_today_bal,close_today_bal,open_month_bal,open_fiscal_year_bal&sort=-record_date&limit=5`;
          title = '💰 US Treasury Daily Cash Balance';
          formatter = rows => rows.map(r => {
            const open  = parseFloat(r.open_today_bal)  / 1000;
            const close = parseFloat(r.close_today_bal) / 1000;
            return `  ${r.record_date}: Open $${open.toFixed(1)}B → Close $${close.toFixed(1)}B`;
          }).join('\n');
          break;

        default:
          return `Unknown treasury data type "${type}". Available: "debt", "rates", "balance".\n\n- debt: National debt total\n- rates: Average interest rates on securities\n- balance: Daily Treasury cash balance`;
      }

      const data = await safeJson(url);
      if (!data.data?.length) return `No treasury data currently available for type "${type}". Try again later.`;

      return [
        title,
        ``,
        formatter(data.data),
        ``,
        `Source: fiscaldata.treasury.gov`,
      ].join('\n');
    }

    /* ════════════════════════════════════════════
       FRED ECONOMIC DATA  (Federal Reserve)
    ════════════════════════════════════════════ */

    case 'get_fred_data': {
      const { series_id, limit = 6 } = params;
      if (!series_id) {
        return [
          'Missing required param: series_id.',
          '',
          'Common FRED series IDs:',
          '  GDP       — Gross Domestic Product',
          '  UNRATE    — Unemployment Rate',
          '  CPIAUCSL  — Consumer Price Index (inflation)',
          '  FEDFUNDS  — Federal Funds Rate',
          '  DGS10     — 10-Year Treasury Yield',
          '  DGS2      — 2-Year Treasury Yield',
          '  SP500     — S&P 500 Index',
          '  MORTGAGE30US — 30-Year Mortgage Rate',
          '  DCOILWTICO — WTI Crude Oil Price',
          '  DEXUSEU   — USD/EUR Exchange Rate',
        ].join('\n');
      }

      const sid = series_id.toUpperCase();
      onStage(`📊 Fetching FRED series **${sid}**…`);

      // Get optional FRED API key
      let apiKey = 'abcdefghijklmnopqrstuvwxyz012345'; // Public demo — limited access
      try {
        const config = await window.electronAPI?.getFreeConnectorConfig?.('fred');
        if (config?.credentials?.apiKey?.trim()) {
          apiKey = config.credentials.apiKey.trim();
        } else {
          onStage(`ℹ️ Using public FRED access — add a free API key for full access`);
        }
      } catch {}

      const FRED_BASE = 'https://api.stlouisfed.org/fred';
      const keyParam  = `api_key=${apiKey}&file_type=json`;

      // Fetch series metadata
      let seriesInfo = null;
      try {
        const infoData = await safeJson(`${FRED_BASE}/series?series_id=${sid}&${keyParam}`);
        if (infoData.error_message) throw new Error(infoData.error_message);
        seriesInfo = infoData.seriess?.[0];
      } catch (err) {
        const note = apiKey === 'abcdefghijklmnopqrstuvwxyz012345'
          ? 'Tip: Add a free FRED API key in Settings → Connectors to unlock all series.'
          : '';
        return `FRED error for "${sid}": ${err.message}\n\n${note}\n\nCommon IDs: GDP, UNRATE, CPIAUCSL, FEDFUNDS, DGS10, SP500`;
      }

      onStage(`📈 Loading observations for **${seriesInfo?.title ?? sid}**…`);

      // Fetch observations
      const obsData = await safeJson(
        `${FRED_BASE}/series/observations?series_id=${sid}&${keyParam}&limit=${limit}&sort_order=desc`
      );

      const obs = (obsData.observations ?? []).filter(o => o.value !== '.').slice(0, limit);
      if (!obs.length) return `No data available for FRED series "${sid}".`;

      const unitsShort = seriesInfo?.units_short ?? seriesInfo?.units ?? '';
      const obsLines = obs.map(o =>
        `  ${o.date}: ${parseFloat(o.value).toLocaleString('en-US', { maximumFractionDigits: 4 })}${unitsShort ? ' ' + unitsShort : ''}`
      ).join('\n');

      return [
        `📊 ${seriesInfo?.title ?? sid}`,
        `Series ID: ${sid}`,
        `Frequency: ${seriesInfo?.frequency ?? 'Unknown'}`,
        `Units: ${seriesInfo?.units ?? 'Unknown'}`,
        `Last updated: ${seriesInfo?.last_updated?.split(' ')[0] ?? 'N/A'}`,
        ``,
        `Recent values (newest first):`,
        obsLines,
        ``,
        `Source: Federal Reserve Bank of St. Louis (FRED)`,
        `More data: fred.stlouisfed.org/series/${sid}`,
      ].join('\n');
    }

    /* ════════════════════════════════════════════
       UNSPLASH PHOTOS  (free key required)
    ════════════════════════════════════════════ */

    case 'search_photos': {
      const { query, count = 5, orientation } = params;
      if (!query) throw new Error('Missing required param: query');

      // Get Unsplash API key
      let apiKey = '';
      try {
        const config = await window.electronAPI?.getFreeConnectorConfig?.('unsplash');
        apiKey = config?.credentials?.apiKey?.trim() ?? '';
      } catch {}

      if (!apiKey) {
        return [
          `Unsplash photo search requires an API key.`,
          ``,
          `To set up:`,
          `1. Go to unsplash.com/developers`,
          `2. Create a free account and register an app`,
          `3. Copy your Access Key`,
          `4. In openworld: Settings → Connectors → Unsplash → Add key`,
          ``,
          `The free tier allows 50 requests/hour.`,
        ].join('\n');
      }

      onStage(`📷 Searching Unsplash for **"${query}"**…`);

      const perPage = Math.min(count, 10);
      const orientParam = orientation ? `&orientation=${orientation}` : '';
      const data = await safeJson(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}${orientParam}`,
        { headers: { Authorization: `Client-ID ${apiKey}` } }
      );

      if (!data.results?.length) {
        return `No photos found for "${query}" on Unsplash. Try different keywords.`;
      }

      const photos = data.results.map((p, i) => {
        const desc = p.description || p.alt_description || 'No description';
        return [
          `${i + 1}. ${desc}`,
          `   📸 By: ${p.user?.name ?? 'Unknown'} (@${p.user?.username ?? '?'})`,
          `   🔗 Full: ${p.urls?.full ?? p.links?.html}`,
          `   🖼️ Regular: ${p.urls?.regular}`,
          `   🔸 Thumb: ${p.urls?.thumb}`,
          `   ❤️ Likes: ${p.likes ?? 0} | 📐 ${p.width}×${p.height}`,
        ].join('\n');
      }).join('\n\n');

      return [
        `📷 Unsplash results for "${query}" (${data.total?.toLocaleString() ?? '?'} total):`,
        ``,
        photos,
        ``,
        `Source: Unsplash (unsplash.com)`,
      ].join('\n');
    }

    /* ════════════════════════════════════════════
       UNKNOWN TOOL
    ════════════════════════════════════════════ */

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

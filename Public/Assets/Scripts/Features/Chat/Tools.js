// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Features/Chat/Tools.js
//  Defines all available tools the AI can call.
//  These are sent to the AI so it can decide what to invoke.
// ─────────────────────────────────────────────

export const TOOLS = [

  // ── Gmail ────────────────────────────────────────────────────────────
  {
    name: 'gmail_send_email',
    description: 'Send an email via the user\'s connected Gmail account.',
    category: 'gmail',
    parameters: {
      to:      { type: 'string',  required: true,  description: 'Recipient email address' },
      subject: { type: 'string',  required: true,  description: 'Email subject line' },
      body:    { type: 'string',  required: true,  description: 'Email body / message content' },
    },
  },
  {
    name: 'gmail_read_inbox',
    description: 'Fetch and summarize the user\'s unread emails from Gmail.',
    category: 'gmail',
    parameters: {
      maxResults: { type: 'number', required: false, description: 'Max emails to fetch (default 15)' },
    },
  },
  {
    name: 'gmail_search_emails',
    description: 'Search the user\'s Gmail inbox for emails matching a query.',
    category: 'gmail',
    parameters: {
      query:      { type: 'string',  required: true,  description: 'Gmail search query (e.g. "from:boss", "project alpha")' },
      maxResults: { type: 'number',  required: false, description: 'Max results (default 10)' },
    },
  },

  // ── GitHub ────────────────────────────────────────────────────────────
  {
    name: 'github_list_repos',
    description: 'List the user\'s GitHub repositories.',
    category: 'github',
    parameters: {},
  },
  {
    name: 'github_get_issues',
    description: 'Get open issues for a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true,  description: 'GitHub username or organization' },
      repo:  { type: 'string', required: true,  description: 'Repository name' },
    },
  },
  {
    name: 'github_get_pull_requests',
    description: 'Get open pull requests for a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true,  description: 'GitHub username or organization' },
      repo:  { type: 'string', required: true,  description: 'Repository name' },
    },
  },
  {
    name: 'github_get_file',
    description: 'Load the contents of a specific file from a GitHub repository.',
    category: 'github',
    parameters: {
      owner:    { type: 'string', required: true, description: 'GitHub username or organization' },
      repo:     { type: 'string', required: true, description: 'Repository name' },
      filePath: { type: 'string', required: true, description: 'Path to the file within the repo (e.g. "src/index.js")' },
    },
  },
  {
    name: 'github_get_file_tree',
    description: 'Get the full file/folder structure of a GitHub repository.',
    category: 'github',
    parameters: {
      owner: { type: 'string', required: true, description: 'GitHub username or organization' },
      repo:  { type: 'string', required: true, description: 'Repository name' },
    },
  },
  {
    name: 'github_get_notifications',
    description: 'Get unread GitHub notifications for the user.',
    category: 'github',
    parameters: {},
  },

  // ── Weather (Open-Meteo — free, no key) ───────────────────────────────
  {
    name: 'get_weather',
    description: 'Get current weather and conditions for any city or location using Open-Meteo. Returns temperature, humidity, wind speed, and weather description.',
    category: 'open_meteo',
    parameters: {
      location: { type: 'string', required: true, description: 'City name or location (e.g. "Chennai", "New York", "Tokyo")' },
      units:    { type: 'string', required: false, description: 'Temperature units: "celsius" (default) or "fahrenheit"' },
    },
  },

  // ── Crypto (CoinGecko — free, no key) ─────────────────────────────────
  {
    name: 'get_crypto_price',
    description: 'Get real-time cryptocurrency price, market cap, 24h change, and trading volume from CoinGecko. Works for Bitcoin, Ethereum, and thousands of tokens.',
    category: 'coingecko',
    parameters: {
      coin: { type: 'string', required: true, description: 'Coin name or symbol (e.g. "bitcoin", "ethereum", "solana", "BTC", "ETH")' },
      vs_currency: { type: 'string', required: false, description: 'Quote currency (default: "usd"). Can be "usd", "eur", "inr", "gbp", etc.' },
    },
  },
  {
    name: 'get_crypto_trending',
    description: 'Get the top trending cryptocurrencies on CoinGecko right now.',
    category: 'coingecko',
    parameters: {},
  },

  // ── Currency Exchange (open.er-api.com — free, no key) ────────────────
  {
    name: 'get_exchange_rate',
    description: 'Get real-time currency exchange rates for 160+ currencies. Convert between any two currencies.',
    category: 'exchange_rate',
    parameters: {
      from: { type: 'string', required: true,  description: 'Base currency ISO code (e.g. "USD", "EUR", "INR", "GBP")' },
      to:   { type: 'string', required: false, description: 'Target currency ISO code (e.g. "EUR"). If omitted, returns all major rates.' },
    },
  },

  // ── US Treasury (fiscaldata.treasury.gov — free, no key) ─────────────
  {
    name: 'get_treasury_data',
    description: 'Get official US Treasury financial data — national debt, average interest rates, or daily cash balance from fiscaldata.treasury.gov.',
    category: 'treasury',
    parameters: {
      type: {
        type: 'string',
        required: false,
        description: 'Type of data: "debt" (national debt, default), "rates" (average interest rates), or "balance" (daily cash balance)',
      },
    },
  },

  // ── FRED Economic Data (Federal Reserve — optional key) ───────────────
  {
    name: 'get_fred_data',
    description: 'Get economic data from the Federal Reserve (FRED). Covers GDP, unemployment rate, CPI/inflation, federal funds rate, and hundreds of other indicators.',
    category: 'fred',
    parameters: {
      series_id: {
        type: 'string',
        required: true,
        description: 'FRED series ID (e.g. "GDP", "UNRATE" for unemployment, "CPIAUCSL" for CPI/inflation, "FEDFUNDS" for fed rate, "DGS10" for 10-year treasury yield, "SP500")',
      },
      limit: { type: 'number', required: false, description: 'Number of recent observations to return (default: 5)' },
    },
  },

  // ── Unsplash Photos (free key required) ───────────────────────────────
  {
    name: 'search_photos',
    description: 'Search for high-quality free photos on Unsplash. Returns photo URLs, descriptions, and photographer credits. Requires Unsplash API key.',
    category: 'unsplash',
    parameters: {
      query:       { type: 'string',  required: true,  description: 'Search query (e.g. "sunset mountain", "minimal workspace", "urban street")' },
      count:       { type: 'number',  required: false, description: 'Number of photos to return (default: 5, max: 10)' },
      orientation: { type: 'string',  required: false, description: 'Photo orientation: "landscape", "portrait", or "squarish"' },
    },
  },

];

/**
 * Filter tools to only those whose connector is enabled.
 * Pass in the connectors status map from getConnectors().
 * @param {object} connectorStatuses  — result of window.electronAPI.getConnectors()
 * @returns {Array} filtered tools list
 */
export function filterToolsByConnectors(connectorStatuses = {}) {
  const CATEGORY_TO_CONNECTOR = {
    gmail:         'gmail',
    github:        'github',
    open_meteo:    'open_meteo',
    coingecko:     'coingecko',
    exchange_rate: 'exchange_rate',
    treasury:      'treasury',
    fred:          'fred',
    openweathermap:'openweathermap',
    unsplash:      'unsplash',
  };

  return TOOLS.filter(tool => {
    const connectorName = CATEGORY_TO_CONNECTOR[tool.category];
    if (!connectorName) return true; // no category = always include
    const status = connectorStatuses[connectorName];
    return status?.enabled === true;
  });
}

/**
 * Build a plain-text description of all tools for injection into a prompt.
 */
export function buildToolsPrompt(tools = TOOLS) {
  return tools.map(tool => {
    const params = Object.entries(tool.parameters).map(([key, p]) =>
      `    - ${key} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`
    ).join('\n');

    return [
      `• ${tool.name}`,
      `  Description: ${tool.description}`,
      params ? `  Parameters:\n${params}` : `  Parameters: none`,
    ].join('\n');
  }).join('\n\n');
}

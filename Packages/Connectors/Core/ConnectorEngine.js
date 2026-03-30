import fs from 'fs';
import path from 'path';

const DEFAULT_STATE = {
  connectors: {
    // ── Google Workspace — one entry for all Google services ───────────
    google: {
      enabled: false,
      isFree: false,
      credentials: {},    // { accessToken, refreshToken, tokenExpiry, email, clientId, clientSecret, services:{} }
      connectedAt: null,
    },

    // ── Other service connectors ───────────────────────────────────────
    github: {
      enabled: false,
      isFree: false,
      credentials: {},
      connectedAt: null,
    },

    // ── Free APIs — no key required, enabled by default ────────────────
    open_meteo:    { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    coingecko:     { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    exchange_rate: { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    treasury:      { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    wikipedia:     { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    ipgeo:         { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    funfacts:      { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    jokeapi:       { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    quotes:        { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    restcountries: { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    hackernews:    { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    cleanuri:      { enabled: true,  isFree: true, noKey: true,  credentials: {}, connectedAt: null },
    nasa:          { enabled: true,  isFree: true, noKey: false, credentials: { apiKey: '' }, connectedAt: null },
    fred:          { enabled: true,  isFree: true, noKey: false, credentials: { apiKey: '' }, connectedAt: null },
    openweathermap:{ enabled: false, isFree: true, noKey: false, credentials: { apiKey: '' }, connectedAt: null },
    unsplash:      { enabled: false, isFree: true, noKey: false, credentials: { apiKey: '' }, connectedAt: null },
  },
};

export class ConnectorEngine {
  constructor(filePath) {
    this.filePath = filePath;
    this._data = null;
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this._data = JSON.parse(raw);
      } else {
        this._data = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
    } catch {
      this._data = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    // Ensure all default slots exist
    for (const [key, val] of Object.entries(DEFAULT_STATE.connectors)) {
      if (!this._data.connectors[key]) {
        this._data.connectors[key] = JSON.parse(JSON.stringify(val));
      } else {
        this._data.connectors[key].isFree = val.isFree ?? false;
        this._data.connectors[key].noKey  = val.noKey  ?? false;
      }
    }


    return this._data;
  }

  _persist() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.filePath, JSON.stringify(this._data, null, 2), 'utf-8');
    } catch (err) { console.error('[ConnectorEngine] _persist error:', err); }
  }

  /* ── Public status API (no secrets) ── */
  getAll() {
    const data = this._load();
    return Object.fromEntries(
      Object.entries(data.connectors).map(([name, c]) => [
        name,
        {
          enabled:     c.enabled,
          connectedAt: c.connectedAt,
          isFree:      c.isFree ?? false,
          noKey:       c.noKey  ?? false,
        },
      ]),
    );
  }

  getConnector(name)   { return this._load().connectors[name] ?? null; }

  /** Returns full credentials (including tokens). Used internally by IPC handlers. */
  getCredentials(name) {
    const c = this._load().connectors[name];
    if (!c?.enabled || !Object.keys(c.credentials ?? {}).length) return null;
    return c.credentials;
  }

  /** Exposes stored credentials for UI (e.g. service badge refresh) — only non-secret fields. */
  getSafeCredentials(name) {
    const creds = this.getCredentials(name);
    if (!creds) return null;
    const { accessToken, refreshToken, clientSecret, ...safe } = creds; // strip secrets
    return safe;
  }

  getFreeConnectorConfig(name) {
    const c = this._load().connectors[name];
    if (!c) return null;
    return { enabled: c.enabled, isFree: c.isFree ?? false, noKey: c.noKey ?? false, credentials: c.credentials ?? {} };
  }

  toggleFreeConnector(name, enabled) {
    this._load();
    const c = this._data.connectors[name];
    if (!c || !c.isFree) return;
    c.enabled = Boolean(enabled);
    this._persist();
  }

  saveFreeConnectorKey(name, apiKey) {
    this._load();
    const c = this._data.connectors[name];
    if (!c || !c.isFree) return;
    c.credentials = { ...c.credentials, apiKey: String(apiKey ?? '').trim() };
    if (!c.noKey && apiKey?.trim()) c.enabled = true;
    this._persist();
  }

  saveConnector(name, credentials) {
    this._load();
    this._data.connectors[name] = {
      enabled:     true,
      isFree:      false,
      credentials: { ...(this._data.connectors[name]?.credentials ?? {}), ...credentials },
      connectedAt: new Date().toISOString(),
    };
    this._persist();
    return { enabled: true, connectedAt: this._data.connectors[name].connectedAt };
  }

  removeConnector(name) {
    this._load();
    const isFree = this._data.connectors[name]?.isFree ?? false;
    if (isFree) return;
    this._data.connectors[name] = { enabled: false, isFree: false, credentials: {}, connectedAt: null };
    this._persist();
  }

  updateCredentials(name, patch) {
    this._load();
    if (!this._data.connectors[name]) return;
    this._data.connectors[name].credentials = { ...this._data.connectors[name].credentials, ...patch };
    this._persist();
  }

  isConnected(name) {
    const c = this._load().connectors[name];
    if (!c) return false;
    if (c.isFree) return Boolean(c.enabled);
    return Boolean(c.enabled && Object.keys(c.credentials ?? {}).length > 0);
  }

  isEnabled(name) {
    const c = this._load().connectors[name];
    return Boolean(c?.enabled);
  }

  /** Convenience: check if a specific Google sub-service is available */
  isGoogleServiceEnabled(service) {
    const creds = this.getCredentials('google');
    return Boolean(creds?.services?.[service]);
  }
}

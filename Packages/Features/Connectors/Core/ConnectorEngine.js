import defineEngine from '../../../System/Contracts/DefineEngine.js';
import { cloneValue as deepClone } from '../../../System/Utils/CloneValue.js';

function buildDefaultState(featureRegistry = null) {
  const connectors = {};
  for (const connector of featureRegistry?.getConnectorDefaults?.() ?? []) {
    if (!connector?.id) continue;
    connectors[connector.id] = deepClone(connector.defaultState);
  }
  return { connectors };
}

export class ConnectorEngine {
  constructor(storage, featureRegistry = null) {
    this.storage = storage;
    this.featureRegistry = featureRegistry;
    this._data = null;
  }

  _load() {
    const defaultState = buildDefaultState(this.featureRegistry);

    try {
      const loaded = this.storage.load(() => deepClone(defaultState));
      const connectors =
        loaded?.connectors &&
        typeof loaded.connectors === 'object' &&
        !Array.isArray(loaded.connectors)
          ? loaded.connectors
          : {};
      this._data = {
        ...(loaded && typeof loaded === 'object' && !Array.isArray(loaded) ? loaded : {}),
        connectors,
      };
    } catch {
      this._data = deepClone(defaultState);
    }

    for (const [key, value] of Object.entries(defaultState.connectors)) {
      const current = this._data.connectors[key];
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        this._data.connectors[key] = deepClone(value);
      } else {
        this._data.connectors[key] = {
          ...deepClone(value),
          ...current,
          credentials: {
            ...(value.credentials ?? {}),
            ...(current.credentials ?? {}),
          },
          isFree: value.isFree ?? false,
          noKey: value.noKey ?? false,
        };
      }
    }

    return this._data;
  }

  _persist() {
    try {
      this.storage.save(this._data);
    } catch (err) {
      console.error('[ConnectorEngine] _persist error:', err);
    }
  }

  getAll() {
    const data = this._load();
    return Object.fromEntries(
      Object.entries(data.connectors).map(([name, connector]) => [
        name,
        {
          enabled: connector.enabled,
          connectedAt: connector.connectedAt,
          isFree: connector.isFree ?? false,
          noKey: connector.noKey ?? false,
        },
      ]),
    );
  }

  getConnector(name) {
    return this._load().connectors[name] ?? null;
  }

  getCredentials(name) {
    const connector = this._load().connectors[name];
    if (!connector?.enabled || !Object.keys(connector.credentials ?? {}).length) return null;
    return connector.credentials;
  }

  getSafeCredentials(name) {
    const credentials = this.getCredentials(name);
    if (!credentials) return null;
    const { accessToken, refreshToken, clientSecret, token, apiKey, ...safe } = credentials;
    return safe;
  }

  getFreeConnectorConfig(name) {
    const connector = this._load().connectors[name];
    if (!connector) return null;
    return {
      enabled: connector.enabled,
      isFree: connector.isFree ?? false,
      noKey: connector.noKey ?? false,
      credentials: connector.credentials ?? {},
    };
  }

  toggleFreeConnector(name, enabled) {
    this._load();
    const connector = this._data.connectors[name];
    if (!connector || !connector.isFree) return;
    connector.enabled = Boolean(enabled);
    this._persist();
  }

  saveFreeConnectorKey(name, apiKey) {
    this._load();
    const connector = this._data.connectors[name];
    if (!connector || !connector.isFree) return;
    connector.credentials = { ...connector.credentials, apiKey: String(apiKey ?? '').trim() };
    if (!connector.noKey && apiKey?.trim()) connector.enabled = true;
    this._persist();
  }

  saveConnector(name, credentials) {
    this._load();
    this._data.connectors[name] = {
      enabled: true,
      isFree: this._data.connectors[name]?.isFree ?? false,
      noKey: this._data.connectors[name]?.noKey ?? false,
      credentials: { ...(this._data.connectors[name]?.credentials ?? {}), ...credentials },
      connectedAt: new Date().toISOString(),
    };
    this._persist();
    return { enabled: true, connectedAt: this._data.connectors[name].connectedAt };
  }

  removeConnector(name) {
    this._load();
    const connector = this._data.connectors[name];
    if (connector?.isFree) return;
    this._data.connectors[name] = {
      enabled: false,
      isFree: connector?.isFree ?? false,
      noKey: connector?.noKey ?? false,
      credentials: {},
      connectedAt: null,
    };
    this._persist();
  }

  updateCredentials(name, patch) {
    this._load();
    if (!this._data.connectors[name]) return;
    this._data.connectors[name].credentials = {
      ...this._data.connectors[name].credentials,
      ...patch,
    };
    this._persist();
  }

  isConnected(name) {
    const connector = this._load().connectors[name];
    if (!connector) return false;
    if (connector.isFree) return Boolean(connector.enabled);
    return Boolean(connector.enabled && Object.keys(connector.credentials ?? {}).length > 0);
  }

  isEnabled(name) {
    const connector = this._load().connectors[name];
    return Boolean(connector?.enabled);
  }

  isGoogleServiceEnabled(service) {
    const credentials = this.getCredentials('google');
    return Boolean(credentials?.services?.[service]);
  }
}

export const engineMeta = defineEngine({
  id: 'connectors',
  provides: 'connectorEngine',
  needs: ['featureRegistry', 'featureStorage'],
  storage: {
    key: 'connectors',
    featureKey: 'connectors',
    fileName: 'Connectors.json',
  },
  create: ({ featureRegistry, featureStorage }) =>
    new ConnectorEngine(featureStorage.get('connectors'), featureRegistry),
});

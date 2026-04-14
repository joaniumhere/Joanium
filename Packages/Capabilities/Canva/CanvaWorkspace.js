import crypto from 'crypto';
import http from 'http';
import { shell } from 'electron';

const REDIRECT_URI = 'http://localhost:42814/oauth/callback';
const TOKEN_URL = 'https://api.canva.com/rest/v1/oauth/token';
const AUTH_URL = 'https://www.canva.com/api/oauth/authorize';
const SCOPES = 'design:content:read profile:read';

let _connectorEngine = null;

export function setConnectorEngine(engine) {
  _connectorEngine = engine;
}

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function startOAuthFlow(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    let settled = false;
    function settle(fn) {
      if (!settled) {
        settled = true;
        fn();
      }
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:42814`);
        if (url.pathname !== '/oauth/callback') return res.end();

        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
          <h2>${error ? '❌ Connection failed' : '✅ Canva connected!'}</h2>
          <p>You can close this tab and return to Joanium.</p>
        </body></html>`);
        server.close();

        if (error || !code) {
          return settle(() => reject(new Error(error || 'No auth code returned')));
        }

        const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, codeVerifier);
        settle(() => resolve(tokens));
      } catch (err) {
        server.close();
        settle(() => reject(err));
      }
    });

    server.listen(42814, 'localhost', () => {
      const authUrl = new URL(AUTH_URL);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      shell.openExternal(authUrl.toString());
    });

    server.on('error', (err) => {
      settle(() => reject(new Error(`OAuth server error: ${err.message}`)));
    });
  });
}

async function exchangeCodeForTokens(code, clientId, clientSecret, codeVerifier) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description ?? data.error ?? 'Token exchange failed');
  }

  // Fetch user profile
  const profileRes = await fetch('https://api.canva.com/rest/v1/users/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  const profile = await profileRes.json().catch(() => ({}));
  const displayName = profile.user?.display_name ?? 'Canva user';

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    tokenExpiry: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
    displayName,
    clientId,
    clientSecret,
  };
}

export async function getFreshCreds(creds) {
  if (creds.tokenExpiry && !(Date.now() > creds.tokenExpiry - 120_000)) return creds;
  if (!creds.refreshToken) {
    throw new Error(
      'Canva token expired and no refresh token stored. Please reconnect Canva in Settings → Connectors.',
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: creds.refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Canva token refresh failed: ${err.error_description ?? err.error ?? res.status}. Please reconnect Canva.`,
    );
  }

  const data = await res.json();
  const updated = {
    ...creds,
    accessToken: data.access_token,
    tokenExpiry: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
  };

  _connectorEngine?.updateCredentials('canva', {
    accessToken: updated.accessToken,
    tokenExpiry: updated.tokenExpiry,
    ...(data.refresh_token ? { refreshToken: updated.refreshToken } : {}),
  });

  return updated;
}

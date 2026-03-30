import http from 'http';
import { shell } from 'electron';

/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL       = 'https://oauth2.googleapis.com/token';
const USERINFO_URL    = 'https://www.googleapis.com/oauth2/v2/userinfo';
const CALENDAR_BASE   = 'https://www.googleapis.com/calendar/v3';

const CALLBACK_PORT = 42815;
const REDIRECT_URI  = `http://localhost:${CALLBACK_PORT}/oauth/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

/* ══════════════════════════════════════════
   CONNECTOR ENGINE REF
══════════════════════════════════════════ */
let _connectorEngine = null;
export function setConnectorEngine(engine) { _connectorEngine = engine; }

/* ══════════════════════════════════════════
   OAUTH FLOW
══════════════════════════════════════════ */
export function startCalendarOAuthFlow(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    let settled = false;
    function settle(fn) { if (settled) return; settled = true; fn(); }

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
        if (url.pathname !== '/oauth/callback') return res.end();

        const code  = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2 style="font-family:sans-serif">${error ? '❌ Failed to connect Calendar' : '✅ Google Calendar connected!'}</h2><p>You can close this tab.</p>`);
        server.close();

        if (error || !code) return settle(() => reject(new Error(error || 'No auth code returned')));
        const tokens = await exchangeCode(code, clientId, clientSecret);
        settle(() => resolve(tokens));
      } catch (err) {
        server.close();
        settle(() => reject(err));
      }
    });

    server.listen(CALLBACK_PORT, 'localhost', () => {
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set('client_id',     clientId);
      authUrl.searchParams.set('redirect_uri',  REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope',         SCOPES);
      authUrl.searchParams.set('access_type',   'offline');
      authUrl.searchParams.set('prompt',        'consent');
      shell.openExternal(authUrl.toString());
    });
  });
}

async function exchangeCode(code, clientId, clientSecret) {
  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: REDIRECT_URI, grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  const profileRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${data.access_token}` } });
  const profile = await profileRes.json();
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiry:  Date.now() + (data.expires_in ?? 3600) * 1000,
    email:        profile.email,
    clientId,
    clientSecret,
  };
}

/* ══════════════════════════════════════════
   TOKEN REFRESH
══════════════════════════════════════════ */
async function getFreshCreds(creds) {
  const bufferMs = 2 * 60 * 1000;
  const isExpired = !creds.tokenExpiry || Date.now() > (creds.tokenExpiry - bufferMs);
  if (!isExpired) return creds;

  if (!creds.refreshToken) throw new Error('Calendar token expired and no refresh token. Please reconnect Calendar in Settings → Connectors.');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.clientId, client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken, grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${err.error_description ?? err.error ?? res.status}. Please reconnect Calendar.`);
  }

  const data = await res.json();
  const updated = {
    ...creds,
    accessToken: data.access_token,
    tokenExpiry: Date.now() + (data.expires_in ?? 3600) * 1000,
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
  };

  _connectorEngine?.updateCredentials('gcal', {
    accessToken: updated.accessToken,
    tokenExpiry: updated.tokenExpiry,
    ...(data.refresh_token ? { refreshToken: updated.refreshToken } : {}),
  });

  return updated;
}

/* ══════════════════════════════════════════
   INTERNAL FETCH HELPER
══════════════════════════════════════════ */
async function calFetch(creds, url, options = {}) {
  const fresh = await getFreshCreds(creds);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Calendar API error (${res.status}): ${body.error?.message ?? JSON.stringify(body)}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ══════════════════════════════════════════
   DATE HELPERS
══════════════════════════════════════════ */
function toRFC3339(dateStr) {
  // Accept ISO or "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM"
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error(`Invalid date: "${dateStr}"`);
  return d.toISOString();
}

function formatEventTime(eventTime) {
  if (!eventTime) return 'N/A';
  if (eventTime.dateTime) {
    return new Date(eventTime.dateTime).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    });
  }
  if (eventTime.date) {
    return new Date(eventTime.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    }) + ' (all day)';
  }
  return 'N/A';
}

export { formatEventTime };

/* ══════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════ */
export async function validateCredentials(creds) {
  const data = await calFetch(creds, `${CALENDAR_BASE}/calendars/primary`);
  return data.id ?? '';
}

export async function listCalendars(creds) {
  const data = await calFetch(creds, `${CALENDAR_BASE}/users/me/calendarList?maxResults=50`);
  return data.items ?? [];
}

export async function listEvents(creds, calendarId = 'primary', {
  maxResults = 20,
  timeMin,
  timeMax,
  singleEvents = true,
  orderBy = 'startTime',
  query,
} = {}) {
  const params = new URLSearchParams({
    maxResults:    String(Math.min(maxResults, 100)),
    singleEvents:  String(singleEvents),
    orderBy,
  });

  if (timeMin) params.set('timeMin', toRFC3339(timeMin));
  if (timeMax) params.set('timeMax', toRFC3339(timeMax));
  if (query)   params.set('q', query);

  // Default to upcoming events if no timeMin specified
  if (!timeMin && !timeMax) {
    params.set('timeMin', new Date().toISOString());
  }

  const data = await calFetch(creds, `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
  return data.items ?? [];
}

export async function getEvent(creds, calendarId, eventId) {
  return calFetch(creds, `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`);
}

export async function createEvent(creds, calendarId = 'primary', {
  summary,
  description = '',
  location = '',
  startDateTime,
  endDateTime,
  attendees = [],
  allDay = false,
  timeZone,
} = {}) {
  if (!summary) throw new Error('Event summary (title) is required');
  if (!startDateTime) throw new Error('Start date/time is required');

  let start, end;

  if (allDay) {
    // All-day: use date only
    const startDate = startDateTime.split('T')[0];
    const endDate = endDateTime ? endDateTime.split('T')[0] : startDate;
    start = { date: startDate };
    end   = { date: endDate };
  } else {
    const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    start = { dateTime: toRFC3339(startDateTime), timeZone: tz };
    end   = { dateTime: toRFC3339(endDateTime || startDateTime), timeZone: tz };
  }

  const body = {
    summary,
    description,
    location,
    start,
    end,
    ...(attendees.length ? { attendees: attendees.map(email => ({ email: email.trim() })) } : {}),
  };

  return calFetch(creds, `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateEvent(creds, calendarId = 'primary', eventId, updates = {}) {
  const existing = await getEvent(creds, calendarId, eventId);
  const merged = { ...existing, ...updates };
  return calFetch(creds, `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(merged),
  });
}

export async function deleteEvent(creds, calendarId = 'primary', eventId) {
  return calFetch(creds, `${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: 'DELETE',
  });
}

export async function getUpcomingEvents(creds, days = 7, maxResults = 20) {
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + days * 86_400_000).toISOString();
  return listEvents(creds, 'primary', { timeMin, timeMax, maxResults, singleEvents: true, orderBy: 'startTime' });
}

export async function getTodayEvents(creds) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  return listEvents(creds, 'primary', { timeMin: startOfDay, timeMax: endOfDay, maxResults: 50, singleEvents: true, orderBy: 'startTime' });
}

export async function searchEvents(creds, query, maxResults = 20) {
  const timeMin = new Date(Date.now() - 30 * 86_400_000).toISOString();
  return listEvents(creds, 'primary', { query, timeMin, maxResults, singleEvents: true, orderBy: 'startTime' });
}

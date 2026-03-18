import http from 'http';
import { shell } from 'electron';

/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

const CALLBACK_PORT = 42813;
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/oauth/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

/* ══════════════════════════════════════════
   OAUTH FLOW
══════════════════════════════════════════ */
export function startGmailOAuthFlow(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    let settled = false;

    function settle(fn) {
      if (settled) return;
      settled = true;
      fn();
    }

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
        if (url.pathname !== '/oauth/callback') return res.end();

        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2>${error ? '❌ Failed' : '✅ Connected'}</h2>`);

        server.close();

        if (error || !code) {
          return settle(() => reject(new Error(error || 'No code')));
        }

        const tokens = await exchangeCode(code, clientId, clientSecret);
        settle(() => resolve(tokens));
      } catch (err) {
        server.close();
        settle(() => reject(err));
      }
    });

    server.listen(CALLBACK_PORT, 'localhost', () => {
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', SCOPES);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      shell.openExternal(authUrl.toString());
    });
  });
}

async function exchangeCode(code, clientId, clientSecret) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json();

  const profileRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });

  const profile = await profileRes.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiry: Date.now() + data.expires_in * 1000,
    email: profile.email,
    clientId,
    clientSecret,
  };
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
async function gmailFetch(creds, url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Gmail API error (${res.status})`);
  }

  return res.json();
}

/* ══════════════════════════════════════════
   VALIDATE
══════════════════════════════════════════ */
export async function validateCredentials(creds) {
  const data = await gmailFetch(creds,
    'https://gmail.googleapis.com/gmail/v1/users/me/profile'
  );
  return data.emailAddress;
}

/* ══════════════════════════════════════════
   GET UNREAD EMAILS
══════════════════════════════════════════ */
export async function getUnreadEmails(creds, maxResults = 10) {
  const list = await gmailFetch(
    creds,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=${maxResults}`
  );

  const messages = list.messages || [];
  const emails = [];

  for (const msg of messages) {
    const detail = await gmailFetch(
      creds,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
    );

    const headers = detail.payload.headers;

    const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
    const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';
    
    emails.push({
      id: msg.id,
      subject,
      from,
      snippet: detail.snippet,
    });
  }

  return emails;
}

/* ══════════════════════════════════════════
   EMAIL BRIEF
══════════════════════════════════════════ */
export async function getEmailBrief(creds, maxResults = 10) {
  const emails = await getUnreadEmails(creds, maxResults);

  if (!emails.length) {
    return { count: 0, text: '' };
  }

  const text = emails.map((e, i) =>
    `${i + 1}. ${e.subject} — ${e.from}\n${e.snippet}`
  ).join('\n\n');

  return {
    count: emails.length,
    text,
  };
}

/* ══════════════════════════════════════════
   SEARCH EMAILS
══════════════════════════════════════════ */
export async function searchEmails(creds, query, maxResults = 10) {
  const list = await gmailFetch(
    creds,
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
  );

  const messages = list.messages || [];
  const emails = [];

  for (const msg of messages) {
    const detail = await gmailFetch(
      creds,
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
    );

    const headers = detail.payload.headers;

    const subject = headers.find(h => h.name === 'Subject')?.value || '(No subject)';
    const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';

    emails.push({
      id: msg.id,
      subject,
      from,
      snippet: detail.snippet,
    });
  }

  return emails;
}

/* ══════════════════════════════════════════
   SEND EMAIL
══════════════════════════════════════════ */
export async function sendEmail(creds, to, subject, body) {
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`
  ).toString('base64');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    }
  );

  if (!res.ok) {
    throw new Error('Failed to send email');
  }

  return true;
}
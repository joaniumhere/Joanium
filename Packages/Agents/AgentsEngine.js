// ─────────────────────────────────────────────
//  openworld — Packages/Agents/AgentsEngine.js
//
//  Agents are AI-powered employees that THINK and react.
//  Unlike Automations (which just execute tasks), Agents:
//    1. Collect data from connected sources
//    2. Run that data through an AI model with a job instruction
//    3. Execute an output action based on the AI's response
//
//  Each agent has: identity, primary model, fallback models, jobs (max 5)
//  Each job has: trigger, dataSource, instruction, output
// ─────────────────────────────────────────────

import fs   from 'fs';
import path from 'path';
import { shouldRunNow } from '../Automation/Scheduling.js';

/* ══════════════════════════════════════════
   AI CALLER  (main-process, non-streaming)
   Tries primary model then fallbacks in order.
══════════════════════════════════════════ */

async function callModel(providerData, modelId, systemPrompt, userMessage) {
  if (!providerData || !providerData.api?.trim()) {
    throw new Error(`No API key configured for provider "${providerData?.provider}"`);
  }
  const { provider: pid, endpoint, api, auth_header, auth_prefix = '' } = providerData;

  if (pid === 'anthropic') {
    const maxTokens = providerData.models?.[modelId]?.max_output ?? 2048;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': api,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Anthropic ${res.status}`);
    return data.content?.find(b => b.type === 'text')?.text ?? '(empty)';
  }

  if (pid === 'google') {
    const url = endpoint.replace('{model}', modelId) + `?key=${api}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message ?? `Google ${res.status}`);
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '(empty)';
  }

  // OpenAI / OpenRouter / Mistral (OpenAI-compatible)
  const maxTok = providerData.models?.[modelId]?.max_output ?? 2048;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [auth_header]: `${auth_prefix}${api}`,
      ...(pid === 'openrouter'
        ? { 'HTTP-Referer': 'https://openworld.app', 'X-Title': 'openworld' }
        : {}),
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTok,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `API ${res.status}`);
  return data.choices?.[0]?.message?.content ?? '(empty)';
}

async function callAIWithFailover(agent, systemPrompt, userMessage, allProviders) {
  // Build ordered candidate list: primary then fallbacks
  const candidates = [];

  if (agent.primaryModel?.provider && agent.primaryModel?.modelId) {
    const p = allProviders.find(x => x.provider === agent.primaryModel.provider);
    if (p) candidates.push({ provider: p, modelId: agent.primaryModel.modelId });
  }

  for (const fb of (agent.fallbackModels ?? [])) {
    if (!fb?.provider || !fb?.modelId) continue;
    const p = allProviders.find(x => x.provider === fb.provider);
    if (p && p.api?.trim()) candidates.push({ provider: p, modelId: fb.modelId });
  }

  if (!candidates.length) throw new Error('No AI model configured for this agent.');

  let lastErr;
  for (const { provider, modelId } of candidates) {
    try {
      return await callModel(provider, modelId, systemPrompt, userMessage);
    } catch (err) {
      lastErr = err;
      console.warn(`[AgentsEngine] Model ${provider.provider}/${modelId} failed: ${err.message}`);
    }
  }
  throw lastErr ?? new Error('All models failed');
}

/* ══════════════════════════════════════════
   DATA COLLECTORS
   Each returns a plain string for the AI.
══════════════════════════════════════════ */

async function collectData(dataSource, connectorEngine) {
  const type = dataSource?.type;

  switch (type) {

    case 'gmail_inbox': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) return '⚠️ Gmail not connected.';
      const { getEmailBrief } = await import('../Automation/Gmail.js');
      const brief = await getEmailBrief(creds, dataSource.maxResults ?? 20);
      if (brief.count === 0) return 'Gmail inbox: No unread emails.';
      return `Gmail Inbox — ${brief.count} unread email(s):\n\n${brief.text}`;
    }

    case 'gmail_search': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) return '⚠️ Gmail not connected.';
      if (!dataSource.query) return '⚠️ No search query specified.';
      const { searchEmails } = await import('../Automation/Gmail.js');
      const emails = await searchEmails(creds, dataSource.query, dataSource.maxResults ?? 10);
      if (!emails.length) return `Gmail search "${dataSource.query}": No results.`;
      const text = emails.map((e, i) =>
        `${i + 1}. Subject: "${e.subject}" | From: ${e.from}\n   ${e.snippet}`
      ).join('\n\n');
      return `Gmail Search "${dataSource.query}" — ${emails.length} result(s):\n\n${text}`;
    }

    case 'github_notifications': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) return '⚠️ GitHub not connected.';
      const { getNotifications } = await import('../Automation/Github.js');
      const notifs = await getNotifications(creds);
      if (!notifs?.length) return 'GitHub: No unread notifications.';
      const text = notifs.slice(0, 15).map((n, i) =>
        `${i + 1}. [${n.reason}] ${n.subject?.title} in ${n.repository?.full_name}`
      ).join('\n');
      return `GitHub Notifications — ${notifs.length} unread:\n\n${text}`;
    }

    case 'github_prs': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) return '⚠️ GitHub not connected.';
      if (!dataSource.owner || !dataSource.repo) return '⚠️ GitHub owner/repo not specified.';
      const { getPullRequests } = await import('../Automation/Github.js');
      const prs = await getPullRequests(creds, dataSource.owner, dataSource.repo, dataSource.state ?? 'open', 20);
      if (!prs.length) return `${dataSource.owner}/${dataSource.repo}: No ${dataSource.state ?? 'open'} pull requests.`;
      const text = prs.map((p, i) =>
        `${i + 1}. #${p.number}: "${p.title}" by ${p.user?.login} — ${p.state}\n   ${p.body?.slice(0, 120) ?? ''}`
      ).join('\n\n');
      return `GitHub PRs (${dataSource.owner}/${dataSource.repo}) — ${prs.length} ${dataSource.state ?? 'open'}:\n\n${text}`;
    }

    case 'github_issues': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) return '⚠️ GitHub not connected.';
      if (!dataSource.owner || !dataSource.repo) return '⚠️ GitHub owner/repo not specified.';
      const { getIssues } = await import('../Automation/Github.js');
      const issues = await getIssues(creds, dataSource.owner, dataSource.repo, dataSource.state ?? 'open', 20);
      if (!issues.length) return `${dataSource.owner}/${dataSource.repo}: No ${dataSource.state ?? 'open'} issues.`;
      const text = issues.map((iss, i) =>
        `${i + 1}. #${iss.number}: "${iss.title}" by ${iss.user?.login}\n   ${iss.body?.slice(0, 120) ?? ''}`
      ).join('\n\n');
      return `GitHub Issues (${dataSource.owner}/${dataSource.repo}) — ${issues.length} ${dataSource.state ?? 'open'}:\n\n${text}`;
    }

    case 'github_commits': {
      const creds = connectorEngine?.getCredentials('github');
      if (!creds?.token) return '⚠️ GitHub not connected.';
      if (!dataSource.owner || !dataSource.repo) return '⚠️ GitHub owner/repo not specified.';
      const { getCommits } = await import('../Automation/Github.js');
      const commits = await getCommits(creds, dataSource.owner, dataSource.repo, dataSource.maxResults ?? 10);
      if (!commits.length) return `${dataSource.owner}/${dataSource.repo}: No commits found.`;
      const text = commits.map((c, i) =>
        `${i + 1}. ${c.commit.message.split('\n')[0]} — by ${c.commit.author?.name} (${c.commit.author?.date?.slice(0, 10)})`
      ).join('\n');
      return `GitHub Commits (${dataSource.owner}/${dataSource.repo}) — ${commits.length} recent:\n\n${text}`;
    }

    case 'hacker_news': {
      const count = dataSource.count ?? 10;
      const hnType = dataSource.hnType ?? 'top';
      const typeMap = { top: 'topstories', new: 'newstories', best: 'beststories', ask: 'askstories' };
      const endpoint = typeMap[hnType] ?? 'topstories';
      const ids = await fetch(`https://hacker-news.firebaseio.com/v0/${endpoint}.json`).then(r => r.json());
      const topIds = ids.slice(0, count);
      const stories = await Promise.all(
        topIds.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            .then(r => r.json()).catch(() => null)
        )
      );
      const text = stories.filter(Boolean).map((s, i) =>
        `${i + 1}. ${s.title} (${s.score} pts, ${s.descendants ?? 0} comments)\n   ${s.url ?? `https://news.ycombinator.com/item?id=${s.id}`}`
      ).join('\n\n');
      return `Hacker News ${hnType} stories (${count}):\n\n${text}`;
    }

    case 'weather': {
      if (!dataSource.location) return '⚠️ No location specified for weather.';
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dataSource.location)}&count=1&format=json`
      ).then(r => r.json());
      if (!geoRes.results?.length) return `⚠️ Location "${dataSource.location}" not found.`;
      const { latitude, longitude, name, country, timezone } = geoRes.results[0];
      const units = dataSource.units ?? 'celsius';
      const deg = units === 'fahrenheit' ? '°F' : '°C';
      const weather = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,precipitation` +
        `&temperature_unit=${units}&wind_speed_unit=kmh&timezone=${encodeURIComponent(timezone ?? 'auto')}&forecast_days=1`
      ).then(r => r.json());
      const c = weather.current;
      return `Weather in ${name}, ${country}:\nTemperature: ${c.temperature_2m}${deg} (feels like ${c.apparent_temperature}${deg})\nHumidity: ${c.relative_humidity_2m}%\nWind: ${c.wind_speed_10m} km/h\nPrecipitation: ${c.precipitation}mm`;
    }

    case 'crypto_price': {
      const coinsRaw = dataSource.coins ?? 'bitcoin,ethereum';
      const coins = coinsRaw.split(',').map(c => c.trim().toLowerCase()).join(',');
      const currency = (dataSource.currency ?? 'usd').toLowerCase();
      const data = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=${currency}&include_24hr_change=true`
      ).then(r => r.json());
      const lines = Object.entries(data).map(([coin, info]) => {
        const change = info[`${currency}_24h_change`]?.toFixed(2) ?? 'N/A';
        return `${coin}: ${info[currency]} ${currency.toUpperCase()} (${change}% 24h)`;
      });
      return `Crypto Prices:\n${lines.join('\n')}`;
    }

    case 'fetch_url': {
      if (!dataSource.url) return '⚠️ No URL specified.';
      try {
        const res = await fetch(dataSource.url, { headers: { 'User-Agent': 'openworld-agent/1.0' } });
        const html = await res.text();
        // Strip HTML tags for cleaner AI input
        const text = html.replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim()
          .slice(0, 6000);
        return `Content from ${dataSource.url}:\n\n${text}`;
      } catch (err) {
        return `⚠️ Failed to fetch ${dataSource.url}: ${err.message}`;
      }
    }

    case 'custom_context': {
      return dataSource.context?.trim() || '(no context provided)';
    }

    default:
      return `⚠️ Unknown data source type: "${type}"`;
  }
}

/* ══════════════════════════════════════════
   OUTPUT EXECUTORS
   Takes AI response + output config, performs action
══════════════════════════════════════════ */

async function executeOutput(output, aiResponse, agent, job, connectorEngine) {
  const type = output?.type;
  const now  = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  switch (type) {

    case 'send_email': {
      const creds = connectorEngine?.getCredentials('gmail');
      if (!creds?.accessToken) throw new Error('Gmail not connected — cannot send email.');
      const { sendEmail } = await import('../Automation/Gmail.js');
      const subject = output.subject?.trim()
        ? output.subject.replace('{{date}}', dateStr).replace('{{agent}}', agent.name).replace('{{job}}', job.name ?? '')
        : `[${agent.name}] ${job.name ?? 'Report'} — ${dateStr}`;
      await sendEmail(creds, output.to, subject, aiResponse, output.cc ?? '', output.bcc ?? '');
      console.log(`[AgentsEngine] send_email → ${output.to}`);
      break;
    }

    case 'send_notification': {
      const { sendNotification } = await import('../Automation/Notification.js');
      const title = output.title?.trim() || `${agent.name}: ${job.name ?? 'Report'}`;
      // Truncate for notification body
      const body = aiResponse.slice(0, 200) + (aiResponse.length > 200 ? '…' : '');
      sendNotification(title, body, output.clickUrl ?? '');
      break;
    }

    case 'write_file': {
      if (!output.filePath) throw new Error('write_file: no file path specified.');
      const dir = path.dirname(output.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const timestamp = now.toISOString();
      const entry = `\n\n--- ${agent.name} / ${job.name ?? 'Job'} — ${timestamp} ---\n${aiResponse}\n`;
      if (output.append) {
        fs.appendFileSync(output.filePath, entry, 'utf-8');
      } else {
        fs.writeFileSync(output.filePath, aiResponse, 'utf-8');
      }
      console.log(`[AgentsEngine] write_file → ${output.filePath}`);
      break;
    }

    case 'http_webhook': {
      if (!output.url) throw new Error('http_webhook: no URL specified.');
      const method = (output.method ?? 'POST').toUpperCase();
      const body = JSON.stringify({
        agent: agent.name,
        job: job.name ?? '',
        timestamp: now.toISOString(),
        result: aiResponse,
      });
      const res = await fetch(output.url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: ['GET', 'HEAD'].includes(method) ? undefined : body,
      });
      console.log(`[AgentsEngine] http_webhook → ${method} ${output.url} ${res.status}`);
      break;
    }

    default:
      console.warn(`[AgentsEngine] Unknown output type: "${type}"`);
  }
}

/* ══════════════════════════════════════════
   AGENTS ENGINE CLASS
══════════════════════════════════════════ */

export class AgentsEngine {
  constructor(agentsFilePath, connectorEngine = null) {
    this.filePath        = agentsFilePath;
    this.connectorEngine = connectorEngine;
    this.agents          = [];
    this._ticker         = null;
  }

  start() {
    this._load();
    this._runStartupJobs();
    this._ticker = setInterval(() => this._checkScheduled(), 60_000);
    console.log('[AgentsEngine] Started —', this.agents.length, 'agent(s)');
  }

  stop() {
    if (this._ticker) { clearInterval(this._ticker); this._ticker = null; }
    console.log('[AgentsEngine] Stopped');
  }

  reload() {
    this._load();
    console.log('[AgentsEngine] Reloaded —', this.agents.length, 'agent(s)');
  }

  getAll() {
    this._load();
    return this.agents;
  }

  saveAgent(agent) {
    this._load();
    const idx = this.agents.findIndex(a => a.id === agent.id);
    if (idx >= 0) this.agents[idx] = { ...this.agents[idx], ...agent };
    else          this.agents.push(agent);
    this._persist();
    return agent;
  }

  deleteAgent(id) {
    this._load();
    this.agents = this.agents.filter(a => a.id !== id);
    this._persist();
  }

  toggleAgent(id, enabled) {
    this._load();
    const a = this.agents.find(a => a.id === id);
    if (a) { a.enabled = Boolean(enabled); this._persist(); }
  }

  async runNow(agentId) {
    this._load();
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) throw new Error(`Agent "${agentId}" not found`);
    await this._executeAgent(agent);
    return { ok: true };
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw  = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        this.agents = Array.isArray(data.agents) ? data.agents : [];
      } else {
        this.agents = [];
      }
    } catch (err) {
      console.error('[AgentsEngine] _load error:', err);
      this.agents = [];
    }
  }

  _persist() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ agents: this.agents }, null, 2),
        'utf-8',
      );
    } catch (err) {
      console.error('[AgentsEngine] _persist error:', err);
    }
  }

  _runStartupJobs() {
    for (const agent of this.agents) {
      if (!agent.enabled) continue;
      for (const job of (agent.jobs ?? [])) {
        if (job.enabled !== false && job.trigger?.type === 'on_startup') {
          this._executeJob(agent, job);
        }
      }
    }
  }

  _checkScheduled() {
    const now = new Date();
    for (const agent of this.agents) {
      if (!agent.enabled) continue;
      for (const job of (agent.jobs ?? [])) {
        if (job.enabled === false) continue;
        // Adapt job to the shape shouldRunNow() expects
        const mockAutomation = {
          trigger: job.trigger,
          lastRun: job.lastRun ?? null,
        };
        if (shouldRunNow(mockAutomation, now)) {
          this._executeJob(agent, job);
        }
      }
    }
  }

  async _executeAgent(agent) {
    for (const job of (agent.jobs ?? [])) {
      if (job.enabled !== false) {
        await this._executeJob(agent, job);
      }
    }
  }

  async _executeJob(agent, job) {
    console.log(`[AgentsEngine] Running job "${job.name ?? job.id}" for agent "${agent.name}"`);
    try {
      // 1 — Collect data
      const dataText = await collectData(job.dataSource ?? {}, this.connectorEngine);

      // 2 — Load providers (fresh read each time so keys stay current)
      const { readModelsWithKeys } = await import('../Main/Services/UserService.js');
      const allProviders = readModelsWithKeys();

      // 3 — Build prompts
      const systemPrompt = [
        `You are ${agent.name}, a proactive AI agent.`,
        agent.description ? agent.description : '',
        'Your job is to analyze the provided data and produce a useful, actionable response.',
        'Be concise, clear, and focus only on what matters.',
      ].filter(Boolean).join(' ');

      const userMessage = [
        '=== DATA ===',
        dataText,
        '',
        '=== YOUR TASK ===',
        job.instruction ?? 'Analyze the above data and provide a helpful summary.',
      ].join('\n');

      // 4 — Call AI with failover
      const aiResponse = await callAIWithFailover(agent, systemPrompt, userMessage, allProviders);

      // 5 — Execute output
      await executeOutput(job.output ?? {}, aiResponse, agent, job, this.connectorEngine);

      // 6 — Update lastRun on the job
      job.lastRun = new Date().toISOString();
      this._persist();

      console.log(`[AgentsEngine] Job "${job.name ?? job.id}" completed ✓`);
    } catch (err) {
      console.error(`[AgentsEngine] Job "${job.name ?? job.id}" failed:`, err.message);
    }
  }
}

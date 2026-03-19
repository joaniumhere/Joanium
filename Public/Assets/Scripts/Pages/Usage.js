// Window controls
import '../Shared/WindowControls.js';

// Modals / shared
import { initSidebar }       from '../Shared/Sidebar.js';
import { initAboutModal }    from '../Shared/Modals/AboutModal.js';
import { initLibraryModal }  from '../Shared/Modals/LibraryModal.js';
import { initSettingsModal } from '../Shared/Modals/SettingsModal.js';

const about    = initAboutModal();
const settings = initSettingsModal();

const library = initLibraryModal({
  onChatSelect: (chatId) => {
    if (chatId) localStorage.setItem('ow-pending-chat', chatId);
    window.electronAPI?.launchMain();
  },
});

const sidebar = initSidebar({
  activePage:    'usage',
  onNewChat:     () => window.electronAPI?.launchMain(),
  onLibrary:     () => library.isOpen() ? library.close() : library.open(),
  onAutomations: () => window.electronAPI?.launchAutomations?.(),
  onSkills:      () => window.electronAPI?.launchSkills?.(),
  onPersonas:    () => window.electronAPI?.launchPersonas?.(),
  onUsage:       () => { /* already here */ },
  onSettings:    () => settings.open(),
  onAbout:       () => about.open(),
});

window.addEventListener('ow:user-profile-updated', e => sidebar.setUser(e.detail?.name ?? ''));
settings.loadUser().then(user => sidebar.setUser(user?.name ?? ''));

// ─────────────────────────────────────────────
//  PRICING  (USD per 1M tokens — mirrors Models.json)
// ─────────────────────────────────────────────

const PRICING = {
  // Anthropic
  'claude-opus-4-6':   { in: 15,   out: 75   },
  'claude-opus-4-5':   { in: 15,   out: 75   },
  'claude-sonnet-4-6': { in: 3,    out: 15   },
  'claude-sonnet-4-5': { in: 3,    out: 15   },
  'claude-haiku-4-5':  { in: 0.25, out: 1.25 },
  // OpenAI
  'gpt-4o':            { in: 2.5,  out: 10   },
  'gpt-4o-mini':       { in: 0.15, out: 0.6  },
  'gpt-4-turbo':       { in: 10,   out: 30   },
  'o1':                { in: 15,   out: 60   },
  'o3-mini':           { in: 1.1,  out: 4.4  },
  // Google
  'gemini-2.0-flash':      { in: 0.1,  out: 0.4  },
  'gemini-2.0-flash-lite': { in: 0.075,out: 0.3  },
  'gemini-1.5-pro':        { in: 1.25, out: 5    },
  'gemini-1.5-flash':      { in: 0.075,out: 0.3  },
  // OpenRouter / Mistral (rough estimates)
  'meta-llama/llama-3.3-70b-instruct': { in: 0.2,  out: 0.2  },
  'deepseek/deepseek-r1':              { in: 0.55, out: 2.19 },
  'mistralai/mistral-large':           { in: 2,    out: 6    },
  'google/gemma-3-27b-it':             { in: 0.1,  out: 0.2  },
  'qwen/qwen-2.5-72b-instruct':        { in: 0.35, out: 0.4  },
  'mistral-large-latest':              { in: 2,    out: 6    },
  'mistral-small-latest':              { in: 0.2,  out: 0.6  },
  'codestral-latest':                  { in: 0.2,  out: 0.6  },
};

function tokenCost(model, inputTokens, outputTokens) {
  const p = PRICING[model] ?? { in: 1, out: 3 };
  return (inputTokens / 1_000_000) * p.in + (outputTokens / 1_000_000) * p.out;
}

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────

let _records   = [];
let _range     = 'today';
let _pollTimer = null;

// ─────────────────────────────────────────────
//  RANGE FILTER
// ─────────────────────────────────────────────

function sinceDate(range) {
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === '7')  { const d = new Date(now); d.setDate(d.getDate() - 6);  d.setHours(0,0,0,0); return d; }
  if (range === '30') { const d = new Date(now); d.setDate(d.getDate() - 29); d.setHours(0,0,0,0); return d; }
  return null;
}

function filteredRecords() {
  const since = sinceDate(_range);
  if (!since) return _records;
  return _records.filter(r => new Date(r.timestamp) >= since);
}

// ─────────────────────────────────────────────
//  COMPUTE STATS
// ─────────────────────────────────────────────

function computeStats(records) {
  let totalInput = 0, totalOutput = 0, totalCost = 0;
  const byModel = {}, byProvider = {}, byDay = {};

  for (const r of records) {
    const inp  = r.inputTokens  ?? 0;
    const out  = r.outputTokens ?? 0;
    const cost = tokenCost(r.model, inp, out);
    totalInput  += inp;
    totalOutput += out;
    totalCost   += cost;

    if (!byModel[r.model])
      byModel[r.model] = { name: r.modelName ?? r.model, input: 0, output: 0, calls: 0, cost: 0 };
    byModel[r.model].input  += inp;
    byModel[r.model].output += out;
    byModel[r.model].calls  += 1;
    byModel[r.model].cost   += cost;

    const prov = r.provider ?? 'unknown';
    if (!byProvider[prov])
      byProvider[prov] = { input: 0, output: 0, calls: 0, cost: 0 };
    byProvider[prov].input  += inp;
    byProvider[prov].output += out;
    byProvider[prov].calls  += 1;
    byProvider[prov].cost   += cost;

    const day = r.timestamp.slice(0, 10);
    if (!byDay[day])
      byDay[day] = { input: 0, output: 0, calls: 0, cost: 0 };
    byDay[day].input  += inp;
    byDay[day].output += out;
    byDay[day].calls  += 1;
    byDay[day].cost   += cost;
  }

  return { totalInput, totalOutput, totalCost, count: records.length, byModel, byProvider, byDay };
}

// ─────────────────────────────────────────────
//  FORMATTERS
// ─────────────────────────────────────────────

function fmtTokens(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtCost(usd) {
  if (usd === 0) return '$0.00';
  if (usd < 0.001) return '<$0.001';
  if (usd < 1) return '$' + usd.toFixed(4);
  return '$' + usd.toFixed(3);
}

function fmtTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000)     return 'just now';
  if (diff < 3_600_000)  return Math.floor(diff/60_000) + 'm ago';
  if (diff < 86_400_000) return Math.floor(diff/3_600_000) + 'h ago';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function providerLabel(id) {
  const m = { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google', openrouter: 'OpenRouter', mistral: 'Mistral AI' };
  return m[id] ?? id;
}

// ─────────────────────────────────────────────
//  CHART
// ─────────────────────────────────────────────

function buildDayList(range) {
  const days = range === 'today' ? 1 : range === '7' ? 7 : range === '30' ? 30 : 14;
  const list = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    list.push(d.toISOString().slice(0, 10));
  }
  return list;
}

function renderChart(byDay, range) {
  const wrap    = document.getElementById('chart-wrap');
  const titleEl = document.getElementById('chart-title');
  const metaEl  = document.getElementById('chart-meta');

  const days = buildDayList(range === 'all' ? '30' : range);
  const W = 680, H = 140, PL = 44, PR = 12, PT = 10, PB = 36;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const values = days.map(d => (byDay[d]?.input ?? 0) + (byDay[d]?.output ?? 0));
  const maxVal = Math.max(...values, 1);
  const barW   = Math.max(4, Math.floor(cW / days.length) - 3);
  const barGap = (cW - barW * days.length) / Math.max(days.length - 1, 1);

  let barsHTML = '', labelsHTML = '';
  const totalShown = values.reduce((a,b) => a + b, 0);
  if (metaEl)  metaEl.textContent  = fmtTokens(totalShown) + ' total';
  if (titleEl) titleEl.textContent = range === 'all' ? 'Last 30 days (tokens)' :
    range === 'today' ? 'Today (tokens)' : `Last ${range} days (tokens)`;

  days.forEach((date, i) => {
    const val  = values[i];
    const barH = val > 0 ? Math.max(3, (val / maxVal) * cH) : 2;
    const x    = PL + i * (barW + barGap);
    const inp  = byDay[date]?.input  ?? 0;
    const out  = byDay[date]?.output ?? 0;
    const inH  = inp > 0 ? Math.max(1, (inp  / maxVal) * cH) : 0;
    const outH = out > 0 ? Math.max(1, (out  / maxVal) * cH) : 0;

    barsHTML += `
      <rect class="chart-bar" x="${x}" y="${PT + cH - inH}" width="${barW}" height="${inH}" rx="2"
        fill="var(--accent)" opacity="0.55">
        <title>${date}: ${fmtTokens(inp)} input, ${fmtTokens(out)} output</title>
      </rect>
      <rect class="chart-bar" x="${x}" y="${PT + cH - inH - outH}" width="${barW}" height="${outH}" rx="2"
        fill="var(--accent)" opacity="0.9">
        <title>${date}: ${fmtTokens(out)} output</title>
      </rect>`;

    const step = days.length <= 7 ? 1 : days.length <= 14 ? 2 : 5;
    if (i % step === 0 || i === days.length - 1) {
      const label = days.length === 1 ? 'Today' : date.slice(5);
      labelsHTML += `<text x="${x + barW/2}" y="${H - 8}" text-anchor="middle"
        font-size="9" fill="var(--text-muted)" font-family="var(--font-ui)">${label}</text>`;
    }
  });

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  let yLabels = '';
  yTicks.forEach(t => {
    const yPos = PT + cH - t * cH;
    yLabels += `
      <text x="${PL - 4}" y="${yPos + 3}" text-anchor="end" font-size="8"
        fill="var(--text-muted)" font-family="var(--font-mono)">${fmtTokens(Math.round(maxVal * t))}</text>
      <line x1="${PL}" y1="${yPos}" x2="${W - PR}" y2="${yPos}"
        stroke="var(--border-subtle)" stroke-width="0.5" stroke-dasharray="3,3"/>`;
  });

  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="usage-chart-svg">
    ${yLabels}
    ${barsHTML}
    ${labelsHTML}
    <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + cH}" stroke="var(--border)" stroke-width="0.8"/>
    <line x1="${PL}" y1="${PT + cH}" x2="${W - PR}" y2="${PT + cH}" stroke="var(--border)" stroke-width="0.8"/>
  </svg>`;
}

// ─────────────────────────────────────────────
//  RENDER HELPERS
// ─────────────────────────────────────────────

function renderSummary(stats, records) {
  const grid = document.getElementById('summary-grid');
  if (!grid) return;

  const avgPerMsg    = stats.count > 0 ? Math.round((stats.totalInput + stats.totalOutput) / stats.count) : 0;
  const uniqueModels = new Set(records.map(r => r.model)).size;

  const cards = [
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke-linecap="round"/></svg>`,
      label: 'Total tokens',
      value: fmtTokens(stats.totalInput + stats.totalOutput),
      sub:   `${fmtTokens(stats.totalInput)} in · ${fmtTokens(stats.totalOutput)} out`,
      cls:   '',
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      label: 'API calls',
      value: stats.count.toLocaleString(),
      sub:   `avg ${fmtTokens(avgPerMsg)} tokens each`,
      cls:   '',
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="1" x2="12" y2="23" stroke-linecap="round"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke-linecap="round"/></svg>`,
      label: 'Est. cost',
      value: fmtCost(stats.totalCost),
      sub:   'based on published pricing',
      cls:   'cost-card',
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h16v4H4zM4 12h16v4H4z" stroke-linejoin="round"/></svg>`,
      label: 'Input tokens',
      value: fmtTokens(stats.totalInput),
      sub:   `${stats.totalInput > 0 ? Math.round(stats.totalInput / (stats.totalInput + stats.totalOutput + 0.001) * 100) : 0}% of total`,
      cls:   '',
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      label: 'Output tokens',
      value: fmtTokens(stats.totalOutput),
      sub:   `${stats.totalOutput > 0 ? Math.round(stats.totalOutput / (stats.totalInput + stats.totalOutput + 0.001) * 100) : 0}% of total`,
      cls:   '',
    },
    {
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
      label: 'Models used',
      value: uniqueModels.toString(),
      sub:   `across ${Object.keys(stats.byProvider).length} provider${Object.keys(stats.byProvider).length !== 1 ? 's' : ''}`,
      cls:   '',
    },
  ];

  grid.innerHTML = cards.map((c, i) => `
    <div class="usage-card ${c.cls}" style="animation-delay:${i * 0.05}s">
      <div class="usage-card-icon">${c.icon}</div>
      <div class="usage-card-label">${c.label}</div>
      <div class="usage-card-value">${c.value}</div>
      <div class="usage-card-sub">${c.sub}</div>
    </div>
  `).join('');
}

function renderModelRows(byModel) {
  const el   = document.getElementById('model-rows');
  const meta = document.getElementById('model-meta');
  if (!el) return;

  const sorted = Object.entries(byModel).sort(([,a],[,b]) => (b.input + b.output) - (a.input + a.output));
  if (meta) meta.textContent = `${sorted.length} model${sorted.length !== 1 ? 's' : ''}`;

  if (!sorted.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:8px 0">No model data yet</div>';
    return;
  }

  const maxTok = Math.max(...sorted.map(([,v]) => v.input + v.output), 1);
  el.innerHTML = sorted.map(([modelId, v]) => {
    const total = v.input + v.output;
    const pct   = Math.round((total / maxTok) * 100);
    return `
      <div class="model-row">
        <div class="model-row-header">
          <span class="model-row-name" title="${modelId}">${v.name}</span>
          <div class="model-row-stats">
            <span class="model-row-tokens">${fmtTokens(total)} tokens · ${v.calls} call${v.calls !== 1 ? 's' : ''}</span>
            <span class="model-row-cost">${fmtCost(v.cost)}</span>
          </div>
        </div>
        <div class="model-bar-track">
          <div class="model-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

function renderProviders(byProvider) {
  const el = document.getElementById('provider-grid');
  if (!el) return;

  const sorted = Object.entries(byProvider).sort(([,a],[,b]) => (b.input + b.output) - (a.input + a.output));

  if (!sorted.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;grid-column:1/-1">No provider data yet</div>';
    return;
  }

  el.innerHTML = sorted.map(([id, v]) => `
    <div class="provider-card">
      <div class="provider-name">${providerLabel(id)}</div>
      <div class="provider-tokens">${fmtTokens(v.input + v.output)} tokens</div>
      <div class="provider-cost">${fmtCost(v.cost)}</div>
      <div class="provider-calls">${v.calls} call${v.calls !== 1 ? 's' : ''}</div>
    </div>
  `).join('');
}

function renderActivity(records) {
  const el   = document.getElementById('activity-list');
  const meta = document.getElementById('activity-meta');
  if (!el) return;

  const recent = [...records].reverse().slice(0, 50);
  if (meta) meta.textContent = `last ${Math.min(records.length, 50)} calls`;

  if (!recent.length) {
    el.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:18px;text-align:center">No activity yet — start chatting!</div>';
    return;
  }

  el.innerHTML = recent.map(r => {
    const total = (r.inputTokens ?? 0) + (r.outputTokens ?? 0);
    const cost  = tokenCost(r.model, r.inputTokens ?? 0, r.outputTokens ?? 0);
    return `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <span class="activity-model">${r.modelName ?? r.model}</span>
        <span class="activity-tokens">${fmtTokens(total)}</span>
        <span class="activity-cost">${fmtCost(cost)}</span>
        <span class="activity-time">${fmtTime(r.timestamp)}</span>
      </div>`;
  }).join('');
}

// ─────────────────────────────────────────────
//  EMPTY STATE
// ─────────────────────────────────────────────

function showEmpty() {
  const summaryGrid = document.getElementById('summary-grid');
  if (summaryGrid) summaryGrid.innerHTML = `
    <div class="usage-empty" style="grid-column:1/-1">
      <div class="usage-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:24px;height:24px">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>No usage data yet</h3>
      <p>Start chatting and your token usage will appear here in real time.</p>
    </div>`;
  ['chart-section','provider-section','model-section','activity-section'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function showSections() {
  ['chart-section','provider-section','model-section','activity-section'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
}

// ─────────────────────────────────────────────
//  MAIN RENDER
// ─────────────────────────────────────────────

function render() {
  const records = filteredRecords();
  const stats   = computeStats(records);
  if (!_records.length) { showEmpty(); return; }
  showSections();
  renderSummary(stats, records);
  renderChart(stats.byDay, _range);
  renderModelRows(stats.byModel);
  renderProviders(stats.byProvider);
  renderActivity(records);
}

// ─────────────────────────────────────────────
//  LOAD + POLL
// ─────────────────────────────────────────────

async function load() {
  try {
    const res = await window.electronAPI?.getUsage?.();
    if (res?.ok) _records = res.records ?? [];
  } catch (err) {
    console.error('[Usage] load error:', err);
  }
  render();
}

function startPolling() {
  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = setInterval(load, 5000);
}

// ─────────────────────────────────────────────
//  RANGE BUTTONS
// ─────────────────────────────────────────────

document.querySelectorAll('.usage-range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.usage-range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _range = btn.dataset.range;
    render();
  });
});

// ─────────────────────────────────────────────
//  REFRESH BUTTON
// ─────────────────────────────────────────────

document.getElementById('refresh-btn')?.addEventListener('click', async () => {
  const btn = document.getElementById('refresh-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Refreshing…'; }
  await load();
  if (btn) { btn.disabled = false; btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M23 4v6h-6" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 20v-6h6" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke-linecap="round" stroke-linejoin="round"/></svg> Refresh`; }
});

// ─────────────────────────────────────────────
//  CLEAR DATA
// ─────────────────────────────────────────────

const overlay       = document.getElementById('confirm-overlay');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmDelete = document.getElementById('confirm-delete');
const clearBtn      = document.getElementById('clear-usage-btn');

clearBtn?.addEventListener('click', () => overlay?.classList.add('open'));
confirmCancel?.addEventListener('click', () => overlay?.classList.remove('open'));
overlay?.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

confirmDelete?.addEventListener('click', async () => {
  overlay?.classList.remove('open');
  await window.electronAPI?.clearUsage?.();
  _records = [];
  render();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') overlay?.classList.remove('open');
});

// ─────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────

load().then(startPolling);

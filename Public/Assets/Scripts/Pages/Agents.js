// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/Pages/Agents.js
//  Agents page: grid rendering, add/edit modal,
//  model picker, job builder (max 5 jobs per agent)
// ─────────────────────────────────────────────

import '../Shared/WindowControls.js';
import { initSidebar }       from '../Shared/Sidebar.js';
import { initAboutModal }    from '../Shared/Modals/AboutModal.js';
import { initLibraryModal }  from '../Shared/Modals/LibraryModal.js';
import { initSettingsModal } from '../Shared/Modals/SettingsModal.js';

/* ── Shared modals ── */
const about    = initAboutModal();
const settings = initSettingsModal();

const library = initLibraryModal({
  onChatSelect: chatId => {
    if (chatId) localStorage.setItem('ow-pending-chat', chatId);
    window.electronAPI?.launchMain();
  },
});

const sidebar = initSidebar({
  activePage:    'agents',
  onNewChat:     () => window.electronAPI?.launchMain(),
  onLibrary:     () => library.isOpen() ? library.close() : library.open(),
  onAutomations: () => window.electronAPI?.launchAutomations?.(),
  onSkills:      () => window.electronAPI?.launchSkills?.(),
  onPersonas:    () => window.electronAPI?.launchPersonas?.(),
  onAgents:      () => { /* already here */ },
  onUsage:       () => window.electronAPI?.launchUsage?.(),
  onSettings:    () => settings.open(),
  onAbout:       () => about.open(),
});

window.addEventListener('ow:user-profile-updated', e => sidebar.setUser(e.detail?.name ?? ''));
settings.loadUser().then(user => sidebar.setUser(user?.name ?? ''));

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const MAX_JOBS = 5;

const DATA_SOURCE_TYPES = [
  { value: 'gmail_inbox',          label: '📧 Gmail — Unread inbox',            group: 'Email'   },
  { value: 'gmail_search',         label: '📧 Gmail — Search emails',            group: 'Email'   },
  { value: 'github_notifications', label: '🐙 GitHub — Notifications',           group: 'GitHub'  },
  { value: 'github_prs',           label: '🐙 GitHub — Pull requests',           group: 'GitHub'  },
  { value: 'github_issues',        label: '🐙 GitHub — Issues',                  group: 'GitHub'  },
  { value: 'github_commits',       label: '🐙 GitHub — Recent commits',          group: 'GitHub'  },
  { value: 'hacker_news',          label: '🔶 Hacker News — Top stories',        group: 'Web'     },
  { value: 'weather',              label: '🌤️ Weather — Current conditions',      group: 'Web'     },
  { value: 'crypto_price',         label: '🪙 Crypto — Live prices',             group: 'Web'     },
  { value: 'fetch_url',            label: '🌐 Fetch URL — Any web page',         group: 'Web'     },
  { value: 'custom_context',       label: '✍️ Custom — Provide context directly', group: 'Other'  },
];

const OUTPUT_TYPES = [
  { value: 'send_email',       label: '📧 Send email via Gmail',    group: 'Messaging'  },
  { value: 'send_notification',label: '🔔 Desktop notification',    group: 'Messaging'  },
  { value: 'write_file',       label: '📝 Write to a file',         group: 'Files'      },
  { value: 'http_webhook',     label: '🌐 HTTP webhook / POST',     group: 'Webhooks'   },
];

const INSTRUCTION_TEMPLATES = {
  gmail_inbox:          'Read these emails carefully. Identify the 3 most important ones requiring action today. For each, write: subject, sender, what action is needed, and by when. Then list FYI emails briefly.',
  gmail_search:         'Analyze these matching emails. Summarize what you found, highlight any patterns, urgent items, or key information the user should know.',
  github_notifications: 'Review these GitHub notifications. Group them by type (PR reviews needed, mentions, issue updates). List what requires immediate attention first.',
  github_prs:           'Analyze these pull requests. For each open PR, summarize: what it does, if it looks ready to merge, any concerns, and who needs to act.',
  github_issues:        'Review these issues. Categorize them by priority (critical/high/medium/low). Identify which ones are blocked, need clarification, or can be closed.',
  github_commits:       'Analyze these recent commits. Summarize what changed, identify any risky or large changes, and note if there are patterns worth the team\'s attention.',
  hacker_news:          'Summarize the most relevant and interesting stories from Hacker News today. Focus on AI, engineering, and startup news. Provide a brief insight for each.',
  weather:              'Based on today\'s weather conditions, provide a practical briefing: what to wear, any weather warnings, and how it might affect outdoor plans.',
  crypto_price:         'Analyze these crypto prices and their 24h changes. Identify significant moves (>5%), any notable trends, and provide a brief market sentiment summary.',
  fetch_url:            'Read and analyze this content. Extract the key information, main points, and anything actionable or noteworthy. Summarize clearly and concisely.',
  custom_context:       'Analyze the provided information and give a thoughtful, useful response.',
};

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
let _agents      = [];
let _allModels   = [];  // flat list of { provider, providerId, modelId, modelName }
let _editingId   = null;
let _deletingId  = null;
let _primaryModel = null;   // { providerId, modelId }
let _fallbackModels = [];   // [{ providerId, modelId }]
let _jobs = [];

/* ══════════════════════════════════════════
   UTILS
══════════════════════════════════════════ */
function escapeHtml(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function generateId() {
  return `agent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatTrigger(trigger) {
  if (!trigger) return '?';
  switch (trigger.type) {
    case 'on_startup': return '⚡ Startup';
    case 'interval':   return `⏱ Every ${trigger.minutes}m`;
    case 'hourly':     return '⏰ Hourly';
    case 'daily':      return `🌅 Daily ${trigger.time ?? ''}`;
    case 'weekly':     return `📅 ${capitalize(trigger.day ?? '')} ${trigger.time ?? ''}`;
    default:           return trigger.type;
  }
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function formatLastRun(iso) {
  if (!iso) return '';
  const d    = new Date(iso);
  const diff = Date.now() - d;
  const min  = 60_000;
  const hr   = 3_600_000;
  if (diff < min) return 'just now';
  if (diff < hr)  return Math.floor(diff / min) + 'm ago';
  if (diff < 86_400_000) return Math.floor(diff / hr) + 'h ago';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function modelDisplayName(providerId, modelId) {
  const entry = _allModels.find(m => m.providerId === providerId && m.modelId === modelId);
  return entry ? `${entry.modelName} (${entry.provider})` : `${modelId} (${providerId})`;
}

/* ══════════════════════════════════════════
   LOAD MODELS
══════════════════════════════════════════ */
async function loadModels() {
  try {
    const providers = await window.electronAPI?.getModels?.() ?? [];
    _allModels = [];
    for (const p of providers) {
      if (!p.api?.trim()) continue; // skip providers without a key
      for (const [modelId, info] of Object.entries(p.models ?? {})) {
        _allModels.push({
          providerId:  p.provider,
          provider:    p.label ?? p.provider,
          modelId,
          modelName:   info.name ?? modelId,
          description: info.description ?? '',
          rank:        info.rank ?? 999,
        });
      }
    }
    // sort by rank
    _allModels.sort((a, b) => a.rank - b.rank);
  } catch (err) {
    console.warn('[Agents] Could not load models:', err);
    _allModels = [];
  }
}

/* ══════════════════════════════════════════
   GRID RENDERING
══════════════════════════════════════════ */
const gridEl  = document.getElementById('agents-grid');
const emptyEl = document.getElementById('agents-empty');

function renderGrid() {
  if (!_agents.length) {
    emptyEl.hidden = false;
    gridEl.hidden  = true;
    return;
  }
  emptyEl.hidden = true;
  gridEl.hidden  = false;
  gridEl.innerHTML = '';

  _agents.forEach(agent => {
    const card = document.createElement('div');
    card.className = `agent-card${agent.enabled ? '' : ' is-disabled'}`;
    card.dataset.id = agent.id;

    const jobCount = (agent.jobs ?? []).length;
    const primaryLabel = agent.primaryModel
      ? modelDisplayName(agent.primaryModel.provider, agent.primaryModel.modelId)
      : 'No model set';

    // Last run = most recent job lastRun
    const lastRuns = (agent.jobs ?? []).map(j => j.lastRun).filter(Boolean).sort().reverse();
    const lastRun  = lastRuns[0] ? `Last run ${formatLastRun(lastRuns[0])}` : '';

    // Jobs summary lines (up to 3)
    const jobRows = (agent.jobs ?? []).slice(0, 3).map(job => `
      <div class="agent-job-row">
        <div class="agent-job-dot"></div>
        <span class="agent-job-trigger">${formatTrigger(job.trigger)}</span>
        <span class="agent-job-label">${escapeHtml(job.name || (DATA_SOURCE_TYPES.find(d => d.value === job.dataSource?.type)?.label ?? 'Job'))}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="agent-card-head">
        <div class="agent-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z" stroke-linecap="round"/>
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="agent-card-info">
          <div class="agent-name">${escapeHtml(agent.name)}</div>
          ${agent.description ? `<div class="agent-desc">${escapeHtml(agent.description)}</div>` : ''}
        </div>
        <label class="agent-toggle" title="${agent.enabled ? 'Enabled' : 'Disabled'}">
          <input type="checkbox" class="toggle-input" ${agent.enabled ? 'checked' : ''}>
          <div class="agent-toggle-track"></div>
        </label>
      </div>

      <div class="agent-meta">
        <span class="agent-model-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4" stroke-linecap="round"/></svg>
          ${escapeHtml(primaryLabel)}
        </span>
        <span class="agent-jobs-badge">${jobCount} job${jobCount !== 1 ? 's' : ''}</span>
        ${lastRun ? `<span class="agent-lastrun">${escapeHtml(lastRun)}</span>` : ''}
      </div>

      ${jobRows ? `<div class="agent-jobs-summary">${jobRows}</div>` : ''}

      <div class="agent-card-footer">
        <button class="agent-card-btn run-btn" data-id="${escapeHtml(agent.id)}" title="Run all jobs now">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Run Now
        </button>
        <button class="agent-card-btn edit-btn" data-id="${escapeHtml(agent.id)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round"/></svg>
          Edit
        </button>
        <button class="agent-card-btn danger delete-btn" data-id="${escapeHtml(agent.id)}" data-name="${escapeHtml(agent.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Delete
        </button>
      </div>`;

    // Toggle
    card.querySelector('.toggle-input').addEventListener('change', async e => {
      const enabled = e.target.checked;
      agent.enabled = enabled;
      card.classList.toggle('is-disabled', !enabled);
      await window.electronAPI?.toggleAgent?.(agent.id, enabled);
    });

    // Run now
    card.querySelector('.run-btn').addEventListener('click', async () => {
      const btn = card.querySelector('.run-btn');
      btn.classList.add('is-running');
      btn.textContent = 'Running…';
      const res = await window.electronAPI?.runAgentNow?.(agent.id);
      btn.classList.remove('is-running');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run Now`;
      if (!res?.ok) console.error('[Agents] Run now failed:', res?.error);
    });

    // Edit
    card.querySelector('.edit-btn').addEventListener('click', () => openModal(agent));

    // Delete
    card.querySelector('.delete-btn').addEventListener('click', () => openConfirm(agent.id, agent.name));

    gridEl.appendChild(card);
  });
}

/* ══════════════════════════════════════════
   DELETE CONFIRM
══════════════════════════════════════════ */
const confirmOverlay   = document.getElementById('agent-confirm-overlay');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const confirmNameEl    = document.getElementById('confirm-agent-name');

function openConfirm(id, name) {
  _deletingId = id;
  if (confirmNameEl) confirmNameEl.textContent = name;
  confirmOverlay?.classList.add('open');
}

function closeConfirm() {
  confirmOverlay?.classList.remove('open');
  _deletingId = null;
}

confirmCancelBtn?.addEventListener('click', closeConfirm);
confirmOverlay?.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });

confirmDeleteBtn?.addEventListener('click', async () => {
  if (!_deletingId) return;
  await window.electronAPI?.deleteAgent?.(_deletingId);
  _agents = _agents.filter(a => a.id !== _deletingId);
  closeConfirm();
  renderGrid();
});

/* ══════════════════════════════════════════
   MODEL PICKER
══════════════════════════════════════════ */
const primaryModelBtn   = document.getElementById('primary-model-btn');
const primaryModelLabel = document.getElementById('primary-model-label');
const primaryModelMenu  = document.getElementById('primary-model-menu');

function buildModelMenu(menuEl, onSelect, selectedProviderId, selectedModelId) {
  menuEl.innerHTML = '';

  if (!_allModels.length) {
    menuEl.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--text-muted)">No models available. Add API keys in Settings.</div>';
    return;
  }

  // Group by provider
  const groups = {};
  for (const m of _allModels) {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push(m);
  }

  for (const [groupName, models] of Object.entries(groups)) {
    const header = document.createElement('div');
    header.className = 'agent-model-group-header';
    header.textContent = groupName;
    menuEl.appendChild(header);

    for (const m of models) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'agent-model-option' +
        (m.providerId === selectedProviderId && m.modelId === selectedModelId ? ' selected' : '');
      btn.innerHTML = `
        <span>${escapeHtml(m.modelName)}</span>
        ${m.description ? `<span class="agent-model-option-desc">${escapeHtml(m.description)}</span>` : ''}
      `;
      btn.addEventListener('click', () => {
        onSelect(m.providerId, m.modelId, m.modelName);
        menuEl.classList.remove('open');
        primaryModelBtn?.classList.remove('open');
      });
      menuEl.appendChild(btn);
    }
  }
}

primaryModelBtn?.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = primaryModelMenu?.classList.contains('open');
  primaryModelMenu?.classList.toggle('open', !isOpen);
  primaryModelBtn?.classList.toggle('open', !isOpen);
  if (!isOpen) {
    buildModelMenu(primaryModelMenu, (pid, mid, name) => {
      _primaryModel = { provider: pid, modelId: mid };
      if (primaryModelLabel) primaryModelLabel.textContent = `${name} (${pid})`;
    }, _primaryModel?.provider, _primaryModel?.modelId);
  }
});

document.addEventListener('click', e => {
  if (!primaryModelBtn?.contains(e.target) && !primaryModelMenu?.contains(e.target)) {
    primaryModelMenu?.classList.remove('open');
    primaryModelBtn?.classList.remove('open');
  }
});

function buildFallbackList() {
  const listEl = document.getElementById('fallback-models-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (!_allModels.length) {
    listEl.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:4px">No models available.</div>';
    return;
  }

  for (const m of _allModels) {
    const isChecked = _fallbackModels.some(fb => fb.provider === m.providerId && fb.modelId === m.modelId);
    const isPrimary = _primaryModel?.provider === m.providerId && _primaryModel?.modelId === m.modelId;
    if (isPrimary) continue; // don't list primary as fallback

    const item = document.createElement('label');
    item.className = 'agent-fallback-item';
    item.innerHTML = `
      <input type="checkbox" class="agent-fallback-check" data-provider="${escapeHtml(m.providerId)}" data-model="${escapeHtml(m.modelId)}" ${isChecked ? 'checked' : ''}/>
      <span class="agent-fallback-name">${escapeHtml(m.modelName)}</span>
      <span class="agent-fallback-provider">${escapeHtml(m.provider)}</span>
    `;
    item.querySelector('input').addEventListener('change', e => {
      const pid = e.target.dataset.provider;
      const mid = e.target.dataset.model;
      if (e.target.checked) {
        _fallbackModels.push({ provider: pid, modelId: mid });
      } else {
        _fallbackModels = _fallbackModels.filter(fb => !(fb.provider === pid && fb.modelId === mid));
      }
    });
    listEl.appendChild(item);
  }
}

/* ══════════════════════════════════════════
   JOB BUILDER
══════════════════════════════════════════ */
const jobsListEl  = document.getElementById('jobs-list');
const addJobBtn   = document.getElementById('add-job-btn');
const jobsBadge   = document.getElementById('jobs-count-badge');

function updateJobsBadge() {
  if (jobsBadge) jobsBadge.textContent = `(${_jobs.length}/${MAX_JOBS})`;
  if (addJobBtn) addJobBtn.disabled = _jobs.length >= MAX_JOBS;
}

function renderJobsList() {
  if (!jobsListEl) return;
  jobsListEl.innerHTML = '';
  _jobs.forEach((job, idx) => jobsListEl.appendChild(buildJobCard(job, idx)));
  updateJobsBadge();
}

function buildJobCard(job, idx) {
  const card = document.createElement('div');
  card.className = 'job-card open';
  card.dataset.jobId = job.id;

  const dsLabel   = DATA_SOURCE_TYPES.find(d => d.value === job.dataSource?.type)?.label ?? 'No data source';
  const outLabel  = OUTPUT_TYPES.find(d => d.value === job.output?.type)?.label ?? 'No output';
  const nameHint  = job.name || dsLabel;

  card.innerHTML = `
    <div class="job-card-header">
      <div class="job-card-number">${idx + 1}</div>
      <div class="job-card-name ${job.name ? 'has-value' : ''}" data-placeholder="Click to configure…">
        ${escapeHtml(nameHint)}
      </div>
      <svg class="job-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 15l-6-6-6 6" stroke-linecap="round"/>
      </svg>
      <button type="button" class="job-remove-btn" title="Remove job">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="job-body">

      <!-- Job Name -->
      <div class="agent-field" style="margin-top:14px">
        <label class="agent-field-label">Job Label <span style="color:var(--text-muted);font-weight:400">(optional)</span></label>
        <input type="text" class="agent-input job-name-input" value="${escapeHtml(job.name ?? '')}" placeholder="e.g. Morning Email Digest, Daily PR Check…" maxlength="60"/>
      </div>

      <!-- Trigger -->
      <div class="job-sub-section">
        <div class="job-sub-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" stroke-linecap="round"/></svg>
          When to Run
        </div>
        ${buildTriggerHTML(job.trigger)}
      </div>

      <!-- Data Source -->
      <div class="job-sub-section">
        <div class="job-sub-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke-linecap="round"/></svg>
          What Data to Collect
        </div>
        ${buildDataSourceHTML(job.dataSource)}
      </div>

      <!-- AI Instruction -->
      <div class="job-sub-section">
        <div class="job-sub-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z" stroke-linecap="round"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z" stroke-linecap="round"/></svg>
          AI Instruction
        </div>
        <div class="job-params">
          <textarea class="job-param-textarea job-instruction" rows="4"
            placeholder="Tell the AI what to do with the collected data…">${escapeHtml(job.instruction ?? '')}</textarea>
        </div>
      </div>

      <!-- Output -->
      <div class="job-sub-section">
        <div class="job-sub-label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4 20-7z"/></svg>
          What to Do With the Result
        </div>
        ${buildOutputHTML(job.output)}
      </div>

    </div>
  `;

  // Toggle collapse
  const header = card.querySelector('.job-card-header');
  header.addEventListener('click', e => {
    if (e.target.closest('.job-remove-btn')) return;
    card.classList.toggle('open');
  });

  // Remove job
  card.querySelector('.job-remove-btn').addEventListener('click', () => {
    _jobs = _jobs.filter(j => j.id !== job.id);
    renderJobsList();
  });

  // Job name input — update header label
  const nameInput = card.querySelector('.job-name-input');
  const nameLabel = card.querySelector('.job-card-name');
  nameInput?.addEventListener('input', () => {
    job.name = nameInput.value.trim();
    const ds   = DATA_SOURCE_TYPES.find(d => d.value === job.dataSource?.type)?.label ?? '';
    nameLabel.textContent = job.name || ds || 'Job';
    nameLabel.classList.toggle('has-value', !!job.name);
  });

  // Wire trigger change
  wireTriggerEvents(card, job);

  // Wire data source change
  wireDataSourceEvents(card, job);

  // Wire instruction change
  card.querySelector('.job-instruction')?.addEventListener('input', e => {
    job.instruction = e.target.value;
  });

  // Wire output change
  wireOutputEvents(card, job);

  return card;
}

/* ── Trigger HTML ── */
function buildTriggerHTML(trigger) {
  const type    = trigger?.type  ?? 'daily';
  const time    = trigger?.time  ?? '08:00';
  const day     = trigger?.day   ?? 'monday';
  const minutes = trigger?.minutes ?? 30;

  const intervals = [5, 10, 15, 30, 60, 120, 240, 480, 960, 1200, 1440];
  const intervalOpts = intervals.map(m => {
    const label = m < 60 ? `Every ${m} min` : m === 60 ? 'Every 1 hour' : `Every ${m / 60} hours`;
    return `<option value="${m}" ${minutes == m ? 'selected' : ''}>${label}</option>`;
  }).join('');

  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const dayOpts = days.map(d => `<option value="${d}" ${day === d ? 'selected' : ''}>${capitalize(d)}</option>`).join('');

  return `
    <div class="job-params">
      <select class="job-param-select trigger-type-select">
        <option value="on_startup" ${type==='on_startup'?'selected':''}>⚡ On app startup</option>
        <option value="interval"   ${type==='interval'  ?'selected':''}>⏱ At an interval</option>
        <option value="hourly"     ${type==='hourly'    ?'selected':''}>⏰ Every hour</option>
        <option value="daily"      ${type==='daily'     ?'selected':''}>🌅 Every day at…</option>
        <option value="weekly"     ${type==='weekly'    ?'selected':''}>📅 Every week on…</option>
      </select>
      <div class="job-trigger-sub ${type==='interval'?'':'hidden'} trigger-sub-interval">
        <select class="job-interval-select">${intervalOpts}</select>
      </div>
      <div class="job-trigger-sub ${type==='daily'?'':'hidden'} trigger-sub-daily">
        <span style="font-size:12px;color:var(--text-muted)">at</span>
        <input type="time" class="job-time-input trigger-time-daily" value="${time}"/>
      </div>
      <div class="job-trigger-sub ${type==='weekly'?'':'hidden'} trigger-sub-weekly">
        <select class="job-day-select trigger-day">${dayOpts}</select>
        <span style="font-size:12px;color:var(--text-muted)">at</span>
        <input type="time" class="job-time-input trigger-time-weekly" value="${time}"/>
      </div>
    </div>
  `;
}

function wireTriggerEvents(card, job) {
  const typeSelect = card.querySelector('.trigger-type-select');
  if (!typeSelect) return;
  typeSelect.addEventListener('change', () => {
    const t = typeSelect.value;
    job.trigger = job.trigger ?? {};
    job.trigger.type = t;
    card.querySelector('.trigger-sub-interval')?.classList.toggle('hidden', t !== 'interval');
    card.querySelector('.trigger-sub-daily')?.classList.toggle('hidden', t !== 'daily');
    card.querySelector('.trigger-sub-weekly')?.classList.toggle('hidden', t !== 'weekly');
  });

  card.querySelector('.job-interval-select')?.addEventListener('change', e => {
    job.trigger = job.trigger ?? {};
    job.trigger.minutes = parseInt(e.target.value);
  });

  card.querySelector('.trigger-time-daily')?.addEventListener('change', e => {
    job.trigger = job.trigger ?? {};
    job.trigger.time = e.target.value;
  });

  card.querySelector('.trigger-day')?.addEventListener('change', e => {
    job.trigger = job.trigger ?? {};
    job.trigger.day = e.target.value;
  });

  card.querySelector('.trigger-time-weekly')?.addEventListener('change', e => {
    job.trigger = job.trigger ?? {};
    job.trigger.time = e.target.value;
  });
}

/* ── Data source HTML ── */
function buildDataSourceHTML(ds) {
  const type = ds?.type ?? '';
  const groups = {};
  for (const d of DATA_SOURCE_TYPES) {
    if (!groups[d.group]) groups[d.group] = [];
    groups[d.group].push(d);
  }

  const opts = Object.entries(groups).map(([g, items]) =>
    `<optgroup label="${g}">${items.map(i => `<option value="${i.value}" ${type===i.value?'selected':''}>${i.label}</option>`).join('')}</optgroup>`
  ).join('');

  return `
    <div class="job-params">
      <select class="job-param-select ds-type-select">
        <option value="">— Choose a data source —</option>
        ${opts}
      </select>
      <div class="ds-params-area">
        ${buildDsParams(ds)}
      </div>
    </div>
  `;
}

function buildDsParams(ds) {
  const type = ds?.type ?? '';
  switch (type) {
    case 'gmail_inbox':
      return `<input type="number" class="job-param-input ds-max-results" placeholder="Max emails (default 20)" value="${ds?.maxResults ?? 20}" min="1" max="50"/>`;

    case 'gmail_search':
      return `
        <input type="text" class="job-param-input ds-query" placeholder="Gmail search query, e.g: from:boss OR subject:urgent" value="${escapeHtml(ds?.query ?? '')}"/>
        <input type="number" class="job-param-input ds-max-results" placeholder="Max results (default 10)" value="${ds?.maxResults ?? 10}" min="1" max="30"/>
      `;

    case 'github_prs':
    case 'github_issues':
    case 'github_commits':
      return `
        <input type="text" class="job-param-input ds-owner" placeholder="GitHub owner / org" value="${escapeHtml(ds?.owner ?? '')}"/>
        <input type="text" class="job-param-input ds-repo"  placeholder="Repository name"  value="${escapeHtml(ds?.repo  ?? '')}"/>
        ${type === 'github_commits' ? `<input type="number" class="job-param-input ds-max-results" placeholder="Number of commits (default 10)" value="${ds?.maxResults ?? 10}" min="1" max="30"/>` : `
        <select class="job-param-select ds-state">
          <option value="open"   ${ds?.state==='open'  ?'selected':''}>Open</option>
          <option value="closed" ${ds?.state==='closed'?'selected':''}>Closed</option>
          <option value="all"    ${ds?.state==='all'   ?'selected':''}>All</option>
        </select>`}
      `;

    case 'hacker_news':
      return `
        <input type="number" class="job-param-input ds-hn-count" placeholder="Number of stories (default 10)" value="${ds?.count ?? 10}" min="3" max="20"/>
        <select class="job-param-select ds-hn-type">
          <option value="top"  ${ds?.hnType==='top' ?'selected':''}>Top stories</option>
          <option value="new"  ${ds?.hnType==='new' ?'selected':''}>New stories</option>
          <option value="best" ${ds?.hnType==='best'?'selected':''}>Best stories</option>
          <option value="ask"  ${ds?.hnType==='ask' ?'selected':''}>Ask HN</option>
        </select>
      `;

    case 'weather':
      return `
        <input type="text" class="job-param-input ds-location" placeholder="City name, e.g: London, Mumbai, New York" value="${escapeHtml(ds?.location ?? '')}"/>
        <select class="job-param-select ds-units">
          <option value="celsius"    ${ds?.units==='celsius'   ?'selected':''}>Celsius</option>
          <option value="fahrenheit" ${ds?.units==='fahrenheit'?'selected':''}>Fahrenheit</option>
        </select>
      `;

    case 'crypto_price':
      return `<input type="text" class="job-param-input ds-coins" placeholder="Coin names, comma-separated, e.g: bitcoin,ethereum,solana" value="${escapeHtml(ds?.coins ?? 'bitcoin,ethereum')}"/>`;

    case 'fetch_url':
      return `<input type="url" class="job-param-input ds-url" placeholder="https://example.com/page-to-monitor" value="${escapeHtml(ds?.url ?? '')}"/>`;

    case 'custom_context':
      return `<textarea class="job-param-textarea ds-context" rows="3" placeholder="Paste any text, data, or context for the AI to work with…">${escapeHtml(ds?.context ?? '')}</textarea>`;

    default:
      return '';
  }
}

function wireDataSourceEvents(card, job) {
  const typeSelect   = card.querySelector('.ds-type-select');
  const paramsArea   = card.querySelector('.ds-params-area');
  const nameLabel    = card.querySelector('.job-card-name');
  const nameInput    = card.querySelector('.job-name-input');
  const instrArea    = card.querySelector('.job-instruction');

  if (!typeSelect) return;

  typeSelect.addEventListener('change', () => {
    const dsType = typeSelect.value;
    job.dataSource = { type: dsType };

    // Auto-fill instruction template
    const template = INSTRUCTION_TEMPLATES[dsType];
    if (template && instrArea && !instrArea.value.trim()) {
      instrArea.value = template;
      job.instruction = template;
    }

    // Update label
    const dsLabel = DATA_SOURCE_TYPES.find(d => d.value === dsType)?.label ?? '';
    if (!nameInput?.value.trim() && nameLabel) {
      nameLabel.textContent = dsLabel;
    }

    if (paramsArea) paramsArea.innerHTML = buildDsParams(job.dataSource);
    wireDsParamEvents(card, job);
  });

  wireDsParamEvents(card, job);
}

function wireDsParamEvents(card, job) {
  const get = sel => card.querySelector(sel);

  get('.ds-max-results')?.addEventListener('input', e => { job.dataSource.maxResults = parseInt(e.target.value) || 10; });
  get('.ds-query')?.addEventListener('input',      e => { job.dataSource.query      = e.target.value.trim(); });
  get('.ds-owner')?.addEventListener('input',      e => { job.dataSource.owner      = e.target.value.trim(); });
  get('.ds-repo')?.addEventListener('input',       e => { job.dataSource.repo       = e.target.value.trim(); });
  get('.ds-state')?.addEventListener('change',     e => { job.dataSource.state      = e.target.value; });
  get('.ds-hn-count')?.addEventListener('input',   e => { job.dataSource.count      = parseInt(e.target.value) || 10; });
  get('.ds-hn-type')?.addEventListener('change',   e => { job.dataSource.hnType     = e.target.value; });
  get('.ds-location')?.addEventListener('input',   e => { job.dataSource.location   = e.target.value.trim(); });
  get('.ds-units')?.addEventListener('change',     e => { job.dataSource.units      = e.target.value; });
  get('.ds-coins')?.addEventListener('input',      e => { job.dataSource.coins      = e.target.value.trim(); });
  get('.ds-url')?.addEventListener('input',        e => { job.dataSource.url        = e.target.value.trim(); });
  get('.ds-context')?.addEventListener('input',    e => { job.dataSource.context    = e.target.value; });
}

/* ── Output HTML ── */
function buildOutputHTML(output) {
  const type = output?.type ?? '';

  const opts = OUTPUT_TYPES.map(o =>
    `<option value="${o.value}" ${type===o.value?'selected':''}>${o.label}</option>`
  ).join('');

  return `
    <div class="job-params">
      <select class="job-param-select out-type-select">
        <option value="">— Choose what to do with the AI's response —</option>
        ${opts}
      </select>
      <div class="out-params-area">
        ${buildOutParams(output)}
      </div>
    </div>
  `;
}

function buildOutParams(output) {
  const type = output?.type ?? '';
  switch (type) {
    case 'send_email':
      return `
        <input type="email" class="job-param-input out-to" placeholder="Send to email address *" value="${escapeHtml(output?.to ?? '')}"/>
        <input type="text"  class="job-param-input out-subject" placeholder="Subject (optional — AI generates one if blank)" value="${escapeHtml(output?.subject ?? '')}"/>
        <input type="email" class="job-param-input out-cc"  placeholder="CC (optional)" value="${escapeHtml(output?.cc ?? '')}"/>
      `;
    case 'send_notification':
      return `<input type="text" class="job-param-input out-notif-title" placeholder="Notification title (optional — agent name used if blank)" value="${escapeHtml(output?.title ?? '')}"/>`;
    case 'write_file':
      return `
        <input type="text" class="job-param-input out-file-path" placeholder="File path, e.g: /Users/you/Desktop/agent-log.txt" value="${escapeHtml(output?.filePath ?? '')}"/>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-secondary);cursor:pointer;padding:4px 0">
          <input type="checkbox" class="out-append" ${output?.append?'checked':''} style="width:14px;height:14px"/>
          Append to file (instead of overwrite each run)
        </label>
      `;
    case 'http_webhook':
      return `
        <input type="url"   class="job-param-input out-webhook-url"    placeholder="Webhook URL, e.g: https://hooks.slack.com/…" value="${escapeHtml(output?.url ?? '')}"/>
        <select class="job-param-select out-webhook-method">
          <option value="POST" ${output?.method==='POST'?'selected':''}>POST</option>
          <option value="GET"  ${output?.method==='GET' ?'selected':''}>GET</option>
        </select>
      `;
    default:
      return '';
  }
}

function wireOutputEvents(card, job) {
  const typeSelect = card.querySelector('.out-type-select');
  const paramsArea = card.querySelector('.out-params-area');
  if (!typeSelect) return;

  typeSelect.addEventListener('change', () => {
    const outType = typeSelect.value;
    job.output = { type: outType };
    if (paramsArea) paramsArea.innerHTML = buildOutParams(job.output);
    wireOutParamEvents(card, job);
  });

  wireOutParamEvents(card, job);
}

function wireOutParamEvents(card, job) {
  const get = sel => card.querySelector(sel);
  get('.out-to')?.addEventListener('input',            e => { job.output.to       = e.target.value.trim(); });
  get('.out-subject')?.addEventListener('input',       e => { job.output.subject  = e.target.value.trim(); });
  get('.out-cc')?.addEventListener('input',            e => { job.output.cc       = e.target.value.trim(); });
  get('.out-notif-title')?.addEventListener('input',   e => { job.output.title    = e.target.value.trim(); });
  get('.out-file-path')?.addEventListener('input',     e => { job.output.filePath = e.target.value.trim(); });
  get('.out-append')?.addEventListener('change',       e => { job.output.append   = e.target.checked; });
  get('.out-webhook-url')?.addEventListener('input',   e => { job.output.url      = e.target.value.trim(); });
  get('.out-webhook-method')?.addEventListener('change',e => { job.output.method  = e.target.value; });
}

/* ── Add Job ── */
addJobBtn?.addEventListener('click', () => {
  if (_jobs.length >= MAX_JOBS) return;
  const newJob = {
    id:          generateJobId(),
    name:        '',
    trigger:     { type: 'daily', time: '08:00' },
    dataSource:  { type: '' },
    instruction: '',
    output:      { type: '' },
    lastRun:     null,
  };
  _jobs.push(newJob);
  renderJobsList();
  // Scroll to bottom
  document.getElementById('agent-modal-body')?.scrollTo({ top: 999999, behavior: 'smooth' });
});

/* ══════════════════════════════════════════
   MODAL OPEN / CLOSE
══════════════════════════════════════════ */
const modalBackdrop = document.getElementById('agent-modal-backdrop');
const modalTitleEl  = document.getElementById('agent-modal-title-text');
const modalClose    = document.getElementById('agent-modal-close');
const cancelBtn     = document.getElementById('agent-cancel-btn');
const saveBtn       = document.getElementById('agent-save-btn');
const nameInput     = document.getElementById('agent-name');
const descInput     = document.getElementById('agent-desc');

async function openModal(agent = null) {
  _editingId       = agent?.id ?? null;
  _primaryModel    = agent?.primaryModel    ? { ...agent.primaryModel }    : null;
  _fallbackModels  = agent?.fallbackModels  ? [...agent.fallbackModels]    : [];
  _jobs            = agent?.jobs            ? agent.jobs.map(j => ({ ...j, dataSource: { ...j.dataSource }, output: { ...j.output }, trigger: { ...j.trigger } })) : [];

  if (modalTitleEl) modalTitleEl.textContent = agent ? 'Edit Agent' : 'New Agent';
  if (nameInput) nameInput.value = agent?.name ?? '';
  if (descInput) descInput.value = agent?.description ?? '';

  // Primary model label
  if (primaryModelLabel) {
    primaryModelLabel.textContent = _primaryModel
      ? modelDisplayName(_primaryModel.provider, _primaryModel.modelId)
      : 'Select a model…';
  }

  buildFallbackList();
  renderJobsList();

  modalBackdrop?.classList.add('open');
  document.body.classList.add('modal-open');
  setTimeout(() => nameInput?.focus(), 60);
}

function closeModal() {
  modalBackdrop?.classList.remove('open');
  document.body.classList.remove('modal-open');
  _editingId = null;
}

modalClose?.addEventListener('click', closeModal);
cancelBtn?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });

/* ── Collect form data ── */
function collectAgent() {
  const name = nameInput?.value.trim();
  if (!name) return null;

  return {
    id:             _editingId ?? generateId(),
    name,
    description:    descInput?.value.trim() ?? '',
    enabled:        true,
    primaryModel:   _primaryModel,
    fallbackModels: _fallbackModels,
    jobs:           _jobs.filter(j => j.dataSource?.type && j.output?.type),
  };
}

/* ── Save ── */
saveBtn?.addEventListener('click', async () => {
  const data = collectAgent();
  if (!data) {
    nameInput?.animate([{borderColor:'#f87171'},{borderColor:'var(--border)'}],{duration:900});
    nameInput?.focus();
    return;
  }

  saveBtn.disabled    = true;
  saveBtn.textContent = 'Saving…';

  try {
    const res = await window.electronAPI?.saveAgent?.(data);
    if (res?.ok) {
      const idx = _agents.findIndex(a => a.id === data.id);
      if (idx >= 0) _agents[idx] = res.agent ?? data;
      else          _agents.push(res.agent ?? data);
      renderGrid();
      closeModal();
    } else {
      console.error('[Agents] Save failed:', res?.error);
    }
  } finally {
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save Agent';
  }
});

/* ══════════════════════════════════════════
   KEYBOARD
══════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
document.getElementById('add-agent-header-btn')?.addEventListener('click', () => openModal());
document.getElementById('add-agent-empty-btn')?.addEventListener('click', () => openModal());

async function load() {
  await loadModels();
  try {
    const res = await window.electronAPI?.getAgents?.();
    _agents = Array.isArray(res?.agents) ? res.agents : [];
  } catch {
    _agents = [];
  }
  renderGrid();
}

load();

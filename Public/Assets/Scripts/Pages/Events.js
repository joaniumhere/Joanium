const POLL_MS = 1_500;
const MAX_EVENTS = 200;

function getEventsHTML() {
  return `
<main id="main" class="events-main">
  <div class="events-scroll">
    <div class="events-page-header">
      <div class="events-page-header-copy">
        <h2>
          Events
          <span class="events-live-badge" id="events-live-badge">
            <span class="events-live-dot"></span>
            Live
          </span>
        </h2>
        <p>Real-time log of every automation and agent run - successes, failures, and what happened.</p>
      </div>
      <div class="events-header-actions">
        <div class="events-filter-group">
          <button class="events-filter-btn active" data-filter="all">All</button>
          <button class="events-filter-btn" data-filter="agents">Agents</button>
          <button class="events-filter-btn" data-filter="automations">Automations</button>
          <button class="events-filter-btn" data-filter="errors">Errors</button>
        </div>
        <button class="events-clear-btn" id="events-clear-btn" title="Clear event log">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Clear
        </button>
      </div>
    </div>

    <div class="events-stats-bar">
      <div class="events-stat">
        <span class="events-stat-value" id="stat-total">-</span>
        <span class="events-stat-label">Total runs</span>
      </div>
      <div class="events-stat-divider"></div>
      <div class="events-stat">
        <span class="events-stat-value success" id="stat-success">-</span>
        <span class="events-stat-label">Successful</span>
      </div>
      <div class="events-stat-divider"></div>
      <div class="events-stat">
        <span class="events-stat-value skipped" id="stat-skipped">-</span>
        <span class="events-stat-label">Skipped</span>
      </div>
      <div class="events-stat-divider"></div>
      <div class="events-stat">
        <span class="events-stat-value error" id="stat-errors">-</span>
        <span class="events-stat-label">Errors</span>
      </div>
      <div class="events-stat-divider"></div>
      <div class="events-stat">
        <span class="events-stat-value" id="stat-agents">-</span>
        <span class="events-stat-label">Active agents</span>
      </div>
    </div>

    <div id="events-loading" class="events-loading">
      <div class="events-shimmer"></div>
      <div class="events-shimmer" style="width:85%"></div>
      <div class="events-shimmer" style="width:70%"></div>
    </div>

    <div id="events-empty" class="events-empty" style="display:none">
      <div class="events-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h3>No events yet</h3>
      <p>Events will appear here as your automations and agents run. Create an automation or agent and run it to see live logs.</p>
    </div>

    <div id="events-feed" class="events-feed" style="display:none"></div>
  </div>
</main>

<div id="event-detail-backdrop">
  <div id="event-detail-modal" role="dialog" aria-modal="true">
    <div class="event-detail-header">
      <div class="event-detail-title-group">
        <div class="event-detail-eyebrow" id="detail-eyebrow">Event Details</div>
        <h2 id="detail-title">-</h2>
        <div class="event-detail-timestamp" id="detail-meta"></div>
      </div>
      <button class="settings-modal-close" id="event-detail-close" type="button" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
        </svg>
      </button>
    </div>

    <div class="event-detail-body" id="detail-body"></div>
  </div>
</div>

<div id="events-confirm-backdrop" class="modal-backdrop">
  <div class="modal-panel events-confirm-modal">
    <div class="events-confirm-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="28" height="28">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <h2 class="events-confirm-title">Clear all events?</h2>
    <p class="events-confirm-body">
      This will permanently delete all run history for every agent and automation.
      Events from future runs will still appear here.
    </p>
    <div class="events-confirm-actions">
      <button class="events-confirm-btn events-confirm-btn--cancel" id="events-confirm-cancel">Cancel</button>
      <button class="events-confirm-btn events-confirm-btn--ok" id="events-confirm-ok">Clear all</button>
    </div>
  </div>
</div>`;
}

export function mount(outlet) {
  outlet.innerHTML = getEventsHTML();

  const feedEl = outlet.querySelector('#events-feed');
  const emptyEl = outlet.querySelector('#events-empty');
  const loadingEl = outlet.querySelector('#events-loading');
  const liveBadge = outlet.querySelector('#events-live-badge');
  const statTotal = outlet.querySelector('#stat-total');
  const statSuccess = outlet.querySelector('#stat-success');
  const statSkipped = outlet.querySelector('#stat-skipped');
  const statErrors = outlet.querySelector('#stat-errors');
  const statAgents = outlet.querySelector('#stat-agents');
  const filterBtns = outlet.querySelectorAll('.events-filter-btn');
  const clearBtn = outlet.querySelector('#events-clear-btn');
  const detailBackdrop = outlet.querySelector('#event-detail-backdrop');
  const detailClose = outlet.querySelector('#event-detail-close');
  const detailEyebrow = outlet.querySelector('#detail-eyebrow');
  const detailTitle = outlet.querySelector('#detail-title');
  const detailMeta = outlet.querySelector('#detail-meta');
  const detailBody = outlet.querySelector('#detail-body');
  const confirmBackdrop = outlet.querySelector('#events-confirm-backdrop');
  const confirmCancel = outlet.querySelector('#events-confirm-cancel');
  const confirmOk = outlet.querySelector('#events-confirm-ok');

  let historyEvents = [];
  let runningJobs = [];
  let seenHistoryIds = new Set();
  let filter = 'all';
  let pollTimer = null;
  let firstLoad = true;
  let clearing = false;

  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  function timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso);
    const second = 1_000;
    const minute = 60 * second;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < 30 * second) return 'just now';
    if (diff < 2 * minute) return `${Math.floor(diff / second)}s ago`;
    if (diff < 2 * hour) return `${Math.floor(diff / minute)}m ago`;
    if (diff < 2 * day) return `${Math.floor(diff / hour)}h ago`;
    return new Date(iso).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function runningDuration(startedAt) {
    if (!startedAt) return '';
    const seconds = Math.floor((Date.now() - new Date(startedAt)) / 1_000);
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  function fullDateTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function triggerLabel(trigger) {
    if (!trigger) return '';
    switch (trigger.type) {
      case 'on_startup': return 'Startup';
      case 'interval': return `Every ${trigger.minutes}m`;
      case 'hourly': return 'Hourly';
      case 'daily': return `Daily ${trigger.time ?? ''}`.trim();
      case 'weekly': return `${trigger.day ?? ''} ${trigger.time ?? ''}`.trim();
      default: return trigger.type;
    }
  }

  function show(element) {
    if (element) element.style.display = '';
  }

  function hide(element) {
    if (element) element.style.display = 'none';
  }

  async function fetchHistory() {
    const events = [];

    try {
      const res = await window.electronAPI?.getAgents?.();
      const agents = Array.isArray(res?.agents) ? res.agents : [];
      for (const agent of agents) {
        for (const job of agent.jobs ?? []) {
          for (const entry of job.history ?? []) {
            const status = entry.error
              ? 'error'
              : (entry.nothingToReport || entry.skipped) ? 'skipped' : 'success';
            events.push({
              id: `agent__${agent.id}__${job.id}__${entry.timestamp}`,
              type: 'agent',
              source: agent.name,
              agentId: agent.id,
              jobId: job.id,
              jobName: job.name || 'Job',
              status,
              timestamp: entry.timestamp,
              summary: entry.summary || '',
              fullResponse: entry.fullResponse || '',
              error: entry.error || null,
              skipReason: entry.skipReason || null,
              trigger: job.trigger || null,
              agentEnabled: agent.enabled,
            });
          }
        }
      }
    } catch { /* non-fatal */ }

    try {
      const res = await window.electronAPI?.getAutomations?.();
      const automations = Array.isArray(res?.automations) ? res.automations : [];
      for (const automation of automations) {
        for (const entry of automation.history ?? []) {
          events.push({
            id: `auto__${automation.id}__${entry.timestamp}`,
            type: 'automation',
            source: automation.name,
            autoId: automation.id,
            status: entry.error ? 'error' : 'success',
            timestamp: entry.timestamp,
            summary: entry.summary || automation.description || `${automation.actions?.length ?? 0} action(s) ran`,
            fullResponse: entry.summary || '',
            error: entry.error || null,
            skipReason: null,
            trigger: automation.trigger || null,
            autoEnabled: automation.enabled,
          });
        }

        if (!(automation.history?.length) && automation.lastRun) {
          events.push({
            id: `auto__${automation.id}__${automation.lastRun}`,
            type: 'automation',
            source: automation.name,
            autoId: automation.id,
            status: 'success',
            timestamp: automation.lastRun,
            summary: automation.description || `${automation.actions?.length ?? 0} action(s) ran`,
            fullResponse: '',
            error: null,
            skipReason: null,
            trigger: automation.trigger || null,
            autoEnabled: automation.enabled,
          });
        }
      }
    } catch { /* non-fatal */ }

    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return events.slice(0, MAX_EVENTS);
  }

  async function fetchRunning() {
    try {
      const res = await window.electronAPI?.getRunningJobs?.();
      return Array.isArray(res?.running) ? res.running : [];
    } catch {
      return [];
    }
  }

  function updateStats(nextHistory, nextRunning) {
    statTotal.textContent = String(nextHistory.length);
    statSuccess.textContent = String(nextHistory.filter((event) => event.status === 'success').length);
    statSkipped.textContent = String(nextHistory.filter((event) => event.status === 'skipped').length);
    statErrors.textContent = String(nextHistory.filter((event) => event.status === 'error').length);

    const historicIds = new Set(nextHistory.filter((event) => event.type === 'agent').map((event) => event.agentId));
    const runningIds = new Set(nextRunning.map((job) => job.agentId));
    statAgents.textContent = String(new Set([...historicIds, ...runningIds]).size);
  }

  function zeroStats() {
    statTotal.textContent = '0';
    statSuccess.textContent = '0';
    statSkipped.textContent = '0';
    statErrors.textContent = '0';
    statAgents.textContent = '0';
  }

  function applyFilter(events) {
    switch (filter) {
      case 'agents': return events.filter((event) => event.type === 'agent');
      case 'automations': return events.filter((event) => event.type === 'automation');
      case 'errors': return events.filter((event) => event.status === 'error');
      default: return events;
    }
  }

  function buildRunningCard(job) {
    const card = document.createElement('div');
    card.className = 'event-row event-row--running';
    card.dataset.runKey = `${job.agentId}__${job.jobId}`;
    card.innerHTML = `
      <div class="event-status-icon event-status--running">
        <svg class="running-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M21 12a9 9 0 11-6.219-8.56" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="event-row-body">
        <div class="event-row-top">
          <div class="event-source-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="event-type-icon event-type-icon--agent">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z" stroke-linecap="round"/>
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z" stroke-linecap="round"/>
            </svg>
            <span class="event-source">${esc(job.agentName)}</span>
            <span class="event-job-sep">&rsaquo;</span>
            <span class="event-job-name">${esc(job.jobName)}</span>
          </div>
          <div class="event-row-badges">
            ${job.trigger ? `<span class="event-trigger-badge">${esc(triggerLabel(job.trigger))}</span>` : ''}
            <span class="event-status-badge event-status-badge--running">Running</span>
          </div>
        </div>
        <div class="event-summary">Collecting data and calling AI...</div>
        <div class="event-row-footer">
          <span class="event-time running-duration" data-started="${esc(job.startedAt)}">Started ${timeAgo(job.startedAt)}</span>
          <span class="event-elapsed">Elapsed: <span class="elapsed-value">${runningDuration(job.startedAt)}</span></span>
        </div>
      </div>`;
    return card;
  }

  function buildEventRow(event, isNew = false) {
    const row = document.createElement('div');
    row.className = `event-row event-row--${event.status}${isNew ? ' event-row--new' : ''}`;
    row.dataset.eventId = event.id;

    const statusIcon = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>',
      skipped: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14" stroke-linecap="round"/></svg>',
    }[event.status] ?? '';

    const typeIcon = event.type === 'agent'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="event-type-icon event-type-icon--agent">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-3.14Z" stroke-linecap="round"/>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-3.14Z" stroke-linecap="round"/>
        </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="event-type-icon event-type-icon--automation">
          <path d="M13 2L4.5 13H11l-1 9L20.5 11H14L13 2z" stroke-linejoin="round"/>
        </svg>`;

    const statusLabel = {
      success: 'Acted',
      error: 'Error',
      skipped: 'Skipped',
    }[event.status] ?? event.status;
    const triggerBadge = event.trigger ? `<span class="event-trigger-badge">${esc(triggerLabel(event.trigger))}</span>` : '';
    const hasDetail = event.fullResponse || event.error || event.summary;

    let bodyContent = '';
    if (event.status === 'error' && event.error) {
      bodyContent = `<div class="event-error-preview">${esc(event.error.slice(0, 140))}${event.error.length > 140 ? '...' : ''}</div>`;
    } else if (event.status === 'skipped') {
      const reason = event.skipReason || 'Data source returned nothing to act on - no output was sent.';
      bodyContent = `<div class="event-summary muted">${esc(reason)}</div>`;
    } else if (event.summary) {
      bodyContent = `<div class="event-summary">${esc(event.summary.slice(0, 140))}${event.summary.length > 140 ? '...' : ''}</div>`;
    }

    row.innerHTML = `
      <div class="event-status-icon event-status--${event.status}">${statusIcon}</div>
      <div class="event-row-body">
        <div class="event-row-top">
          <div class="event-source-wrap">
            ${typeIcon}
            <span class="event-source">${esc(event.source)}</span>
            ${event.jobName ? `<span class="event-job-sep">&rsaquo;</span><span class="event-job-name">${esc(event.jobName)}</span>` : ''}
          </div>
          <div class="event-row-badges">
            ${triggerBadge}
            <span class="event-status-badge event-status-badge--${event.status}">${statusLabel}</span>
          </div>
        </div>
        ${bodyContent}
        <div class="event-row-footer">
          <span class="event-time" title="${fullDateTime(event.timestamp)}">${timeAgo(event.timestamp)}</span>
          ${(event.agentEnabled === false || event.autoEnabled === false)
            ? '<span class="event-disabled-badge">disabled</span>'
            : ''}
          ${hasDetail ? '<button class="event-view-btn" type="button">View output</button>' : ''}
        </div>
      </div>`;

    if (hasDetail) {
      row.querySelector('.event-view-btn')?.addEventListener('click', (evt) => {
        evt.stopPropagation();
        openDetail(event);
      });
      row.style.cursor = 'pointer';
      row.addEventListener('click', (evt) => {
        if (!evt.target.closest('.event-view-btn')) openDetail(event);
      });
    }

    return row;
  }

  function renderHistory(nextHistory, newIds = new Set()) {
    feedEl.querySelectorAll('.event-date-header, .event-row:not(.event-row--running)').forEach((element) => element.remove());

    const filtered = applyFilter(nextHistory);
    if (!filtered.length) return;

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86_400_000).toDateString();
    const groups = new Map();

    for (const event of filtered) {
      const day = new Date(event.timestamp).toDateString();
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(event);
    }

    for (const [day, events] of groups) {
      const header = document.createElement('div');
      header.className = 'event-date-header';
      header.textContent = day === today
        ? 'Today'
        : day === yesterday
          ? 'Yesterday'
          : new Date(day).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      feedEl.appendChild(header);
      for (const event of events) feedEl.appendChild(buildEventRow(event, newIds.has(event.id)));
    }
  }

  function render(nextHistory, nextRunning, newHistoryIds = new Set()) {
    hide(loadingEl);

    const hasAnything = nextRunning.length > 0 || applyFilter(nextHistory).length > 0;
    if (!hasAnything) {
      hide(feedEl);
      show(emptyEl);
      return;
    }

    hide(emptyEl);
    show(feedEl);

    const existingRunKeys = new Set(
      Array.from(feedEl.querySelectorAll('.event-row--running')).map((element) => element.dataset.runKey)
    );
    const nextRunKeys = new Set(nextRunning.map((job) => `${job.agentId}__${job.jobId}`));

    feedEl.querySelectorAll('.event-row--running').forEach((element) => {
      if (!nextRunKeys.has(element.dataset.runKey)) {
        element.classList.add('event-row--finishing');
        setTimeout(() => element.remove(), 400);
      }
    });

    for (const job of nextRunning) {
      const key = `${job.agentId}__${job.jobId}`;
      if (!existingRunKeys.has(key)) {
        const card = buildRunningCard(job);
        const firstHeader = feedEl.querySelector('.event-date-header');
        if (firstHeader) feedEl.insertBefore(card, firstHeader);
        else feedEl.prepend(card);
      }
    }

    feedEl.querySelectorAll('.elapsed-value').forEach((element) => {
      const started = element.closest('.event-row--running')
        ?.querySelector('.running-duration')
        ?.dataset?.started;
      if (started) element.textContent = runningDuration(started);
    });

    renderHistory(nextHistory, newHistoryIds);
  }

  function openDetail(event) {
    detailEyebrow.textContent = event.type === 'agent' ? 'Agent Output' : 'Automation Run';
    detailTitle.textContent = event.jobName ? `${event.source} > ${event.jobName}` : event.source;
    detailMeta.textContent = fullDateTime(event.timestamp);

    let html = '';
    if (event.status === 'error') {
      html += `<div class="detail-section detail-section--error">
        <div class="detail-section-label">Error</div>
        <div class="detail-error-text">${esc(event.error)}</div>
      </div>`;
    }
    if (event.status === 'skipped') {
      html += `<div class="detail-section">
        <div class="detail-section-label">Why was this skipped?</div>
        <div class="detail-skipped-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16" style="flex-shrink:0">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
          </svg>
          ${esc(event.skipReason || 'Data source returned nothing to act on.')}
        </div>
      </div>`;
    }
    if (event.fullResponse) {
      html += `<div class="detail-section">
        <div class="detail-section-label">AI Output</div>
        <div class="detail-response">${esc(event.fullResponse)}</div>
      </div>`;
    } else if (event.summary && event.status === 'success') {
      html += `<div class="detail-section">
        <div class="detail-section-label">Summary</div>
        <div class="detail-response">${esc(event.summary)}</div>
      </div>`;
    }
    if (event.trigger) {
      html += `<div class="detail-section">
        <div class="detail-section-label">Trigger</div>
        <div class="detail-meta-pill">${esc(triggerLabel(event.trigger))}</div>
      </div>`;
    }

    detailBody.innerHTML = html || '<div class="detail-no-content">No additional detail available.</div>';
    detailBackdrop.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeDetail() {
    detailBackdrop.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  function openConfirmClear() {
    confirmBackdrop.classList.add('open');
    document.body.classList.add('modal-open');
  }

  function closeConfirmClear() {
    confirmBackdrop.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  async function executeClear() {
    closeConfirmClear();
    clearing = true;

    try {
      await window.electronAPI?.clearEventsHistory?.();
    } catch (error) {
      console.error('[Events] clearEventsHistory IPC failed:', error);
    }

    historyEvents = [];
    seenHistoryIds = new Set();
    feedEl.querySelectorAll('.event-date-header, .event-row:not(.event-row--running)').forEach((element) => element.remove());

    if (runningJobs.length === 0) {
      hide(feedEl);
      show(emptyEl);
    }

    zeroStats();
    setTimeout(() => { clearing = false; }, 800);
  }

  async function poll() {
    if (clearing) return;

    try {
      const [nextHistory, nextRunning] = await Promise.all([fetchHistory(), fetchRunning()]);

      const newIds = new Set();
      for (const event of nextHistory) {
        if (!seenHistoryIds.has(event.id)) {
          newIds.add(event.id);
          seenHistoryIds.add(event.id);
        }
      }

      const historyChanged = firstLoad || newIds.size > 0;
      const prevRunKeys = runningJobs.map((job) => `${job.agentId}__${job.jobId}`).join(',');
      const nextRunKeys = nextRunning.map((job) => `${job.agentId}__${job.jobId}`).join(',');
      const runningChanged = prevRunKeys !== nextRunKeys;

      historyEvents = nextHistory;
      runningJobs = nextRunning;

      if (historyChanged || runningChanged) {
        updateStats(nextHistory, nextRunning);
        render(nextHistory, nextRunning, firstLoad ? new Set() : newIds);

        if (!firstLoad && (newIds.size > 0 || runningChanged)) {
          liveBadge.classList.add('pulse');
          setTimeout(() => liveBadge.classList.remove('pulse'), 1_200);
        }
      } else if (nextRunning.length > 0) {
        feedEl.querySelectorAll('.elapsed-value').forEach((element) => {
          const started = element.closest('.event-row--running')
            ?.querySelector('.running-duration')
            ?.dataset?.started;
          if (started) element.textContent = runningDuration(started);
        });
      }

      if (firstLoad) {
        hide(loadingEl);
        firstLoad = false;
      }
    } catch (error) {
      console.error('[Events] poll error:', error);
      if (firstLoad) {
        hide(loadingEl);
        firstLoad = false;
      }
    }
  }

  async function start() {
    show(loadingEl);
    hide(emptyEl);
    hide(feedEl);
    await poll();
    pollTimer = setInterval(poll, POLL_MS);
  }

  const onVisibility = () => {
    clearInterval(pollTimer);
    if (!document.hidden) {
      poll();
      pollTimer = setInterval(poll, POLL_MS);
    }
  };

  const onKeydown = (event) => {
    if (event.key === 'Escape') {
      closeDetail();
      closeConfirmClear();
    }
  };

  detailClose?.addEventListener('click', closeDetail);
  detailBackdrop?.addEventListener('click', (event) => {
    if (event.target === detailBackdrop) closeDetail();
  });
  clearBtn?.addEventListener('click', openConfirmClear);
  confirmCancel?.addEventListener('click', closeConfirmClear);
  confirmOk?.addEventListener('click', executeClear);
  confirmBackdrop?.addEventListener('click', (event) => {
    if (event.target === confirmBackdrop) closeConfirmClear();
  });
  filterBtns.forEach((button) => {
    button.addEventListener('click', () => {
      filterBtns.forEach((nextButton) => nextButton.classList.remove('active'));
      button.classList.add('active');
      filter = button.dataset.filter;
      render(historyEvents, runningJobs);
    });
  });
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('visibilitychange', onVisibility);

  start();

  return function cleanup() {
    clearInterval(pollTimer);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('visibilitychange', onVisibility);
    detailBackdrop?.classList.remove('open');
    confirmBackdrop?.classList.remove('open');
    document.body.classList.remove('modal-open');
  };
}

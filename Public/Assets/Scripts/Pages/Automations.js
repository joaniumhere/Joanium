// Window controls
import '../Shared/WindowControls.js';

// Modals
import { initSidebar }       from '../Shared/Sidebar.js';
import { initAboutModal }    from '../Shared/Modals/AboutModal.js';
import { initLibraryModal }  from '../Shared/Modals/LibraryModal.js';
import { initSettingsModal } from '../Shared/Modals/SettingsModal.js';

// Shared modals
const about    = initAboutModal();
const settings = initSettingsModal();

const library = initLibraryModal({
  onChatSelect: (chatId) => {
    if (chatId) localStorage.setItem('ow-pending-chat', chatId);
    window.electronAPI?.launchMain();
  },
});

const sidebar = initSidebar({
  activePage:    'automations',
  onNewChat:     () => window.electronAPI?.launchMain(),
  onLibrary:     () => library.isOpen() ? library.close() : library.open(),
  onAutomations: () => { /* already here */ },
  onSkills:      () => window.electronAPI?.launchSkills?.(),
  onAgents:      () => window.electronAPI?.launchAgents?.(),
  onUsage:       () => window.electronAPI?.launchUsage?.(),
  onSettings:    () => settings.open(),
  onAbout:       () => about.open(),
});

window.addEventListener('ow:user-profile-updated', e => sidebar.setUser(e.detail?.name ?? ''));
settings.loadUser().then(user => sidebar.setUser(user?.name ?? ''));

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateId() {
  return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }


// ─────────────────────────────────────────────
//  DISPLAY FORMATTERS
// ─────────────────────────────────────────────

function formatTrigger(trigger) {
  if (!trigger) return 'Unknown trigger';
  switch (trigger.type) {
    case 'on_startup': return '⚡ On app startup';
    case 'interval':   return `⏱️ Every ${trigger.minutes || 30} min`;
    case 'hourly':     return '⏰ Every hour';
    case 'daily':      return `🌅 Daily at ${trigger.time || '09:00'}`;
    case 'weekly':     return `📅 ${capitalize(trigger.day || 'monday')}s at ${trigger.time || '09:00'}`;
    default:           return trigger.type;
  }
}

function formatActionsSummary(actions = []) {
  if (!actions.length) return 'No actions configured';
  const label = actions.length === 1 ? '1 action' : `${actions.length} actions`;
  const LABELS = {
    open_site:            'open site',
    open_multiple_sites:  'open sites',
    open_folder:          'open folder',
    run_command:          'run command',
    run_script:           'run script',
    open_app:             'open app',
    send_notification:    'notification',
    copy_to_clipboard:    'copy to clipboard',
    write_file:           'write file',
    move_file:            'move file',
    copy_file:            'copy file',
    delete_file:          'delete file',
    create_folder:        'create folder',
    lock_screen:          'lock screen',
    http_request:         'HTTP request',
    gmail_send_email:     '📧 send email',
    gmail_get_brief:      '📧 email brief',
    gmail_get_unread_count: '📧 unread count',
    gmail_search_notify:  '📧 search & notify',
    github_open_repo:     '🐙 open repo',
    github_check_prs:     '🐙 check PRs',
    github_check_issues:  '🐙 check issues',
    github_check_commits: '🐙 check commits',
    github_check_notifs:  '🐙 notifications',
    github_create_issue:  '🐙 create issue',
    github_check_releases:'🐙 check releases',
  };
  const types = [...new Set(actions.map(a => {
    const base = LABELS[a.type] || a.type;
    if (a.type === 'open_folder') return base + (a.openTerminal ? ' + terminal' : '');
    if (a.type === 'run_command') return base + (a.silent ? ' (silent)' : '');
    return base;
  }))];
  return `${label}: ${types.join(', ')}`;
}

function formatLastRun(lastRun) {
  if (!lastRun) return '';
  const d = new Date(lastRun), now = new Date(), diff = now - d;
  const min = 60_000, hour = 3_600_000, day = 86_400_000;
  if (diff < min)  return 'Last run: just now';
  if (diff < hour) return `Last run: ${Math.floor(diff / min)}m ago`;
  if (diff < day)  return `Last run: ${Math.floor(diff / hour)}h ago`;
  return `Last run: ${d.toLocaleDateString()}`;
}


// ─────────────────────────────────────────────
//  ACTION META  (all available actions)
// ─────────────────────────────────────────────

const ACTION_META = {
  // ── System ──────────────────────────────────
  open_site:            { label: '🌐 Open website',            fields: ['url'],                              group: 'System'  },
  open_multiple_sites:  { label: '🌐 Open multiple websites',  fields: ['urls'],                             group: 'System'  },
  open_folder:          { label: '📁 Open folder',              fields: ['path'],                             group: 'System'  },
  run_command:          { label: '⚡ Run command',               fields: ['command'],                          group: 'System'  },
  run_script:           { label: '📜 Run script file',          fields: ['scriptPath', 'args'],               group: 'System'  },
  open_app:             { label: '🚀 Open app',                  fields: ['appPath'],                          group: 'System'  },
  send_notification:    { label: '🔔 Send notification',        fields: ['notifTitle', 'notifBody'],          group: 'System'  },
  copy_to_clipboard:    { label: '📋 Copy to clipboard',        fields: ['text'],                             group: 'System'  },
  write_file:           { label: '📝 Write to file',             fields: ['filePath', 'content'],             group: 'System'  },
  move_file:            { label: '📦 Move / rename file',        fields: ['sourcePath', 'destPath'],           group: 'System'  },
  copy_file:            { label: '🗂️ Copy file',                fields: ['sourcePath', 'destPath'],           group: 'System'  },
  delete_file:          { label: '🗑️ Delete file',              fields: ['filePath'],                         group: 'System'  },
  create_folder:        { label: '📂 Create folder',             fields: ['path'],                             group: 'System'  },
  lock_screen:          { label: '🔒 Lock screen',               fields: [],                                   group: 'System'  },
  http_request:         { label: '🌍 HTTP request / webhook',   fields: ['url', 'httpMethod'],                group: 'System'  },

  // ── Gmail ────────────────────────────────────
  gmail_send_email:       { label: '📧 Send email',             fields: ['to', 'subject', 'gmailBody'],      group: 'Gmail'   },
  gmail_get_brief:        { label: '📧 Email brief (notif)',    fields: ['maxResults'],                       group: 'Gmail'   },
  gmail_get_unread_count: { label: '📧 Unread count notif',    fields: [],                                   group: 'Gmail'   },
  gmail_search_notify:    { label: '📧 Search & notify',        fields: ['query', 'maxResults'],              group: 'Gmail'   },

  // ── GitHub ───────────────────────────────────
  github_open_repo:       { label: '🐙 Open repo in browser',  fields: ['owner', 'repo'],                   group: 'GitHub'  },
  github_check_prs:       { label: '🐙 Check pull requests',   fields: ['owner', 'repo'],                   group: 'GitHub'  },
  github_check_issues:    { label: '🐙 Check issues',          fields: ['owner', 'repo'],                   group: 'GitHub'  },
  github_check_commits:   { label: '🐙 Check recent commits',  fields: ['owner', 'repo', 'maxResults'],     group: 'GitHub'  },
  github_check_releases:  { label: '🐙 Check latest release',  fields: ['owner', 'repo'],                   group: 'GitHub'  },
  github_check_notifs:    { label: '🐙 GitHub notifications',  fields: [],                                   group: 'GitHub'  },
  github_create_issue:    { label: '🐙 Create issue',          fields: ['owner', 'repo', 'issueTitle', 'issueBody', 'labels'], group: 'GitHub' },
};

// ─────────────────────────────────────────────
//  FIELD META
// ─────────────────────────────────────────────

const FIELD_META = {
  url:          { placeholder: 'https://example.com',                                      textarea: false },
  urls:         { placeholder: 'https://example.com\nhttps://github.com\none per line…',  textarea: true  },
  path:         { placeholder: '/Users/you/Documents or C:\\Users\\you',                   textarea: false },
  command:      { placeholder: 'npm run build',                                             textarea: false },
  scriptPath:   { placeholder: '/Users/you/scripts/backup.sh  or  script.py',             textarea: false },
  args:         { placeholder: '--verbose --output /tmp (optional)',                        textarea: false },
  appPath:      { placeholder: '/Applications/VS Code.app  or  C:\\...\\code.exe',        textarea: false },
  notifTitle:   { placeholder: 'Notification title',                                        textarea: false },
  notifBody:    { placeholder: 'Notification body (optional)',                             textarea: false },
  text:         { placeholder: 'Text to copy to clipboard…',                              textarea: false },
  filePath:     { placeholder: '/Users/you/Desktop/output.txt',                           textarea: false },
  content:      { placeholder: 'File content…',                                            textarea: true  },
  sourcePath:   { placeholder: '/Users/you/file.txt',                                      textarea: false },
  destPath:     { placeholder: '/Users/you/moved/file.txt',                                textarea: false },
  httpMethod:   { type: 'select', options: ['GET','POST','PUT','PATCH','DELETE','HEAD'],    textarea: false },
  httpHeaders:  { placeholder: 'Content-Type: application/json\nAuthorization: Bearer …', textarea: true  },
  httpBody:     { placeholder: '{"key": "value"}  or  form=data&key=val',                 textarea: true  },
  clickUrl:     { placeholder: 'https://open-this.com on notification click (optional)',   textarea: false },
  to:           { placeholder: 'recipient@example.com',                                    textarea: false },
  cc:           { placeholder: 'cc@example.com, cc2@example.com (optional)',               textarea: false },
  bcc:          { placeholder: 'bcc@example.com (optional)',                               textarea: false },
  subject:      { placeholder: 'Email subject',                                             textarea: false },
  gmailBody:    { placeholder: 'Email body…',                                              textarea: true  },
  maxResults:   { placeholder: '10',                                                        textarea: false },
  query:        { placeholder: 'from:boss OR subject:urgent',                              textarea: false },
  owner:        { placeholder: 'github-username or org',                                   textarea: false },
  repo:         { placeholder: 'repository-name',                                           textarea: false },
  issueTitle:   { placeholder: 'Bug: something broke in v2.1',                            textarea: false },
  issueBody:    { placeholder: 'Steps to reproduce…',                                     textarea: true  },
  labels:       { placeholder: 'bug, enhancement (comma-separated, optional)',            textarea: false },
  terminalCommand: { placeholder: 'npm run dev  (leave blank to just open terminal)',     textarea: false },
};

const FIELD_LABELS = {
  url: 'URL', urls: 'URLs (one per line)', path: 'Folder path',
  command: 'Command', scriptPath: 'Script path', args: 'Arguments',
  appPath: 'App path', notifTitle: 'Title', notifBody: 'Body',
  text: 'Text', filePath: 'File path', content: 'Content',
  sourcePath: 'Source path', destPath: 'Destination path',
  httpMethod: 'Method', httpHeaders: 'Headers', httpBody: 'Request body',
  clickUrl: 'Open URL on click',
  to: 'To', cc: 'CC', bcc: 'BCC', subject: 'Subject', gmailBody: 'Body',
  maxResults: 'Max results', query: 'Search query',
  owner: 'Owner / org', repo: 'Repository',
  issueTitle: 'Issue title', issueBody: 'Issue body', labels: 'Labels',
  terminalCommand: 'Then run (optional)',
};


// ─────────────────────────────────────────────
//  FIELD BUILDERS
// ─────────────────────────────────────────────

function makeField(fieldKey, value = '') {
  const meta = FIELD_META[fieldKey] ?? { placeholder: '', textarea: false };
  let el;

  if (meta.type === 'select') {
    el = document.createElement('select');
    el.className = 'action-type-select';
    (meta.options || []).forEach(opt => {
      const o = document.createElement('option');
      o.value = opt; o.textContent = opt;
      if (opt === (value || meta.options[0])) o.selected = true;
      el.appendChild(o);
    });
  } else if (meta.textarea) {
    el = document.createElement('textarea');
    el.className = 'action-value-textarea';
    el.rows = 3;
    el.placeholder = meta.placeholder ?? '';
    el.value = value;
  } else {
    el = document.createElement('input');
    el.type = 'text';
    el.className = 'action-value-input';
    el.placeholder = meta.placeholder ?? '';
    el.value = value;
  }
  el.dataset.field = fieldKey;
  return el;
}

/** Wrap a field in a labelled row. */
function makeFieldRow(fieldKey, value = '', hideLabel = false) {
  const wrapper = document.createElement('div');
  wrapper.className = 'action-field-row';
  if (!hideLabel) {
    const lbl = document.createElement('label');
    lbl.className = 'action-field-label';
    lbl.textContent = FIELD_LABELS[fieldKey] ?? fieldKey;
    wrapper.appendChild(lbl);
  }
  wrapper.appendChild(makeField(fieldKey, value));
  return wrapper;
}

/**
 * Build a toggle row that optionally reveals a sub-section when checked.
 * @param {object} opts
 * @param {string}          opts.checkClass   CSS class for the checkbox (used to collect later)
 * @param {boolean}         opts.checked      Initial state
 * @param {string}          opts.icon         Emoji icon
 * @param {string}          opts.labelText    Label text
 * @param {HTMLElement|null} opts.subEl       Element to show/hide (null = no expansion)
 */
function makeToggleRow({ checkClass, checked = false, icon = '', labelText, subEl = null }) {
  const wrap = document.createElement('div');
  wrap.className = 'action-sub-event';

  const label = document.createElement('label');
  label.className = 'action-sub-toggle';

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = `action-sub-check ${checkClass}`;
  if (checked) cb.checked = true;

  const span = document.createElement('span');
  span.className = 'action-sub-toggle-text';
  span.innerHTML = icon ? `${icon} ${escapeHtml(labelText)}` : escapeHtml(labelText);

  label.append(cb, span);
  wrap.appendChild(label);

  if (subEl) {
    if (!checked) subEl.classList.add('hidden');
    cb.addEventListener('change', () => subEl.classList.toggle('hidden', !cb.checked));
    wrap.appendChild(subEl);
  }

  return wrap;
}

/** Connector warning banner. */
function makeConnectorNote(group) {
  const warn = document.createElement('div');
  warn.className = 'action-connector-note';
  warn.textContent = group === 'Gmail'
    ? '⚠ Requires Gmail connected in Settings → Connectors'
    : '⚠ Requires GitHub connected in Settings → Connectors';
  return warn;
}

// ─────────────────────────────────────────────
//  SUB-EVENT RENDERERS  (one per action type)
// ─────────────────────────────────────────────

function appendFolderSubs(fieldsEl, data) {
  const cmdWrap = document.createElement('div');
  cmdWrap.className = 'action-sub-cmd-wrap';
  cmdWrap.appendChild(makeFieldRow('terminalCommand', data.terminalCommand ?? ''));

  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-open-terminal',
    checked:    data.openTerminal ?? false,
    icon: '💻',
    labelText: 'Open terminal here',
    subEl: cmdWrap,
  }));
}

function appendRunCommandSubs(fieldsEl, data) {
  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-silent',
    checked: data.silent ?? false,
    icon: '🔇',
    labelText: 'Run silently (background, no terminal window)',
  }));
  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-notify-finish',
    checked: data.notifyOnFinish ?? false,
    icon: '🔔',
    labelText: 'Send notification when done',
  }));
}

function appendRunScriptSubs(fieldsEl, data) {
  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-silent',
    checked: data.silent ?? false,
    icon: '🔇',
    labelText: 'Run silently (background, no terminal window)',
  }));
  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-notify-finish',
    checked: data.notifyOnFinish ?? false,
    icon: '🔔',
    labelText: 'Send notification when done',
  }));
}

function appendWriteFileSubs(fieldsEl, data) {
  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-append',
    checked: data.append ?? false,
    icon: '➕',
    labelText: 'Append to file (instead of overwrite)',
  }));
}

function appendNotifSubs(fieldsEl, data) {
  const urlWrap = document.createElement('div');
  urlWrap.className = 'action-sub-cmd-wrap';
  urlWrap.appendChild(makeFieldRow('clickUrl', data.clickUrl ?? ''));

  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-click-url',
    checked: !!(data.clickUrl),
    icon: '🔗',
    labelText: 'Open URL when notification is clicked',
    subEl: urlWrap,
  }));
}

function appendHttpSubs(fieldsEl, data) {
  // Headers sub-section
  const headersWrap = document.createElement('div');
  headersWrap.className = 'action-sub-cmd-wrap';
  headersWrap.appendChild(makeFieldRow('httpHeaders', data.headers ?? ''));

  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-http-headers',
    checked: !!(data.headers),
    icon: '📋',
    labelText: 'Custom headers',
    subEl: headersWrap,
  }));

  // Body sub-section
  const bodyWrap = document.createElement('div');
  bodyWrap.className = 'action-sub-cmd-wrap';
  bodyWrap.appendChild(makeFieldRow('httpBody', data.body ?? ''));

  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-http-body',
    checked: !!(data.body),
    icon: '📄',
    labelText: 'Request body',
    subEl: bodyWrap,
  }));

  // Notify on response
  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-http-notify',
    checked: data.notify ?? false,
    icon: '🔔',
    labelText: 'Send notification with response status',
  }));
}

function appendGmailSendSubs(fieldsEl, data) {
  const ccWrap = document.createElement('div');
  ccWrap.className = 'action-sub-cmd-wrap';
  ccWrap.appendChild(makeFieldRow('cc',  data.cc  ?? ''));
  ccWrap.appendChild(makeFieldRow('bcc', data.bcc ?? ''));

  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-email-extra',
    checked: !!(data.cc || data.bcc),
    icon: '👥',
    labelText: 'Add CC / BCC',
    subEl: ccWrap,
  }));
}

function appendGithubCheckSubs(fieldsEl, type, data) {
  // State filter for PRs and issues
  const stateWrap = document.createElement('div');
  stateWrap.className = 'action-sub-cmd-wrap';

  const stateSelect = document.createElement('select');
  stateSelect.className = 'action-type-select';
  stateSelect.dataset.field = 'state';
  ['open','closed','all'].forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = capitalize(s);
    if (s === (data.state || 'open')) o.selected = true;
    stateSelect.appendChild(o);
  });
  const stateRow = document.createElement('div');
  stateRow.className = 'action-field-row';
  const lbl = document.createElement('label');
  lbl.className = 'action-field-label'; lbl.textContent = 'Filter by state';
  stateRow.append(lbl, stateSelect);
  stateWrap.appendChild(stateRow);

  fieldsEl.appendChild(makeToggleRow({
    checkClass: 'sub-filter-state',
    checked: !!(data.state && data.state !== 'open'),
    icon: '🔍',
    labelText: 'Filter by state (default: open)',
    subEl: stateWrap,
  }));
}

function appendDeleteWarning(fieldsEl) {
  const warn = document.createElement('div');
  warn.className = 'action-connector-note';
  warn.style.borderColor = '#f87171';
  warn.textContent = '⚠ This permanently deletes the file. There is no undo.';
  fieldsEl.appendChild(warn);
}


// ─────────────────────────────────────────────
//  MAIN FIELD RENDERER
// ─────────────────────────────────────────────

function renderActionFields(fieldsEl, type, data = {}) {
  fieldsEl.innerHTML = '';
  const meta = ACTION_META[type];
  if (!meta) return;

  // Connector warning
  if (meta.group === 'Gmail' || meta.group === 'GitHub')
    fieldsEl.appendChild(makeConnectorNote(meta.group));

  // Main fields (show label only if action has multiple fields)
  const showLabel = meta.fields.length > 1 || meta.group !== 'System';
  for (const fieldKey of meta.fields) {
    fieldsEl.appendChild(makeFieldRow(fieldKey, data[fieldKey] ?? '', !showLabel));
  }

  // Sub-events per action type
  switch (type) {
    case 'open_folder':        appendFolderSubs(fieldsEl, data);                       break;
    case 'run_command':        appendRunCommandSubs(fieldsEl, data);                   break;
    case 'run_script':         appendRunScriptSubs(fieldsEl, data);                    break;
    case 'write_file':         appendWriteFileSubs(fieldsEl, data);                    break;
    case 'send_notification':  appendNotifSubs(fieldsEl, data);                        break;
    case 'http_request':       appendHttpSubs(fieldsEl, data);                         break;
    case 'gmail_send_email':   appendGmailSendSubs(fieldsEl, data);                    break;
    case 'github_check_prs':
    case 'github_check_issues':appendGithubCheckSubs(fieldsEl, type, data);           break;
    case 'delete_file':        appendDeleteWarning(fieldsEl);                          break;
    default: break;
  }
}


// ─────────────────────────────────────────────
//  ACTION ROW
// ─────────────────────────────────────────────

function createActionRow(action = { type: 'open_site' }) {
  const row = document.createElement('div');
  row.className = 'action-row';

  const topBar = document.createElement('div');
  topBar.className = 'action-row-top';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'action-type-select';

  // Build grouped option list
  const groups = {};
  for (const [value, meta] of Object.entries(ACTION_META)) {
    if (!groups[meta.group]) groups[meta.group] = [];
    groups[meta.group].push({ value, label: meta.label });
  }
  for (const [groupName, items] of Object.entries(groups)) {
    const og = document.createElement('optgroup');
    og.label = groupName;
    for (const { value, label } of items) {
      const opt = document.createElement('option');
      opt.value = value; opt.textContent = label;
      if (value === action.type) opt.selected = true;
      og.appendChild(opt);
    }
    typeSelect.appendChild(og);
  }

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'action-remove-btn';
  removeBtn.title = 'Remove action';
  removeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>`;
  removeBtn.addEventListener('click', () => row.remove());
  topBar.append(typeSelect, removeBtn);

  const fieldsArea = document.createElement('div');
  fieldsArea.className = 'action-fields';
  renderActionFields(fieldsArea, action.type, action);
  typeSelect.addEventListener('change', () => renderActionFields(fieldsArea, typeSelect.value, {}));

  row.append(topBar, fieldsArea);
  return row;
}


// ─────────────────────────────────────────────
//  ACTION COLLECTOR
// ─────────────────────────────────────────────

function collectActionFromRow(row) {
  const type = row.querySelector('.action-type-select')?.value;
  if (!type) return null;

  const get    = (field) => row.querySelector(`[data-field="${field}"]`)?.value?.trim() ?? '';
  const getVal = (field) => row.querySelector(`[data-field="${field}"]`)?.value ?? '';
  const getCb  = (cls)   => row.querySelector(`.${cls}`)?.checked ?? false;

  const action = { type };

  switch (type) {

    // ── System ─────────────────────────────────

    case 'open_site':
      action.url = get('url');
      if (!action.url) return null;
      break;

    case 'open_multiple_sites':
      action.urls = getVal('urls');
      if (!action.urls.trim()) return null;
      break;

    case 'open_folder':
      action.path = get('path');
      if (!action.path) return null;
      action.openTerminal    = getCb('sub-open-terminal');
      action.terminalCommand = get('terminalCommand');
      break;

    case 'run_command':
      action.command = get('command');
      if (!action.command) return null;
      action.silent         = getCb('sub-silent');
      action.notifyOnFinish = getCb('sub-notify-finish');
      break;

    case 'run_script':
      action.scriptPath = get('scriptPath');
      if (!action.scriptPath) return null;
      action.args           = get('args');
      action.silent         = getCb('sub-silent');
      action.notifyOnFinish = getCb('sub-notify-finish');
      break;

    case 'open_app':
      action.appPath = get('appPath');
      if (!action.appPath) return null;
      break;

    case 'send_notification':
      action.title = get('notifTitle');
      if (!action.title) return null;
      action.body = get('notifBody');
      if (getCb('sub-click-url')) action.clickUrl = get('clickUrl');
      break;

    case 'copy_to_clipboard':
      action.text = get('text');
      if (!action.text) return null;
      break;

    case 'write_file':
      action.filePath = get('filePath');
      if (!action.filePath) return null;
      action.content = getVal('content');
      action.append  = getCb('sub-append');
      break;

    case 'move_file':
    case 'copy_file':
      action.sourcePath = get('sourcePath');
      action.destPath   = get('destPath');
      if (!action.sourcePath || !action.destPath) return null;
      break;

    case 'delete_file':
      action.filePath = get('filePath');
      if (!action.filePath) return null;
      break;

    case 'create_folder':
      action.path = get('path');
      if (!action.path) return null;
      break;

    case 'lock_screen':
      // no fields needed
      break;

    case 'http_request':
      action.url    = get('url');
      if (!action.url) return null;
      action.method = get('httpMethod') || 'GET';
      if (getCb('sub-http-headers')) action.headers = getVal('httpHeaders');
      if (getCb('sub-http-body'))    action.body    = getVal('httpBody');
      action.notify = getCb('sub-http-notify');
      break;

    // ── Gmail ──────────────────────────────────

    case 'gmail_send_email':
      action.to      = get('to');
      action.subject = get('subject');
      action.body    = getVal('gmailBody');
      if (!action.to || !action.subject) return null;
      if (getCb('sub-email-extra')) {
        action.cc  = get('cc');
        action.bcc = get('bcc');
      }
      break;

    case 'gmail_get_brief':
      action.maxResults = parseInt(get('maxResults'), 10) || 10;
      break;

    case 'gmail_get_unread_count':
      // no required fields
      break;

    case 'gmail_search_notify':
      action.query      = get('query');
      if (!action.query) return null;
      action.maxResults = parseInt(get('maxResults'), 10) || 5;
      break;

    // ── GitHub ─────────────────────────────────

    case 'github_open_repo':
      action.owner = get('owner');
      action.repo  = get('repo');
      if (!action.owner || !action.repo) return null;
      break;

    case 'github_check_prs':
    case 'github_check_issues':
      action.owner = get('owner');
      action.repo  = get('repo');
      if (!action.owner || !action.repo) return null;
      action.state = getCb('sub-filter-state')
        ? (row.querySelector('[data-field="state"]')?.value || 'open')
        : 'open';
      break;

    case 'github_check_commits':
      action.owner      = get('owner');
      action.repo       = get('repo');
      if (!action.owner || !action.repo) return null;
      action.maxResults = parseInt(get('maxResults'), 10) || 5;
      break;

    case 'github_check_releases':
      action.owner = get('owner');
      action.repo  = get('repo');
      if (!action.owner || !action.repo) return null;
      break;

    case 'github_check_notifs':
      // no required fields
      break;

    case 'github_create_issue':
      action.owner      = get('owner');
      action.repo       = get('repo');
      action.issueTitle = get('issueTitle');
      if (!action.owner || !action.repo || !action.issueTitle) return null;
      action.issueBody  = getVal('issueBody');
      action.labels     = get('labels');
      break;

    default:
      return null;
  }

  return action;
}


// ─────────────────────────────────────────────
//  AUTOMATIONS STATE + RENDER
// ─────────────────────────────────────────────

let automations = [];

const grid      = document.getElementById('auto-grid');
const emptyView = document.getElementById('auto-empty');

function renderAutomations() {
  if (!automations.length) { emptyView.hidden = false; grid.hidden = true; return; }
  emptyView.hidden = true;
  grid.hidden      = false;
  grid.innerHTML   = '';

  automations.forEach(auto => {
    const card = document.createElement('div');
    card.className  = `auto-card${auto.enabled ? '' : ' is-disabled'}`;
    card.dataset.id = auto.id;

    card.innerHTML = `
      <div class="auto-card-head">
        <div class="auto-card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M13 2L4.5 13H11l-1 9L20.5 11H14L13 2z" stroke-linejoin="round" stroke-width="1.6"/>
          </svg>
        </div>
        <div class="auto-card-info">
          <div class="auto-card-name">${escapeHtml(auto.name)}</div>
          ${auto.description ? `<div class="auto-card-desc">${escapeHtml(auto.description)}</div>` : ''}
        </div>
        <label class="auto-toggle" title="${auto.enabled ? 'Enabled — click to disable' : 'Disabled — click to enable'}">
          <input type="checkbox" class="toggle-input" ${auto.enabled ? 'checked' : ''}>
          <div class="auto-toggle-track"></div>
        </label>
      </div>
      <div class="auto-card-meta">
        <span class="auto-card-tag trigger-tag">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7v5l3 3" stroke-linecap="round"/>
          </svg>
          ${escapeHtml(formatTrigger(auto.trigger))}
        </span>
        <div class="auto-card-actions-summary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01" stroke-linecap="round"/>
          </svg>
          ${escapeHtml(formatActionsSummary(auto.actions))}
        </div>
        ${auto.lastRun ? `<div class="auto-card-lastrun">${escapeHtml(formatLastRun(auto.lastRun))}</div>` : ''}
      </div>
      <div class="auto-card-footer">
        <button class="auto-card-btn edit-btn" data-id="${escapeHtml(auto.id)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round"/>
          </svg>
          Edit
        </button>
        <button class="auto-card-btn danger delete-btn" data-id="${escapeHtml(auto.id)}" data-name="${escapeHtml(auto.name)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Delete
        </button>
      </div>`;

    card.querySelector('.toggle-input').addEventListener('change', async e => {
      const enabled = e.target.checked;
      await window.electronAPI?.toggleAutomation?.(auto.id, enabled);
      auto.enabled = enabled;
      card.classList.toggle('is-disabled', !enabled);
    });
    card.querySelector('.edit-btn').addEventListener('click',   () => openModal(auto));
    card.querySelector('.delete-btn').addEventListener('click', () => openConfirm(auto.id, auto.name));

    grid.appendChild(card);
  });
}

async function loadAutomations() {
  try {
    const res = await window.electronAPI?.getAutomations?.();
    automations = Array.isArray(res?.automations) ? res.automations : [];
  } catch { automations = []; }
  renderAutomations();
}


// ─────────────────────────────────────────────
//  CONFIRM DELETE
// ─────────────────────────────────────────────

const confirmOverlay        = document.getElementById('confirm-overlay');
const confirmCancelBtn      = document.getElementById('confirm-cancel');
const confirmDeleteBtn      = document.getElementById('confirm-delete');
const confirmAutomationName = document.getElementById('confirm-automation-name');
let pendingDeleteId = null;

function openConfirm(id, name) {
  pendingDeleteId = id;
  if (confirmAutomationName) confirmAutomationName.textContent = name;
  confirmOverlay?.classList.add('open');
}
function closeConfirm() {
  confirmOverlay?.classList.remove('open');
  pendingDeleteId = null;
}

confirmCancelBtn?.addEventListener('click', closeConfirm);
confirmDeleteBtn?.addEventListener('click', async () => {
  if (!pendingDeleteId) return;
  await window.electronAPI?.deleteAutomation?.(pendingDeleteId);
  automations = automations.filter(a => a.id !== pendingDeleteId);
  closeConfirm();
  renderAutomations();
});
confirmOverlay?.addEventListener('click', e => { if (e.target === confirmOverlay) closeConfirm(); });


// ─────────────────────────────────────────────
//  ADD / EDIT MODAL
// ─────────────────────────────────────────────

const modalBackdrop   = document.getElementById('automation-modal-backdrop');
const modalTitle      = document.getElementById('auto-modal-title-text');
const nameInput       = document.getElementById('auto-name');
const descInput       = document.getElementById('auto-desc');
const actionsList     = document.getElementById('actions-list');
const addActionBtn    = document.getElementById('add-action-btn');
const saveBtn         = document.getElementById('auto-save-btn');
const cancelBtn       = document.getElementById('auto-cancel-btn');
const modalCloseBtn   = document.getElementById('auto-modal-close');

// Trigger elements
const triggerOptions     = document.querySelectorAll('.trigger-option');
const dailyTimeInput     = document.getElementById('daily-time');
const weeklyTimeInput    = document.getElementById('weekly-time');
const weeklyDaySelect    = document.getElementById('weekly-day');
const dailySubInputs     = document.getElementById('daily-sub-inputs');
const weeklySubInputs    = document.getElementById('weekly-sub-inputs');
const intervalSubInputs  = document.getElementById('interval-sub-inputs');
const intervalMinInput   = document.getElementById('interval-minutes');

let editingId = null;

function getSelectedTriggerType() {
  return [...triggerOptions].find(o => o.classList.contains('selected'))?.dataset?.trigger ?? 'on_startup';
}

triggerOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    triggerOptions.forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    updateSubInputVisibility();
  });
});

function updateSubInputVisibility() {
  const type = getSelectedTriggerType();
  dailySubInputs?.classList.toggle('hidden',    type !== 'daily');
  weeklySubInputs?.classList.toggle('hidden',   type !== 'weekly');
  intervalSubInputs?.classList.toggle('hidden', type !== 'interval');
}

function setTriggerOption(type) {
  triggerOptions.forEach(o => o.classList.toggle('selected', o.dataset.trigger === type));
  updateSubInputVisibility();
}

addActionBtn?.addEventListener('click', () => {
  actionsList?.appendChild(createActionRow({ type: 'open_site' }));
});

function collectFormData() {
  const name = nameInput?.value?.trim();
  if (!name) return null;

  const type    = getSelectedTriggerType();
  const trigger = { type };
  if (type === 'interval') trigger.minutes = parseInt(intervalMinInput?.value, 10) || 30;
  if (type === 'daily')    trigger.time    = dailyTimeInput?.value  || '09:00';
  if (type === 'weekly')   { trigger.time = weeklyTimeInput?.value || '09:00'; trigger.day = weeklyDaySelect?.value || 'monday'; }

  const actions = [];
  actionsList?.querySelectorAll('.action-row').forEach(row => {
    const a = collectActionFromRow(row);
    if (a) actions.push(a);
  });

  return {
    id:          editingId ?? generateId(),
    name,
    description: descInput?.value?.trim() || '',
    enabled:     true,
    trigger,
    actions,
    lastRun:     null,
  };
}

function openModal(automation = null) {
  editingId = automation?.id ?? null;
  if (modalTitle) modalTitle.textContent = automation ? 'Edit Automation' : 'New Automation';
  if (nameInput)  nameInput.value  = automation?.name        || '';
  if (descInput)  descInput.value  = automation?.description || '';

  setTriggerOption(automation?.trigger?.type || 'on_startup');
  if (dailyTimeInput)   dailyTimeInput.value   = automation?.trigger?.time    || '09:00';
  if (weeklyTimeInput)  weeklyTimeInput.value  = automation?.trigger?.time    || '09:00';
  if (weeklyDaySelect)  weeklyDaySelect.value  = automation?.trigger?.day     || 'monday';
  if (intervalMinInput) intervalMinInput.value = automation?.trigger?.minutes || 30;

  if (actionsList) {
    actionsList.innerHTML = '';
    const acts = automation?.actions?.length ? automation.actions : [{ type: 'open_site' }];
    acts.forEach(a => actionsList.appendChild(createActionRow(a)));
  }

  modalBackdrop?.classList.add('open');
  document.body.classList.add('modal-open');
  setTimeout(() => nameInput?.focus(), 60);
}

function closeModal() {
  modalBackdrop?.classList.remove('open');
  document.body.classList.remove('modal-open');
  editingId = null;
}

saveBtn?.addEventListener('click', async () => {
  const data = collectFormData();
  if (!data) {
    nameInput?.focus();
    nameInput?.animate(
      [{ borderColor: '#f87171' }, { borderColor: 'var(--border)' }],
      { duration: 1000 },
    );
    return;
  }
  saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
  try {
    const res = await window.electronAPI?.saveAutomation?.(data);
    if (res?.ok) {
      const idx = automations.findIndex(a => a.id === data.id);
      if (idx >= 0) automations[idx] = res.automation ?? data;
      else          automations.push(res.automation ?? data);
      renderAutomations();
      closeModal();
    } else { console.error('[Automations] Save failed:', res?.error); }
  } finally { saveBtn.disabled = false; saveBtn.textContent = 'Save Automation'; }
});

cancelBtn?.addEventListener('click',     closeModal);
modalCloseBtn?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeConfirm(); }
});

document.getElementById('add-automation-header-btn')?.addEventListener('click', () => openModal());
document.getElementById('add-automation-empty-btn')?.addEventListener('click',  () => openModal());

loadAutomations();

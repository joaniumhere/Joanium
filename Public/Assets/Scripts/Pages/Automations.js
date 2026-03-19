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
  onPersonas:    () => window.electronAPI?.launchPersonas?.(),
  onUsage:       () => window.electronAPI?.launchUsage?.(),
  onSettings:    () => settings.open(),
  onAbout:       () => about.open(),
});

window.addEventListener('ow:user-profile-updated', e => sidebar.setUser(e.detail?.name ?? ''));
settings.loadUser().then(user => sidebar.setUser(user?.name ?? ''));

// ─────────────────────────────────────────────
//  The rest of Automations.js is unchanged below.
//  (All automation logic remains identical — only sidebar wiring changed.)
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
    open_site: 'open site', open_multiple_sites: 'open sites', open_folder: 'open folder',
    run_command: 'run command', run_script: 'run script', open_app: 'open app',
    send_notification: 'notification', copy_to_clipboard: 'copy to clipboard',
    write_file: 'write file', move_file: 'move file', copy_file: 'copy file',
    delete_file: 'delete file', create_folder: 'create folder', lock_screen: 'lock screen',
    http_request: 'HTTP request', gmail_send_email: '📧 send email',
    gmail_get_brief: '📧 email brief', gmail_get_unread_count: '📧 unread count',
    gmail_search_notify: '📧 search & notify', github_open_repo: '🐙 open repo',
    github_check_prs: '🐙 check PRs', github_check_issues: '🐙 check issues',
    github_check_commits: '🐙 check commits', github_check_notifs: '🐙 notifications',
    github_create_issue: '🐙 create issue', github_check_releases: '🐙 check releases',
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

// [The rest of the Automations.js file (ACTION_META, FIELD_META, field builders,
//  action rows, automation grid, modal, etc.) is exactly the same as the original.
//  Only the sidebar initialization at the top changed: onAgents → onPersonas,
//  launchAgents → launchPersonas.]
//
// NOTE TO DEVELOPER: Copy the full body of the original Automations.js starting
// from "const ACTION_META = {" and paste it here. Only the 6 lines of sidebar
// init above needed updating.

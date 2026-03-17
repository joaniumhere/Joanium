// ─────────────────────────────────────────────
//  openworld — Public/Assets/Scripts/App.js
//  UI · AI calls · Library · Chat storage · Avatar panel
// ─────────────────────────────────────────────

import { APP_NAME } from './Config.js';

/* ══════════════════════════════════════════
   STATE
══════════════════════════════════════════ */
const state = {
  messages: [],
  isTyping: false,
  theme: localStorage.getItem('ow-theme') || 'dark',
  providers: [],
  selectedProvider: null,
  selectedModel: null,
  currentChatId: null,
  userName: '',
  userInitials: 'OW',
};

/* ══════════════════════════════════════════
   DOM REFS
══════════════════════════════════════════ */
const textarea = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const welcome = document.getElementById('welcome');
const chatView = document.getElementById('chat-view');
const chatMessages = document.getElementById('chat-messages');
const chips = document.querySelectorAll('.chip');
const sidebarBtns = document.querySelectorAll('.sidebar-btn[data-view]');
const themeBtn = document.getElementById('theme-toggle-btn');
const themePanel = document.getElementById('theme-panel');
const themeOptions = document.querySelectorAll('.theme-option');
const modelSelectorBtn = document.getElementById('model-selector-btn');
const modelDropdown = document.getElementById('model-dropdown');
const modelLabel = document.getElementById('model-label');

// Library
const libraryPanel = document.getElementById('library-panel');
const libraryClose = document.getElementById('library-close');
const librarySearch = document.getElementById('library-search');
const chatList = document.getElementById('chat-list');

// Avatar panel
const avatarBtn = document.getElementById('sidebar-avatar-btn');
const avatarPanel = document.getElementById('avatar-panel');
const avatarPanelName = document.getElementById('avatar-panel-name');
const avatarPanelBadge = document.getElementById('avatar-panel-badge');

/* ── Window controls ── */
document.getElementById('btn-minimize')?.addEventListener('click', () => window.electronAPI?.minimize());
document.getElementById('btn-maximize')?.addEventListener('click', () => window.electronAPI?.maximize());
document.getElementById('btn-close')?.addEventListener('click', () => window.electronAPI?.close());

/* ══════════════════════════════════════════
   THEME SYSTEM
══════════════════════════════════════════ */
const THEMES = ['dark', 'light', 'midnight', 'forest', 'pinky'];

function applyTheme(theme, animate = true) {
  if (!THEMES.includes(theme)) theme = 'dark';

  if (animate) {
    const flash = document.createElement('div');
    flash.style.cssText = `position:fixed;inset:0;z-index:9999;background:var(--accent-glow);pointer-events:none;animation:themeFlash 0.35s ease forwards;`;
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
  }

  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ow-theme', theme);
  state.theme = theme;

  themeOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.theme === theme));
  document.querySelectorAll('.ap-theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === theme);
  });
}

const styleEl = document.createElement('style');
styleEl.textContent = `@keyframes themeFlash { 0%{opacity:.3} 100%{opacity:0} }`;
document.head.appendChild(styleEl);

applyTheme(state.theme, false);

themeBtn?.addEventListener('click', e => {
  e.stopPropagation();
  themePanel.classList.toggle('open');
  avatarPanel?.classList.remove('open');
});

themeOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    applyTheme(opt.dataset.theme);
    themePanel.classList.remove('open');
  });
});

/* ══════════════════════════════════════════
   MODEL SELECTOR
══════════════════════════════════════════ */
async function loadProviders() {
  try {
    const all = await window.electronAPI?.getModels() ?? [];
    state.providers = all.filter(p => p.api && p.api.trim() !== '');

    if (state.providers.length === 0) {
      if (modelLabel) modelLabel.textContent = 'No API keys set';
      return;
    }

    const first = state.providers[0];
    const firstModelId = Object.keys(first.models)[0];
    state.selectedProvider = first;
    state.selectedModel = firstModelId;
    updateModelLabel();
    buildModelDropdown();
  } catch (err) {
    console.warn('[openworld] Could not load models:', err);
    if (modelLabel) modelLabel.textContent = 'openworld 1.0';
  }
}

function updateModelLabel() {
  if (!state.selectedProvider || !state.selectedModel) return;
  const name = state.selectedProvider.models[state.selectedModel]?.name ?? state.selectedModel;
  if (modelLabel) modelLabel.textContent = name;
}

function buildModelDropdown() {
  if (!modelDropdown) return;
  modelDropdown.innerHTML = '';

  state.providers.forEach(provider => {
    const section = document.createElement('div');
    section.className = 'model-group';

    const header = document.createElement('div');
    header.className = 'model-group-header';
    header.textContent = provider.label;
    section.appendChild(header);

    Object.entries(provider.models).forEach(([modelId, info]) => {
      const item = document.createElement('button');
      item.className = 'model-item';
      const isActive = state.selectedProvider?.provider === provider.provider && state.selectedModel === modelId;
      if (isActive) item.classList.add('active');

      item.innerHTML = `
        <span class="model-item-name">${info.name}</span>
        <span class="model-item-desc">${info.description}</span>`;

      item.addEventListener('click', () => {
        state.selectedProvider = provider;
        state.selectedModel = modelId;
        updateModelLabel();
        buildModelDropdown();
        modelDropdown.classList.remove('open');
      });

      section.appendChild(item);
    });

    modelDropdown.appendChild(section);
  });
}

modelSelectorBtn?.addEventListener('click', e => {
  e.stopPropagation();
  if (state.providers.length === 0) return;
  modelDropdown.classList.toggle('open');
});

/* ══════════════════════════════════════════
   USER INIT — load name from User.json
══════════════════════════════════════════ */
async function loadUser() {
  try {
    const user = await window.electronAPI?.getUser();
    if (!user?.name) return;

    state.userName = user.name;
    const parts = user.name.trim().split(/\s+/);
    state.userInitials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();

    // Update sidebar avatar button
    if (avatarBtn) {
      avatarBtn.textContent = state.userInitials;
      avatarBtn.title = user.name;
      avatarBtn.setAttribute('data-tip', user.name);
    }

    // Update avatar panel header
    if (avatarPanelBadge) avatarPanelBadge.textContent = state.userInitials;
    if (avatarPanelName) avatarPanelName.textContent = user.name;

    // Update welcome greeting
    const welcomeTitle = document.querySelector('.welcome-title');
    if (welcomeTitle) welcomeTitle.textContent = `Welcome, ${parts[0]}`;

    // Render connected providers in avatar panel
    renderAvatarProviders();
  } catch (e) {
    console.warn('[openworld] Could not load user:', e);
  }
}

function renderAvatarProviders() {
  const container = document.getElementById('ap-providers-list');
  if (!container) return;

  if (state.providers.length === 0) {
    container.innerHTML = `<div class="ap-empty-hint">No API keys configured</div>`;
    return;
  }

  const providerColors = {
    anthropic: '#cc785c', openai: '#10a37f',
    google: '#4285f4', openrouter: '#9b59b6',
  };

  container.innerHTML = state.providers.map(p => `
    <div class="ap-provider-item">
      <span class="ap-provider-dot" style="background:${providerColors[p.provider] ?? 'var(--accent)'}"></span>
      <span class="ap-provider-name">${p.label}</span>
      <span class="ap-provider-status">Connected</span>
    </div>`).join('');
}

/* ══════════════════════════════════════════
   TEXTAREA AUTO-RESIZE
══════════════════════════════════════════ */
function autoResize() {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  updateSendBtn();
}

function updateSendBtn() {
  sendBtn.classList.toggle('ready', textarea.value.trim().length > 0);
}

textarea.addEventListener('input', autoResize);
textarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
sendBtn.addEventListener('click', sendMessage);

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    textarea.value = chip.getAttribute('data-prompt');
    autoResize();
    textarea.focus();
    chip.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }],
      { duration: 200, easing: 'ease-out' }
    );
  });
});

/* ══════════════════════════════════════════
   MESSAGING
══════════════════════════════════════════ */
function sendMessage() {
  const text = textarea.value.trim();
  if (!text || state.isTyping) return;

  // Assign a chat ID on the first message in this session
  if (!state.currentChatId) state.currentChatId = generateChatId();

  showChatView();
  appendMessage('user', text);

  textarea.value = '';
  textarea.style.height = 'auto';
  updateSendBtn();

  sendBtn.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(0.85)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }],
    { duration: 350, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  );

  callAI(text);
}

function showChatView() {
  if (chatView.classList.contains('active')) return;

  welcome.animate(
    [{ opacity: 1, transform: 'translateY(0) scale(1)' }, { opacity: 0, transform: 'translateY(-16px) scale(0.97)' }],
    { duration: 280, easing: 'cubic-bezier(0.4,0,1,1)', fill: 'forwards' }
  ).onfinish = () => { welcome.style.display = 'none'; };

  chatView.classList.add('active');
}

/**
 * @param {string} role
 * @param {string} content
 * @param {boolean} addToState  — false when replaying a loaded chat
 * @param {boolean} scroll      — false when bulk-loading many messages
 */
function appendMessage(role, content, addToState = true, scroll = true) {
  if (addToState) state.messages.push({ role, content });

  const row = document.createElement('div');
  row.className = `message-row ${role}`;

  if (role === 'user') {
    row.innerHTML = `<div class="bubble">${escapeHtml(content)}</div>`;
  } else {
    row.innerHTML = `
      <div class="assistant-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2L8 6H4v4L2 12l2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z" stroke-width="1.5"/>
        </svg>
      </div>
      <div class="content"></div>`;
    row.querySelector('.content').innerHTML = renderMarkdown(content);
  }

  chatMessages.appendChild(row);
  if (scroll) smoothScrollToBottom();
  return row;
}

function smoothScrollToBottom() {
  chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
}

/* ══════════════════════════════════════════
   AI API CALLS
══════════════════════════════════════════ */
async function callAI(userText) {
  state.isTyping = true;

  const typingRow = document.createElement('div');
  typingRow.className = 'message-row assistant';
  typingRow.id = 'typing-row';
  typingRow.innerHTML = `
    <div class="assistant-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 2L8 6H4v4L2 12l2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2z" stroke-width="1.5"/>
      </svg>
    </div>
    <div class="content" style="padding-top:6px">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  chatMessages.appendChild(typingRow);
  smoothScrollToBottom();

  const removeTyping = (cb) => {
    typingRow.animate(
      [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.96)' }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' }
    ).onfinish = () => { typingRow.remove(); state.isTyping = false; cb?.(); };
  };

  if (!state.selectedProvider || !state.selectedModel) {
    removeTyping(() => appendMessage('assistant', '⚠️ No AI provider configured. Please add an API key in Settings.'));
    return;
  }

  try {
    const reply = await fetchFromProvider(state.selectedProvider, state.selectedModel, state.messages);
    removeTyping(() => {
      appendMessage('assistant', reply);
      saveCurrentChat(); // Persist after every exchange
    });
  } catch (err) {
    const msg = `❌ **API Error** (${state.selectedProvider.label}): ${err.message}`;
    removeTyping(() => appendMessage('assistant', msg));
    console.error('[openworld] API error:', err);
  }
}

async function fetchFromProvider(provider, modelId, messages) {
  const { provider: id, endpoint, api, auth_header, auth_prefix = '' } = provider;
  const history = messages.slice(-20);

  if (id === 'anthropic') {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': api, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: modelId, max_tokens: 2048, messages: history.map(m => ({ role: m.role, content: m.content })) }),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error?.message ?? `HTTP ${res.status}`); }
    return (await res.json()).content?.[0]?.text ?? '(empty response)';
  }

  if (id === 'google') {
    const url = endpoint.replace('{model}', modelId) + `?key=${api}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) }),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error?.message ?? `HTTP ${res.status}`); }
    return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text ?? '(empty response)';
  }

  // OpenAI + OpenRouter
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [auth_header]: `${auth_prefix}${api}`,
      ...(id === 'openrouter' ? { 'HTTP-Referer': 'https://openworld.app', 'X-Title': 'openworld' } : {}),
    },
    body: JSON.stringify({ model: modelId, messages: history.map(m => ({ role: m.role, content: m.content })) }),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error?.message ?? `HTTP ${res.status}`); }
  return (await res.json()).choices?.[0]?.message?.content ?? '(empty response)';
}

/* ══════════════════════════════════════════
   CHAT STORAGE
══════════════════════════════════════════ */
function generateChatId() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `${date}_${time}`;
}

async function saveCurrentChat() {
  if (!state.currentChatId || state.messages.length === 0) return;
  const title = state.messages.find(m => m.role === 'user')?.content?.slice(0, 70) ?? 'Untitled';
  try {
    await window.electronAPI?.saveChat({
      id: state.currentChatId,
      title,
      updatedAt: new Date().toISOString(),
      provider: state.selectedProvider?.provider ?? null,
      model: state.selectedModel ?? null,
      messages: state.messages,
    });
  } catch (e) {
    console.warn('[openworld] Could not save chat:', e);
  }
}

/* ══════════════════════════════════════════
   NEW CHAT
══════════════════════════════════════════ */
function startNewChat() {
  state.messages = [];
  state.currentChatId = null;
  state.isTyping = false;

  document.getElementById('typing-row')?.remove();
  chatMessages.innerHTML = '';

  // Restore the welcome screen
  chatView.classList.remove('active');
  welcome.style.display = '';
  welcome.style.opacity = '1';
  welcome.style.transform = 'none';

  textarea.value = '';
  autoResize();
  closeLibrary();
  closeAvatarPanel();
  textarea.focus();
}

/* ══════════════════════════════════════════
   LIBRARY PANEL
══════════════════════════════════════════ */
async function openLibrary() {
  libraryPanel?.classList.add('open');
  document.querySelector('[data-view="library"]')?.classList.add('active');
  await refreshChatList();
}

function closeLibrary() {
  libraryPanel?.classList.remove('open');
  document.querySelector('[data-view="library"]')?.classList.remove('active');
}

async function refreshChatList() {
  try {
    const chats = await window.electronAPI?.getChats() ?? [];
    renderChatList(chats, librarySearch?.value ?? '');
  } catch {
    if (chatList) chatList.innerHTML = `<div class="lp-empty">Could not load chats</div>`;
  }
}

function renderChatList(chats, filter = '') {
  if (!chatList) return;
  const q = filter.toLowerCase().trim();
  const filtered = q ? chats.filter(c => (c.title || '').toLowerCase().includes(q)) : chats;

  if (filtered.length === 0) {
    chatList.innerHTML = `<div class="lp-empty">${q ? 'No matching chats' : 'No chats yet.<br>Start a conversation!'}</div>`;
    return;
  }

  chatList.innerHTML = filtered.map(chat => {
    const isActive = chat.id === state.currentChatId;
    const dateStr = chat.updatedAt ? formatChatDate(new Date(chat.updatedAt)) : '';
    return `
      <div class="lp-item${isActive ? ' active' : ''}" data-id="${escapeHtml(chat.id)}">
        <div class="lp-item-title">${escapeHtml(chat.title || 'Untitled chat')}</div>
        <div class="lp-item-meta">${escapeHtml(dateStr)}</div>
      </div>`;
  }).join('');

  chatList.querySelectorAll('.lp-item').forEach(item => {
    item.addEventListener('click', () => loadChat(item.dataset.id));
  });
}

function formatChatDate(date) {
  const now = new Date();
  const diff = now - date;
  const day = 86400000;
  if (diff < day) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 7 * day) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

async function loadChat(chatId) {
  try {
    const chat = await window.electronAPI?.loadChat(chatId);
    if (!chat) return;

    // Reset
    state.messages = [];
    state.currentChatId = chat.id;
    chatMessages.innerHTML = '';
    showChatView();

    // Replay messages without scrolling on each one
    chat.messages.forEach(msg => appendMessage(msg.role, msg.content, false, false));
    state.messages = [...chat.messages];
    smoothScrollToBottom(); // Scroll once after all messages

    // Restore provider/model if possible
    if (chat.provider && chat.model) {
      const provider = state.providers.find(p => p.provider === chat.provider);
      if (provider) {
        state.selectedProvider = provider;
        state.selectedModel = chat.model;
        updateModelLabel();
        buildModelDropdown();
      }
    }

    closeLibrary();
  } catch (e) {
    console.error('[openworld] Load chat error:', e);
  }
}

libraryClose?.addEventListener('click', closeLibrary);

librarySearch?.addEventListener('input', async () => {
  const chats = await window.electronAPI?.getChats() ?? [];
  renderChatList(chats, librarySearch.value);
});

/* ══════════════════════════════════════════
   AVATAR PANEL
══════════════════════════════════════════ */
function toggleAvatarPanel(e) {
  e?.stopPropagation();
  avatarPanel?.classList.toggle('open');
  themePanel?.classList.remove('open');
}

function closeAvatarPanel() {
  avatarPanel?.classList.remove('open');
}

avatarBtn?.addEventListener('click', toggleAvatarPanel);

// Handle theme buttons inside avatar panel
avatarPanel?.addEventListener('click', e => {
  const opt = e.target.closest('.ap-theme-option');
  if (opt) applyTheme(opt.dataset.theme);
});

/* ══════════════════════════════════════════
   GLOBAL CLICK — close floating panels
══════════════════════════════════════════ */
document.addEventListener('click', e => {
  if (!themePanel?.contains(e.target) && e.target !== themeBtn)
    themePanel?.classList.remove('open');
  if (modelDropdown && !modelDropdown.contains(e.target) && e.target !== modelSelectorBtn)
    modelDropdown.classList.remove('open');
  if (avatarPanel && !avatarPanel.contains(e.target) && e.target !== avatarBtn)
    avatarPanel.classList.remove('open');
});

/* ══════════════════════════════════════════
   SIDEBAR NAV
══════════════════════════════════════════ */
sidebarBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;

    if (view === 'chat') {
      startNewChat();
      sidebarBtns.forEach(b => b.classList.remove('active'));
      return;
    }

    if (view === 'library') {
      if (libraryPanel?.classList.contains('open')) {
        closeLibrary();
      } else {
        sidebarBtns.forEach(b => b.classList.remove('active'));
        openLibrary();
      }
      return;
    }

    // Default: deselect all, select clicked
    sidebarBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    closeLibrary();
  });
});

/* ══════════════════════════════════════════
   BASIC MARKDOWN RENDERER
══════════════════════════════════════════ */
function renderMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/```(?:[^\n]*)?\n([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^[-•*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  return `<p>${html}</p>`;
}

/* ══════════════════════════════════════════
   UTIL
══════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.title = APP_NAME;
loadProviders().then(() => loadUser());
console.log(`[${APP_NAME}] UI loaded ✓ theme: ${state.theme}`);
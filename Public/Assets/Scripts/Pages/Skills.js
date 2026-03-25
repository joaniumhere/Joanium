let skillsGrid = null;
let skillsEmpty = null;
let searchWrapper = null;
let searchInput = null;
let searchClearBtn = null;
let countEl = null;
let enabledCountEl = null;
let enableAllBtn = null;
let disableAllBtn = null;
let modalBackdrop = null;
let modalName = null;
let modalContent = null;
let modalCloseBtn = null;

let _allSkills = [];
let _confirmResolve = null;

const CONFIRM_STYLE_ID = 'skills-confirm-style';

function getHTML() {
  return /* html */`
<main id="main">
  <div class="skills-main">
    <div class="skills-scroll">
      <div class="skills-page-header">
        <div class="skills-page-header-copy">
          <h2>Skills</h2>
          <p>Enable skills to add specialised capabilities to every chat. Disabled skills are never injected into the AI context.</p>
        </div>

        <div class="skills-header-actions">
          <span id="skills-count" class="page-count">0 skills</span>
          <span id="skills-enabled-count" class="skills-enabled-count">None active</span>
          <button id="skills-enable-all" class="skills-bulk-btn skills-bulk-btn--enable" disabled>Enable all</button>
          <button id="skills-disable-all" class="skills-bulk-btn" disabled>Disable all</button>
        </div>
      </div>

      <div id="skills-search-wrapper" class="page-search-wrapper" hidden>
        <div class="page-search-box">
          <svg class="page-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="7" />
            <path d="M16.5 16.5L21 21" stroke-linecap="round" />
          </svg>
          <input type="text" id="skills-search" class="page-search-input" placeholder="Search skills..." autocomplete="off" spellcheck="false" />
          <button id="skills-search-clear" class="page-search-clear" type="button" aria-label="Clear search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div id="skills-empty" class="page-empty" hidden>
        <div class="page-empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <h3>No skills yet</h3>
        <p>Add <code>.md</code> files to your <code>Skills/</code> folder with <code>name:</code>, <code>trigger:</code>, and <code>description:</code> frontmatter to get started.</p>
      </div>

      <div id="skills-grid" class="skills-grid" hidden></div>
    </div>
  </div>
</main>

<div id="skill-modal-backdrop">
  <div id="skill-modal">
    <div class="skill-modal-header">
      <div class="skill-modal-title-group">
        <div class="skill-modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="skill-modal-name" id="skill-modal-name">Skill</div>
      </div>
      <button class="settings-modal-close" id="skill-modal-close" type="button" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
        </svg>
      </button>
    </div>
    <div class="skill-modal-body">
      <div class="skill-modal-content" id="skill-modal-content"></div>
    </div>
  </div>
</div>
`;
}

function injectConfirmDialog() {
  if (document.getElementById('skills-confirm-backdrop')) return;

  const el = document.createElement('div');
  el.innerHTML = `
    <div id="skills-confirm-backdrop">
      <div class="skills-confirm-box">
        <div class="skills-confirm-icon" id="skills-confirm-icon"></div>
        <h3 id="skills-confirm-title"></h3>
        <p id="skills-confirm-body"></p>
        <div class="skills-confirm-actions">
          <button class="skills-confirm-btn skills-confirm-btn--cancel" id="skills-confirm-cancel">Cancel</button>
          <button class="skills-confirm-btn skills-confirm-btn--ok" id="skills-confirm-ok"></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el.firstElementChild);

  if (!document.getElementById(CONFIRM_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = CONFIRM_STYLE_ID;
    style.textContent = `
      #skills-confirm-backdrop {
        position: fixed; inset: 0;
        display: flex; align-items: center; justify-content: center;
        padding: 32px;
        background: rgba(8,11,18,0.55);
        backdrop-filter: blur(12px);
        z-index: 500;
        opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease;
      }
      #skills-confirm-backdrop.open {
        opacity: 1; pointer-events: auto;
      }
      .skills-confirm-box {
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 32px 28px 26px;
        width: min(400px, calc(100vw - 48px));
        box-shadow: 0 32px 96px rgba(0,0,0,0.32);
        transform: translateY(16px) scale(0.95);
        transition: transform 0.28s var(--ease-spring);
        display: flex; flex-direction: column; align-items: center;
        text-align: center; gap: 0;
      }
      #skills-confirm-backdrop.open .skills-confirm-box {
        transform: translateY(0) scale(1);
      }
      .skills-confirm-icon {
        width: 52px; height: 52px; border-radius: 15px;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 16px; flex-shrink: 0;
      }
      .skills-confirm-icon--enable {
        background: var(--accent-dim);
        border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
        color: var(--accent);
      }
      .skills-confirm-icon--disable {
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        color: var(--text-muted);
      }
      #skills-confirm-title {
        font-size: 17px; font-weight: 600;
        color: var(--text-primary); margin: 0 0 10px;
      }
      #skills-confirm-body {
        font-size: 13px; color: var(--text-secondary);
        line-height: 1.6; margin: 0 0 26px; max-width: 300px;
      }
      .skills-confirm-actions {
        display: flex; gap: 10px; width: 100%;
      }
      .skills-confirm-btn {
        flex: 1; padding: 10px;
        border-radius: 12px;
        font-family: var(--font-ui); font-size: 13px; font-weight: 600;
        cursor: pointer; border: none;
        transition: opacity 0.15s, transform 0.1s, background 0.15s;
      }
      .skills-confirm-btn:hover { opacity: 0.88; }
      .skills-confirm-btn:active { transform: scale(0.97); }
      .skills-confirm-btn--cancel {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border);
      }
      .skills-confirm-btn--cancel:hover { background: var(--bg-hover); opacity: 1; }
      .skills-confirm-btn--ok--enable {
        background: var(--accent); color: #fff;
        box-shadow: 0 4px 14px var(--accent-glow);
      }
      .skills-confirm-btn--ok--disable {
        background: var(--bg-hover); color: var(--text-primary);
        border: 1px solid var(--border);
      }
    `;
    document.head.appendChild(style);
  }

  document.getElementById('skills-confirm-cancel')?.addEventListener('click', closeConfirm);
  document.getElementById('skills-confirm-backdrop')?.addEventListener('click', event => {
    if (event.target.id === 'skills-confirm-backdrop') closeConfirm();
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdown(raw) {
  let text = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/```([\s\S]*?)```/g, (_match, inner) => {
    const newlineIndex = inner.indexOf('\n');
    const code = newlineIndex >= 0 ? inner.slice(newlineIndex + 1) : inner;
    return `</p><pre><code>${code}</code></pre><p>`;
  });
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '</p><h3>$1</h3><p>');
  html = html.replace(/^## (.+)$/gm, '</p><h2>$1</h2><p>');
  html = html.replace(/^# (.+)$/gm, '</p><h1>$1</h1><p>');
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  html = `<p>${html}</p>`;
  html = html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');
  html = html.replace(/<p>\s*<\/p>/g, '').replace(/<p><br><\/p>/g, '');
  return html;
}

function matchesSearch(skill, query) {
  if (!query) return true;
  const lowerQuery = query.toLowerCase();
  return [skill.name, skill.trigger, skill.description, skill.body, skill.filename]
    .join(' ')
    .toLowerCase()
    .includes(lowerQuery);
}

function updateCounts() {
  const total = _allSkills.length;
  const enabled = _allSkills.filter(skill => skill.enabled).length;

  if (countEl) countEl.textContent = `${total} skill${total !== 1 ? 's' : ''}`;

  if (enabledCountEl) {
    enabledCountEl.textContent = enabled === 0 ? 'None active' : `${enabled} active`;
    enabledCountEl.classList.toggle('skills-enabled-count--active', enabled > 0);
  }

  if (enableAllBtn) enableAllBtn.disabled = enabled === total;
  if (disableAllBtn) disableAllBtn.disabled = enabled === 0;
}

async function handleToggle(filename, newEnabled) {
  const skill = _allSkills.find(entry => entry.filename === filename);
  if (skill) skill.enabled = newEnabled;
  updateCounts();

  const result = await window.electronAPI?.toggleSkill?.(filename, newEnabled);
  if (!result?.ok) {
    if (skill) skill.enabled = !newEnabled;
    render(searchInput?.value?.trim() ?? '');
    console.error('[Skills] Toggle failed:', result?.error);
  }
}

function openModal(skill) {
  if (!modalName || !modalContent || !modalBackdrop) return;
  modalName.textContent = skill.name;
  modalContent.innerHTML = renderMarkdown(skill.raw);
  modalBackdrop.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modalBackdrop?.classList.remove('open');
  document.body.classList.remove('modal-open');
}

function closeConfirm() {
  document.getElementById('skills-confirm-backdrop')?.classList.remove('open');
  document.body.classList.remove('modal-open');
  _confirmResolve?.(false);
  _confirmResolve = null;
}

function openConfirm({ type }) {
  injectConfirmDialog();

  const backdrop = document.getElementById('skills-confirm-backdrop');
  const iconEl = document.getElementById('skills-confirm-icon');
  const titleEl = document.getElementById('skills-confirm-title');
  const bodyEl = document.getElementById('skills-confirm-body');
  const okBtn = document.getElementById('skills-confirm-ok');

  if (!backdrop || !iconEl || !titleEl || !bodyEl || !okBtn) {
    return Promise.resolve(false);
  }

  if (type === 'enable') {
    iconEl.className = 'skills-confirm-icon skills-confirm-icon--enable';
    iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="26" height="26">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    titleEl.textContent = 'Enable all skills?';
    bodyEl.textContent = `This will activate all ${_allSkills.length} skill${_allSkills.length !== 1 ? 's' : ''} and inject them into every AI conversation.`;
    okBtn.className = 'skills-confirm-btn skills-confirm-btn--ok skills-confirm-btn--ok--enable';
    okBtn.textContent = 'Enable all';
  } else {
    iconEl.className = 'skills-confirm-icon skills-confirm-icon--disable';
    iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="26" height="26">
      <circle cx="12" cy="12" r="10"/>
      <path d="M4.93 4.93l14.14 14.14" stroke-linecap="round"/>
    </svg>`;
    titleEl.textContent = 'Disable all skills?';
    bodyEl.textContent = `This will deactivate all ${_allSkills.filter(skill => skill.enabled).length} active skill${_allSkills.filter(skill => skill.enabled).length !== 1 ? 's' : ''}. The AI will no longer use them.`;
    okBtn.className = 'skills-confirm-btn skills-confirm-btn--ok skills-confirm-btn--ok--disable';
    okBtn.textContent = 'Disable all';
  }

  backdrop.classList.add('open');
  document.body.classList.add('modal-open');

  return new Promise(resolve => {
    _confirmResolve = resolve;
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.replaceWith(newOkBtn);
    newOkBtn.addEventListener('click', () => {
      _confirmResolve = null;
      closeConfirm();
      resolve(true);
    });
  });
}

function buildSkillCard(skill) {
  const card = document.createElement('div');
  card.className = `skill-card${skill.enabled ? ' skill-card--enabled' : ''}`;
  card.dataset.filename = skill.filename;

  card.innerHTML = `
    <div class="skill-card-head">
      <div class="skill-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="skill-card-title-group">
        <div class="skill-name">${escapeHtml(skill.name)}</div>
        <span class="skill-badge">Skill</span>
      </div>
      <label class="skill-toggle" title="${skill.enabled ? 'Disable this skill' : 'Enable this skill'}">
        <input type="checkbox" class="skill-toggle-input" ${skill.enabled ? 'checked' : ''} />
        <span class="skill-toggle-track"></span>
      </label>
    </div>
    ${skill.trigger ? `
      <div class="skill-trigger">
        <span class="skill-trigger-label">When</span>
        <span>${escapeHtml(skill.trigger)}</span>
      </div>` : ''}
    ${skill.description ? `
      <div class="skill-description">${escapeHtml(skill.description)}</div>` : ''}
    <div class="skill-card-footer">
      <button class="skill-read-btn" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Read
      </button>
    </div>`;

  const toggleInput = card.querySelector('.skill-toggle-input');
  const toggleLabel = card.querySelector('.skill-toggle');

  toggleLabel?.addEventListener('click', event => event.stopPropagation());
  toggleInput?.addEventListener('change', async event => {
    const newEnabled = event.target.checked;
    if (toggleLabel) toggleLabel.title = newEnabled ? 'Disable this skill' : 'Enable this skill';
    card.classList.toggle('skill-card--enabled', newEnabled);
    await handleToggle(skill.filename, newEnabled);
  });

  card.addEventListener('click', event => {
    if (event.target.closest('.skill-toggle')) return;
    openModal(skill);
  });

  card.querySelector('.skill-read-btn')?.addEventListener('click', event => {
    event.stopPropagation();
    openModal(skill);
  });

  return card;
}

function render(query = '') {
  const filtered = _allSkills.filter(skill => matchesSearch(skill, query));
  updateCounts();

  if (_allSkills.length === 0) {
    skillsEmpty.hidden = false;
    skillsGrid.hidden = true;
    searchWrapper.hidden = true;
    return;
  }

  skillsEmpty.hidden = true;
  searchWrapper.hidden = false;
  skillsGrid.hidden = false;
  skillsGrid.innerHTML = '';

  if (filtered.length === 0) {
    const noResults = document.createElement('div');
    noResults.className = 'skills-no-results';
    noResults.textContent = `No skills match "${query}"`;
    skillsGrid.appendChild(noResults);
    return;
  }

  filtered.forEach(skill => skillsGrid.appendChild(buildSkillCard(skill)));
}

async function load() {
  try {
    const result = await window.electronAPI?.getSkills?.();
    _allSkills = result?.skills ?? [];
  } catch (error) {
    console.error('[Skills] Load error:', error);
    _allSkills = [];
  }

  render(searchInput?.value?.trim() ?? '');
}

export function mount(outlet) {
  outlet.innerHTML = getHTML();

  skillsGrid = document.getElementById('skills-grid');
  skillsEmpty = document.getElementById('skills-empty');
  searchWrapper = document.getElementById('skills-search-wrapper');
  searchInput = document.getElementById('skills-search');
  searchClearBtn = document.getElementById('skills-search-clear');
  countEl = document.getElementById('skills-count');
  enabledCountEl = document.getElementById('skills-enabled-count');
  enableAllBtn = document.getElementById('skills-enable-all');
  disableAllBtn = document.getElementById('skills-disable-all');
  modalBackdrop = document.getElementById('skill-modal-backdrop');
  modalName = document.getElementById('skill-modal-name');
  modalContent = document.getElementById('skill-modal-content');
  modalCloseBtn = document.getElementById('skill-modal-close');

  _allSkills = [];
  closeConfirm();

  const onModalClose = () => closeModal();
  const onModalBackdropClick = event => {
    if (event.target === modalBackdrop) closeModal();
  };
  const onKeydown = event => {
    if (event.key === 'Escape') {
      closeModal();
      closeConfirm();
    }
  };
  const onSearchInput = () => {
    const query = searchInput?.value.trim() ?? '';
    render(query);
    searchClearBtn?.classList.toggle('visible', (searchInput?.value.length ?? 0) > 0);
  };
  const onSearchClear = () => {
    if (searchInput) searchInput.value = '';
    searchClearBtn?.classList.remove('visible');
    render('');
    searchInput?.focus();
  };
  const onEnableAll = async () => {
    const confirmed = await openConfirm({ type: 'enable' });
    if (!confirmed || !enableAllBtn) return;

    enableAllBtn.disabled = true;
    const result = await window.electronAPI?.enableAllSkills?.();
    if (result?.ok !== false) {
      _allSkills.forEach(skill => { skill.enabled = true; });
      render(searchInput?.value?.trim() ?? '');
    }
  };
  const onDisableAll = async () => {
    const confirmed = await openConfirm({ type: 'disable' });
    if (!confirmed || !disableAllBtn) return;

    disableAllBtn.disabled = true;
    const result = await window.electronAPI?.disableAllSkills?.();
    if (result?.ok !== false) {
      _allSkills.forEach(skill => { skill.enabled = false; });
      render(searchInput?.value?.trim() ?? '');
    }
  };

  modalCloseBtn?.addEventListener('click', onModalClose);
  modalBackdrop?.addEventListener('click', onModalBackdropClick);
  searchInput?.addEventListener('input', onSearchInput);
  searchClearBtn?.addEventListener('click', onSearchClear);
  enableAllBtn?.addEventListener('click', onEnableAll);
  disableAllBtn?.addEventListener('click', onDisableAll);
  document.addEventListener('keydown', onKeydown);

  load();

  return function cleanup() {
    closeModal();
    closeConfirm();
    modalCloseBtn?.removeEventListener('click', onModalClose);
    modalBackdrop?.removeEventListener('click', onModalBackdropClick);
    searchInput?.removeEventListener('input', onSearchInput);
    searchClearBtn?.removeEventListener('click', onSearchClear);
    enableAllBtn?.removeEventListener('click', onEnableAll);
    disableAllBtn?.removeEventListener('click', onDisableAll);
    document.removeEventListener('keydown', onKeydown);

    skillsGrid = null;
    skillsEmpty = null;
    searchWrapper = null;
    searchInput = null;
    searchClearBtn = null;
    countEl = null;
    enabledCountEl = null;
    enableAllBtn = null;
    disableAllBtn = null;
    modalBackdrop = null;
    modalName = null;
    modalContent = null;
    modalCloseBtn = null;
  };
}

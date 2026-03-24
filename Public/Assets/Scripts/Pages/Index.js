import { APP_NAME } from '../Shared/Config.js';
import { state } from '../Shared/State.js';
import {
  textarea, sendBtn, chips,
  modelDropdown, modelSelectorBtn,
  projectContextBar, projectContextTitle, projectContextPath, projectContextInfo,
  projectOpenFolderBtn, projectExitBtn,
} from '../Shared/DOM.js';

import '../Shared/WindowControls.js';

import { fetchWithTools } from '../Features/AI/AIProvider.js';

import { initSidebar } from '../Shared/Sidebar.js';
import { initAboutModal } from '../Shared/Modals/AboutModal.js';
import { initLibraryModal } from '../Shared/Modals/LibraryModal.js';
import { initProjectsModal } from '../Shared/Modals/ProjectsModal.js';
import { initSettingsModal } from '../Shared/Modals/SettingsModal.js';

import {
  init as initModelSelector,
  loadProviders,
  updateModelLabel,
  buildModelDropdown,
  notifyModelSelectionChanged,
} from '../Features/ModelSelector/ModelSelector.js';
import {
  init as initComposer,
  syncCapabilities,
  addAttachments,
  syncWorkspacePickerVisibility,
} from '../Features/Composer/Composer.js';
import {
  sendMessage, startNewChat, loadChat,
  setSendBtnUpdater, stopGeneration,
} from '../Features/Chat/Chat.js';
import { initTerminalObserver } from '../Features/Chat/TerminalComponent.js';

const about = initAboutModal();
const settings = initSettingsModal();

let sidebar = null;
let library = null;
let projects = null;

const missingProjectBackdrop = document.getElementById('project-missing-backdrop');
const missingProjectCopy = document.getElementById('project-missing-copy');
const missingProjectCancelBtn = document.getElementById('project-missing-cancel');
const missingProjectRemoveBtn = document.getElementById('project-missing-remove');
const missingProjectLocateBtn = document.getElementById('project-missing-locate');

function activeSidebarPage() {
  return state.activeProject ? 'projects' : 'chat';
}

function closeTransientPanels() {
  library?.close();
  projects?.close();
  settings.close();
}

function emitProjectChanged() {
  window.dispatchEvent(new CustomEvent('ow:project-changed', {
    detail: { project: state.activeProject },
  }));
}

function syncProjectUI() {
  const project = state.activeProject;

  if (projectContextBar) {
    projectContextBar.hidden = !project;
  }

  if (project) {
    if (projectContextTitle) projectContextTitle.textContent = project.name;
    if (projectContextPath) projectContextPath.textContent = project.rootPath;
    if (projectContextInfo) {
      projectContextInfo.textContent = project.context?.trim()
        || 'The AI will use this folder as the default workspace and can inspect files and folders here.';
    }
    textarea.placeholder = `Message ${project.name}`;
  } else {
    if (projectContextTitle) projectContextTitle.textContent = 'Project';
    if (projectContextPath) projectContextPath.textContent = '';
    if (projectContextInfo) projectContextInfo.textContent = '';
    textarea.placeholder = 'How can I help you today?';
  }

  syncWorkspacePickerVisibility();
  sidebar?.setActivePage(activeSidebarPage());
}

function resetConversationView() {
  startNewChat(() => closeTransientPanels());
  syncProjectUI();
}

async function leaveProject() {
  state.activeProject = null;
  state.workspacePath = null;
  resetConversationView();
  emitProjectChanged();
}

async function showMissingProjectDialog(project) {
  if (!missingProjectBackdrop || !missingProjectCopy) return null;

  missingProjectCopy.textContent =
    `The folder for "${project.name}" is missing from ${project.rootPath}. ` +
    'Locate the moved folder or remove the saved project.';

  missingProjectBackdrop.classList.add('open');

  return new Promise(resolve => {
    const close = value => {
      missingProjectBackdrop.classList.remove('open');
      missingProjectCancelBtn.onclick = null;
      missingProjectRemoveBtn.onclick = null;
      missingProjectLocateBtn.onclick = null;
      missingProjectBackdrop.onclick = null;
      resolve(value);
    };

    missingProjectCancelBtn.onclick = () => close(null);

    missingProjectRemoveBtn.onclick = async () => {
      const result = await window.electronAPI?.deleteProject?.(project.id);
      if (!result?.ok) {
        close(null);
        return;
      }

      if (state.activeProject?.id === project.id) {
        await leaveProject();
      }

      await projects?.refreshProjects?.();
      close('removed');
    };

    missingProjectLocateBtn.onclick = async () => {
      const selected = await window.electronAPI?.selectDirectory?.({ defaultPath: project.rootPath });
      if (!selected?.ok || !selected.path) return;

      const updated = await window.electronAPI?.updateProject?.(project.id, {
        rootPath: selected.path,
        lastOpenedAt: new Date().toISOString(),
      });

      if (!updated?.ok || !updated.project) {
        close(null);
        return;
      }

      await projects?.refreshProjects?.();
      close(updated.project);
    };

    missingProjectBackdrop.onclick = event => {
      if (event.target === missingProjectBackdrop) close(null);
    };
  });
}

async function openProject(project) {
  const validation = await window.electronAPI?.validateProject?.(project.id);
  if (!validation?.ok || !validation.project) return false;

  let nextProject = validation.project;

  if (!validation.folderExists) {
    const resolved = await showMissingProjectDialog(nextProject);
    if (!resolved || resolved === 'removed') return false;
    nextProject = resolved;
  } else {
    const touched = await window.electronAPI?.updateProject?.(nextProject.id, {
      lastOpenedAt: new Date().toISOString(),
    });
    if (touched?.ok && touched.project) nextProject = touched.project;
  }

  state.activeProject = nextProject;
  state.workspacePath = nextProject.rootPath;
  resetConversationView();
  emitProjectChanged();
  await projects?.refreshProjects?.();
  return true;
}

library = initLibraryModal({
  onChatSelect: chatId => loadChat(chatId, {
    updateModelLabel,
    buildModelDropdown,
    notifyModelSelectionChanged,
  }),
});

projects = initProjectsModal({
  onProjectOpen: openProject,
  onProjectRemoved: async () => {
    await leaveProject();
  },
  onClose: () => {
    sidebar?.setActivePage(activeSidebarPage());
  },
});

sidebar = initSidebar({
  activePage: 'chat',
  onNewChat: resetConversationView,
  onLibrary: () => library.isOpen() ? library.close() : library.open(),
  onProjects: () => {
    if (projects.isOpen()) {
      projects.close();
      sidebar.setActivePage(activeSidebarPage());
      return;
    }
    closeTransientPanels();
    projects.open();
    sidebar.setActivePage('projects');
  },
  onAutomations: () => window.electronAPI?.launchAutomations?.(),
  onAgents: () => window.electronAPI?.launchAgents?.(),
  onEvents: () => window.electronAPI?.launchEvents?.(),
  onSkills: () => window.electronAPI?.launchSkills?.(),
  onPersonas: () => window.electronAPI?.launchPersonas?.(),
  onUsage: () => window.electronAPI?.launchUsage?.(),
  onSettings: () => settings.open(),
  onAbout: () => about.open(),
});

window.addEventListener('ow:user-profile-updated', event => {
  sidebar.setUser(event.detail?.name ?? state.userName);
});

const SEND_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="15" height="15">
  <path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
</svg>`;

const STOP_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
  <rect x="5" y="5" width="14" height="14" rx="3"/>
</svg>`;

function updateSendBtn() {
  if (state.isTyping) {
    sendBtn.innerHTML = STOP_ICON;
    sendBtn.classList.add('ready', 'is-stop');
    sendBtn.disabled = false;
    sendBtn.title = 'Stop generating';
    return;
  }

  sendBtn.innerHTML = SEND_ICON;
  sendBtn.classList.remove('is-stop');
  sendBtn.title = 'Send';

  const hasText = textarea.value.trim().length > 0;
  const hasAttachments = state.composerAttachments.length > 0;
  const hasUnsupported = state.composerAttachments.some(a => a.type === 'image') &&
    !state.selectedProvider?.models?.[state.selectedModel]?.inputs?.image;
  const ready = (hasText || hasAttachments) && !state.isTyping && !hasUnsupported;
  sendBtn.classList.toggle('ready', ready);
  sendBtn.disabled = !ready;
}
setSendBtnUpdater(updateSendBtn);

async function refreshSystemPrompt() {
  try { state.systemPrompt = await window.electronAPI?.getSystemPrompt?.() ?? ''; }
  catch { state.systemPrompt = ''; }
}
window.addEventListener('ow:settings-saved', refreshSystemPrompt);

chips.forEach(chip => {
  chip.addEventListener('click', () => {
    textarea.value = chip.getAttribute('data-prompt');
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();
    chip.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }],
      { duration: 200, easing: 'ease-out' },
    );
  });
});

document.addEventListener('click', event => {
  if (modelDropdown && !modelDropdown.contains(event.target) && !modelSelectorBtn?.contains(event.target)) {
    modelDropdown.classList.remove('open');
  }
});

projectOpenFolderBtn?.addEventListener('click', async () => {
  if (!state.activeProject?.rootPath) return;
  await window.electronAPI?.openFolderOS?.({ dirPath: state.activeProject.rootPath });
});

projectExitBtn?.addEventListener('click', leaveProject);

document.title = APP_NAME;

initModelSelector();
initTerminalObserver();
syncProjectUI();

initComposer(() => {
  if (state.isTyping) {
    stopGeneration();
    return;
  }
  const text = textarea.value.trim();
  const attachments = state.composerAttachments.map(a => ({ ...a }));
  sendMessage({ text, attachments, sendBtnEl: sendBtn });
});

loadProviders().then(async () => {
  syncCapabilities();
  const user = await settings.loadUser();
  sidebar.setUser(user?.name ?? '');
  await refreshSystemPrompt();

  const pendingChatId = localStorage.getItem('ow-pending-chat');
  if (pendingChatId) {
    localStorage.removeItem('ow-pending-chat');
    await loadChat(pendingChatId, {
      updateModelLabel,
      buildModelDropdown,
      notifyModelSelectionChanged,
    });
  }
});

console.log(`[${APP_NAME}] loaded`);

const enhanceBtn = document.getElementById('enhance-btn');

function updateEnhanceBtn() {
  if (!enhanceBtn) return;
  const hasText = textarea.value.trim().length > 0;
  enhanceBtn.classList.toggle('enhance-active', hasText && !state.isTyping);
  enhanceBtn.disabled = !hasText || state.isTyping;
}

async function handleEnhance() {
  const raw = textarea.value.trim();
  if (!raw || state.isTyping || !state.selectedProvider || !state.selectedModel) return;

  enhanceBtn.classList.remove('enhance-active');
  enhanceBtn.classList.add('enhance-loading');
  enhanceBtn.disabled = true;
  const labelEl = enhanceBtn.querySelector('.enhance-btn-label');
  if (labelEl) labelEl.textContent = 'Enhancing...';

  try {
    const result = await fetchWithTools(
      state.selectedProvider,
      state.selectedModel,
      [{ role: 'user', content: raw, attachments: [] }],
      [
        'You are a prompt-enhancement assistant.',
        'Rewrite the user\'s message into a clearer, more specific, and more effective prompt.',
        'Keep the same intent and language style.',
        'Return ONLY the enhanced prompt - no preamble, no quotes, no explanation.',
      ].join(' '),
      [],
    );

    if (result.type === 'text' && result.text && result.text !== '(empty response)') {
      textarea.value = result.text;
      textarea.dispatchEvent(new Event('input'));
    }
  } catch (err) {
    console.warn('[Enhance] Failed:', err.message);
  } finally {
    enhanceBtn.classList.remove('enhance-loading');
    if (labelEl) labelEl.textContent = 'Enhance';
    updateEnhanceBtn();
  }
}

enhanceBtn?.addEventListener('click', handleEnhance);
textarea.addEventListener('input', updateEnhanceBtn);
updateEnhanceBtn();

const originalSendBtnUpdater = updateSendBtn;
setSendBtnUpdater(() => {
  originalSendBtnUpdater();
  updateEnhanceBtn();
});

let dragCounter = 0;

const dropOverlay = document.createElement('div');
dropOverlay.className = 'drop-overlay';
dropOverlay.innerHTML = '<div class="drop-overlay-content"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="48" height="48" style="margin-bottom:12px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg><h2>Drop files to attach</h2></div>';
document.body.appendChild(dropOverlay);

Object.assign(dropOverlay.style, {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, opacity: 0, pointerEvents: 'none',
  transition: 'opacity 0.2s ease, transform 0.2s ease',
  transform: 'scale(1.02)',
});
Object.assign(dropOverlay.querySelector('.drop-overlay-content').style, {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  color: 'white',
});

document.addEventListener('dragover', event => {
  event.preventDefault();
  event.stopPropagation();
});

document.addEventListener('dragenter', event => {
  event.preventDefault();
  event.stopPropagation();
  dragCounter += 1;
  if (dragCounter === 1) {
    dropOverlay.style.opacity = '1';
    dropOverlay.style.transform = 'scale(1)';
  }
});

document.addEventListener('dragleave', event => {
  event.preventDefault();
  event.stopPropagation();
  dragCounter -= 1;
  if (dragCounter === 0) {
    dropOverlay.style.opacity = '0';
    dropOverlay.style.transform = 'scale(1.02)';
  }
});

document.addEventListener('drop', async event => {
  event.preventDefault();
  event.stopPropagation();
  dragCounter = 0;
  dropOverlay.style.opacity = '0';
  dropOverlay.style.transform = 'scale(1.02)';

  if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
    await addAttachments(Array.from(event.dataTransfer.files));
  }
});

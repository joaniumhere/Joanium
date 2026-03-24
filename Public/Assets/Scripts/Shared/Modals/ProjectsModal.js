import { state } from '../State.js';
import { syncModalOpenState } from '../DOM.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatRelativeDate(isoString) {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const diff = Date.now() - date.getTime();
  const hour = 3_600_000;
  const day = 86_400_000;

  if (diff < hour) return 'Just now';
  if (diff < day) return `${Math.max(1, Math.round(diff / hour))}h ago`;
  if (diff < 7 * day) return `${Math.max(1, Math.round(diff / day))}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function initProjectsModal({
  onProjectOpen = async () => false,
  onProjectRemoved = async () => {},
  onClose = () => {},
} = {}) {
  const backdrop = document.getElementById('projects-modal-backdrop');
  const closeBtn = document.getElementById('projects-close');
  const listEl = document.getElementById('project-list');
  const nameInput = document.getElementById('project-name-input');
  const pathInput = document.getElementById('project-path-input');
  const contextInput = document.getElementById('project-context-input');
  const pathBtn = document.getElementById('project-path-btn');
  const createBtn = document.getElementById('project-create-btn');
  const statusEl = document.getElementById('project-create-status');

  if (!backdrop || !listEl) {
    return {
      open() {},
      close() {},
      isOpen: () => false,
      refreshProjects: async () => [],
    };
  }

  let projects = [];

  function setStatus(message = '', tone = '') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `project-status${tone ? ` ${tone}` : ''}`;
  }

  function clearForm() {
    if (nameInput) nameInput.value = '';
    if (pathInput) pathInput.value = '';
    if (contextInput) contextInput.value = '';
  }

  async function chooseFolder() {
    const defaultPath = pathInput?.value?.trim() || state.activeProject?.rootPath || undefined;
    const result = await window.electronAPI?.selectDirectory?.({ defaultPath });
    if (result?.ok && result.path && pathInput) {
      pathInput.value = result.path;
    }
  }

  function renderProjectList() {
    if (!listEl) return;

    if (!projects.length) {
      listEl.innerHTML = '<div class="project-empty">No projects yet. Create one to keep its folder, notes, and chats together.</div>';
      return;
    }

    listEl.innerHTML = '';

    projects.forEach(project => {
      const item = document.createElement('article');
      item.className = `project-item${state.activeProject?.id === project.id ? ' active' : ''}${project.folderExists ? '' : ' is-missing'}`;

      const context = project.context?.trim() || 'No saved project notes yet.';
      const lastOpened = formatRelativeDate(project.lastOpenedAt ?? project.updatedAt);

      item.innerHTML = `
        <div class="project-item-main">
          <div class="project-item-head">
            <div class="project-item-title">${escapeHtml(project.name)}</div>
            <div class="project-item-badges">
              ${state.activeProject?.id === project.id ? '<span class="project-badge current">Current</span>' : ''}
              ${project.folderExists ? '' : '<span class="project-badge missing">Missing folder</span>'}
            </div>
          </div>
          <div class="project-item-path">${escapeHtml(project.rootPath)}</div>
          <div class="project-item-context">${escapeHtml(context)}</div>
          <div class="project-item-context">${lastOpened ? `Last opened ${escapeHtml(lastOpened)}` : ''}</div>
        </div>
        <div class="project-item-actions">
          <button class="project-open-btn" type="button">Open</button>
          <button class="project-delete-btn" type="button">Remove</button>
        </div>
      `;

      item.querySelector('.project-open-btn')?.addEventListener('click', async () => {
        const opened = await onProjectOpen(project);
        if (opened) close();
      });

      item.querySelector('.project-delete-btn')?.addEventListener('click', async () => {
        const confirmed = window.confirm(
          `Remove "${project.name}" from Romelson and delete its saved project chats? Your local folder will not be touched.`,
        );
        if (!confirmed) return;

        const result = await window.electronAPI?.deleteProject?.(project.id);
        if (!result?.ok) {
          setStatus(result?.error || 'Could not remove the project.', 'error');
          return;
        }

        if (state.activeProject?.id === project.id) {
          await onProjectRemoved(project);
        }

        setStatus(`Removed ${project.name}.`, 'success');
        await refreshProjects();
      });

      listEl.appendChild(item);
    });
  }

  async function refreshProjects() {
    try {
      projects = (await window.electronAPI?.getProjects?.()) ?? [];
    } catch {
      projects = [];
    }
    renderProjectList();
    return projects;
  }

  async function handleCreate() {
    const name = nameInput?.value?.trim() ?? '';
    const rootPath = pathInput?.value?.trim() ?? '';
    const context = contextInput?.value?.trim() ?? '';

    if (!name) {
      setStatus('Project name is required.', 'error');
      nameInput?.focus();
      return;
    }

    if (!rootPath) {
      setStatus('Choose a local directory for this project.', 'error');
      pathBtn?.focus();
      return;
    }

    setStatus('Creating project...');
    const result = await window.electronAPI?.createProject?.({ name, rootPath, context });
    if (!result?.ok || !result.project) {
      setStatus(result?.error || 'Could not create the project.', 'error');
      return;
    }

    clearForm();
    setStatus(`Created ${result.project.name}.`, 'success');
    await refreshProjects();
    const opened = await onProjectOpen(result.project);
    if (opened) close();
  }

  async function open() {
    backdrop.classList.add('open');
    syncModalOpenState();
    setStatus('');
    await refreshProjects();
    requestAnimationFrame(() => nameInput?.focus());
  }

  function close() {
    backdrop.classList.remove('open');
    syncModalOpenState();
    onClose();
  }

  function isOpen() {
    return backdrop.classList.contains('open');
  }

  closeBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) close();
  });
  pathBtn?.addEventListener('click', chooseFolder);
  createBtn?.addEventListener('click', handleCreate);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) close();
  });

  window.addEventListener('ow:project-changed', () => {
    if (isOpen()) refreshProjects();
  });

  return {
    open,
    close,
    isOpen,
    refreshProjects,
  };
}

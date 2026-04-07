import { state } from '../../../../System/State.js';
import { fetchWithTools } from '../../../../Features/AI/index.js';
import { buildChatPayload } from '../Data/ChatPersistence.js';

const MAX_PENDING_MEMORY_CHATS = 10;

let _memorySyncChain = Promise.resolve();
const _queuedSignatures = new Set();

function showMemoryIndicator(label = 'Updating memory...') {
  const existing = document.getElementById('memory-learn-indicator');
  if (existing) {
    existing.querySelector('[data-memory-label]')?.replaceChildren(document.createTextNode(label));
    return () => {};
  }

  const el = document.createElement('div');
  el.id = 'memory-learn-indicator';
  el.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         style="width:12px;height:12px;animation:spin 1.2s linear infinite;flex-shrink:0">
      <path d="M21 12a9 9 0 11-6.219-8.56" stroke-linecap="round"/>
    </svg>
    <span data-memory-label>${label}</span>
  `;
  el.style.cssText = `
    position:fixed; top:48px; left:calc(var(--sidebar-w, 52px) + 14px); transform:none;
    display:flex; align-items:center; gap:6px;
    background:var(--bg-tertiary); border:1px solid var(--border-subtle);
    border-radius:999px; padding:4px 12px;
    font-size:11px; font-family:var(--font-ui); color:var(--text-muted);
    z-index:50; animation:fadeIn 0.2s ease both;
    pointer-events:none;
  `;

  if (!document.getElementById('mem-spin-style')) {
    const style = document.createElement('style');
    style.id = 'mem-spin-style';
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
  }

  document.body.appendChild(el);
  return () => {
    el.style.transition = 'opacity 0.3s ease';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  };
}

function buildSnapshotScope(projectId = null) {
  return projectId ? { projectId } : {};
}

function hasMeaningfulConversation(messages = []) {
  return (Array.isArray(messages) ? messages : []).some(
    (message) =>
      message?.role === 'user' &&
      (String(message?.content ?? '').trim() || (message?.attachments?.length ?? 0) > 0),
  );
}

function createCurrentChatSnapshot(reason = 'session-end') {
  const payload = buildChatPayload({
    chatId: state.currentChatId,
    messages: state.messages,
    provider: state.selectedProvider,
    model: state.selectedModel,
    activeProject: state.activeProject,
    workspacePath: state.workspacePath,
  });

  if (!payload || !hasMeaningfulConversation(payload.messages)) return null;

  return {
    ...payload,
    reason,
    scope: buildSnapshotScope(payload.projectId),
  };
}

function normalizeForSignature(value = '') {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function buildSnapshotSignature(snapshot = {}) {
  const lastMessage = snapshot.messages?.[snapshot.messages.length - 1];
  return [
    snapshot.id,
    snapshot.updatedAt,
    snapshot.messages?.length ?? 0,
    normalizeForSignature(lastMessage?.content ?? ''),
  ].join('::');
}

function buildConversationTranscript(messages = []) {
  return messages
    .map((message) => {
      const role = message.role === 'assistant' ? 'Assistant' : 'User';
      const attachments = Array.isArray(message.attachments)
        ? message.attachments
            .map((attachment) => attachment?.name ?? attachment?.type ?? '')
            .filter(Boolean)
        : [];
      const attachmentLine = attachments.length ? `\nAttachments: ${attachments.join(', ')}` : '';
      return `${role}: ${String(message.content ?? '').trim() || '(no text)'}${attachmentLine}`;
    })
    .join('\n\n');
}

function buildMemoryCatalogBlock(entries = []) {
  const fileList = entries.map((entry) => entry.filename).join(', ');
  const nonEmptyEntries = entries.filter((entry) => {
    const lines = String(entry.content ?? '')
      .replace(/\r\n/g, '\n')
      .split('\n');
    if (lines[0]?.trim().startsWith('#')) lines.shift();
    return lines.join('\n').trim();
  });

  const sections = [];
  if (fileList) {
    sections.push(`Available files: ${fileList}`);
  }
  if (nonEmptyEntries.length) {
    sections.push(
      nonEmptyEntries
        .map((entry) =>
          [`FILE: ${entry.filename}`, 'CONTENT:', entry.content?.trim() || '(empty)'].join('\n'),
        )
        .join('\n\n---\n\n'),
    );
  }

  return sections.join('\n\n');
}

function extractJsonObject(text = '') {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function normalizeMemoryEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const filename = String(entry.filename ?? '').trim();
  const content = String(entry.content ?? '').trim();
  if (!filename || !content) return null;
  return { filename, content };
}

function normalizeMemoryUpdatePayload(payload = {}) {
  return {
    updates: (Array.isArray(payload.updates) ? payload.updates : [])
      .map(normalizeMemoryEntry)
      .filter(Boolean),
    newFiles: (Array.isArray(payload.newFiles) ? payload.newFiles : [])
      .map(normalizeMemoryEntry)
      .filter(Boolean),
  };
}

function resolveSyncModel(snapshot = {}) {
  const preferredProviderId = String(snapshot.provider ?? '').trim();
  const preferredModelId = String(snapshot.model ?? '').trim();

  if (preferredProviderId && preferredModelId) {
    const provider = state.providers.find(
      (candidate) =>
        candidate.provider === preferredProviderId && candidate.models?.[preferredModelId],
    );
    if (provider) {
      return { provider, modelId: preferredModelId };
    }
  }

  if (state.selectedProvider && state.selectedModel) {
    return { provider: state.selectedProvider, modelId: state.selectedModel };
  }

  return { provider: null, modelId: null };
}

async function saveChatSnapshot(snapshot) {
  const payload = { ...snapshot };
  delete payload.scope;
  delete payload.reason;
  await window.electronAPI?.invoke?.('save-chat', payload, snapshot.scope ?? {});
}

async function markSnapshotSynced(snapshot) {
  await window.electronAPI?.invoke?.(
    'mark-chat-personal-memory-synced',
    snapshot.id,
    snapshot.scope ?? {},
  );
}

async function syncSnapshotToPersonalMemory(snapshot) {
  await saveChatSnapshot(snapshot);

  const { provider, modelId } = resolveSyncModel(snapshot);
  if (!provider || !modelId) {
    return false;
  }

  const catalog = (await window.electronAPI?.invoke?.('get-personal-memory-catalog')) ?? [];
  const transcript = buildConversationTranscript(snapshot.messages);
  if (!transcript.trim()) {
    await markSnapshotSynced(snapshot);
    return true;
  }

  const prompt = [
    'You maintain a persistent personal-memory library for one user.',
    'Use the completed conversation to decide which personal memory markdown files should change.',
    '',
    'Rules:',
    '- These files are ONLY for personal information.',
    '- Never store repo names, code, bug reports, workspace details, project tasks, file paths, stack traces, or other work/project context.',
    '- Keep only durable personal facts: likes, dislikes, family, friends, relationships, education, career aspirations, values, wellbeing, support preferences, habits, important dates, and communication preferences.',
    '- Do not store one-off troubleshooting requests, temporary work context, or random passing thoughts.',
    '- Do not repeat facts that already exist anywhere in the memory library.',
    '- Prefer updating existing files. Create a new .md file only when the current files are clearly not enough.',
    '- When you update a file, return the FULL final markdown for that file.',
    '- Preserve useful existing content and merge new facts cleanly.',
    '- If nothing should change, return exactly {"updates":[],"newFiles":[]}.',
    '',
    'Return ONLY valid JSON with this shape:',
    '{"updates":[{"filename":"Likes.md","content":"# Likes\\n- ..."}],"newFiles":[{"filename":"Custom.md","content":"# Custom\\n- ..."}]}',
    '',
    'Existing personal memory files:',
    buildMemoryCatalogBlock(catalog),
    '',
    'Completed conversation transcript:',
    transcript,
  ].join('\n');

  const result = await fetchWithTools(
    provider,
    modelId,
    [{ role: 'user', content: prompt, attachments: [] }],
    'You update a personal memory library. Return only valid JSON.',
    [],
  );

  if (result.type !== 'text') {
    throw new Error('Memory sync did not return text.');
  }

  const jsonText = extractJsonObject(result.text ?? '');
  if (!jsonText) {
    throw new Error('Memory sync did not return valid JSON.');
  }

  const payload = normalizeMemoryUpdatePayload(JSON.parse(jsonText));
  if (payload.updates.length || payload.newFiles.length) {
    const response = await window.electronAPI?.invoke?.('apply-personal-memory-updates', payload);
    if (response?.ok === false) {
      throw new Error(response.error ?? 'Could not apply personal memory updates.');
    }
  }

  await markSnapshotSynced(snapshot);
  return true;
}

function enqueueSnapshotMemorySync(snapshot, label = 'Updating memory...') {
  if (!snapshot) return Promise.resolve(false);

  const signature = buildSnapshotSignature(snapshot);
  if (_queuedSignatures.has(signature)) {
    return _memorySyncChain;
  }

  _queuedSignatures.add(signature);

  _memorySyncChain = _memorySyncChain
    .catch(() => {})
    .then(async () => {
      const hideIndicator = showMemoryIndicator(label);

      try {
        return await syncSnapshotToPersonalMemory(snapshot);
      } finally {
        hideIndicator();
      }
    })
    .catch((error) => {
      _queuedSignatures.delete(signature);
      if (error?.name === 'AbortError') throw error;
      console.warn('[Chat] Personal memory sync failed (non-fatal):', error?.message ?? error);
      return false;
    });

  return _memorySyncChain;
}

export function queueCurrentSessionMemorySync(reason = 'session-end') {
  const snapshot = createCurrentChatSnapshot(reason);
  return enqueueSnapshotMemorySync(snapshot, 'Updating memory...');
}

export async function flushPendingPersonalMemorySyncs(limit = MAX_PENDING_MEMORY_CHATS) {
  if (!state.providers.length || (!state.selectedProvider && !state.selectedModel)) {
    return;
  }

  const pendingChats =
    (await window.electronAPI?.invoke?.('get-pending-personal-memory-chats', { limit })) ?? [];

  for (const chat of pendingChats) {
    if (!chat?.id || !hasMeaningfulConversation(chat.messages)) continue;

    const snapshot = {
      ...chat,
      reason: 'pending-chat',
      scope: buildSnapshotScope(chat.projectId ?? null),
    };

    await enqueueSnapshotMemorySync(snapshot, 'Catching up memory...');
  }
}

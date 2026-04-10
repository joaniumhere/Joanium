import { state } from '../../../../System/State.js';
import { fetchWithTools } from '../../../../Features/AI/index.js';
import { buildChatPayload, currentChatScope } from '../Data/ChatPersistence.js';

const SUMMARY_TRIGGER_MESSAGE_COUNT = 14;
const SUMMARY_RECENT_WINDOW = 8;
const SUMMARY_INPUT_CHAR_LIMIT = 14_000;
const SUMMARY_LINE_CHAR_LIMIT = 500;

let summaryChain = Promise.resolve();
const queuedSignatures = new Set();

function clampSummaryCount(value, messageCount) {
  const numeric = Math.max(0, Number(value) || 0);
  return Math.min(numeric, Math.max(0, messageCount));
}

function getSummaryTargetCount(messages = []) {
  if ((messages?.length ?? 0) < SUMMARY_TRIGGER_MESSAGE_COUNT) return 0;
  return Math.max(0, messages.length - SUMMARY_RECENT_WINDOW);
}

function normalizeSummaryText(text = '') {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 6_000);
}

function trimLineForSummary(value = '') {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '(empty)';
  return text.length > SUMMARY_LINE_CHAR_LIMIT
    ? `${text.slice(0, SUMMARY_LINE_CHAR_LIMIT)}...`
    : text;
}

function buildTranscriptChunk(messages = []) {
  const lines = [];
  let totalChars = 0;

  for (const message of messages) {
    const attachments = Array.isArray(message?.attachments)
      ? message.attachments
          .map((attachment) => attachment?.name ?? attachment?.type ?? '')
          .filter(Boolean)
          .join(', ')
      : '';
    const prefix = message?.role === 'assistant' ? 'Assistant' : 'User';
    const content = trimLineForSummary(message?.content ?? '');
    const line = attachments
      ? `${prefix}: ${content} [Attachments: ${attachments}]`
      : `${prefix}: ${content}`;

    if (totalChars + line.length > SUMMARY_INPUT_CHAR_LIMIT && lines.length > 0) {
      lines.push('...(older turns omitted from this update chunk)');
      break;
    }

    lines.push(line);
    totalChars += line.length;
  }

  return lines.join('\n');
}

function resolveSummaryModel() {
  if (state.selectedProvider && state.selectedModel) {
    return { provider: state.selectedProvider, modelId: state.selectedModel };
  }

  return { provider: null, modelId: null };
}

export function resetConversationSummary() {
  state.conversationSummary = '';
  state.conversationSummaryMessageCount = 0;
}

export function syncConversationSummaryWithMessages(messages = state.messages) {
  const targetCount = getSummaryTargetCount(messages);
  const currentCount = clampSummaryCount(state.conversationSummaryMessageCount, messages.length);

  if (!targetCount || currentCount > targetCount) {
    resetConversationSummary();
    return;
  }

  state.conversationSummaryMessageCount = currentCount;
  if (!currentCount) {
    state.conversationSummary = '';
  }
}

function createSummarySnapshot() {
  syncConversationSummaryWithMessages();

  const payload = buildChatPayload({
    chatId: state.currentChatId,
    messages: state.messages,
    provider: state.selectedProvider,
    model: state.selectedModel,
    activeProject: state.activeProject,
    workspacePath: state.workspacePath,
    conversationSummary: state.conversationSummary,
    conversationSummaryMessageCount: state.conversationSummaryMessageCount,
  });

  if (!payload) return null;

  const targetCount = getSummaryTargetCount(payload.messages);
  if (!targetCount || targetCount <= payload.conversationSummaryMessageCount) return null;

  return {
    ...payload,
    targetCount,
    scope: currentChatScope(),
  };
}

async function saveSummarySnapshot(snapshot) {
  const payload = { ...snapshot };
  delete payload.scope;
  delete payload.targetCount;
  await window.electronAPI?.invoke?.('save-chat', payload, snapshot.scope ?? {});
}

async function compactConversationSnapshot(snapshot) {
  if (!snapshot?.id || state.isTyping) return false;

  const { provider, modelId } = resolveSummaryModel();
  if (!provider || !modelId) return false;

  const incomingMessages = snapshot.messages.slice(
    snapshot.conversationSummaryMessageCount,
    snapshot.targetCount,
  );
  if (!incomingMessages.length) return false;

  const transcript = buildTranscriptChunk(incomingMessages);
  if (!transcript.trim()) return false;

  const prompt = [
    'You maintain a compact hidden conversation summary for an AI assistant.',
    'Merge the previous summary with the newly provided older chat turns.',
    '',
    'Rules:',
    '- Preserve the user goal, constraints, preferences, project/workspace context, file paths, technical findings, decisions, and unresolved threads.',
    '- Keep concrete facts that matter for future turns.',
    '- Do not include tool chatter, UI logs, or internal execution details.',
    '- Prefer crisp markdown bullet points and short sections.',
    '- Return ONLY the updated summary in markdown.',
    '- Keep it dense and high-signal.',
    '',
    'Recommended structure:',
    '## Goal',
    '- ...',
    '## Constraints',
    '- ...',
    '## Decisions',
    '- ...',
    '## Open Threads',
    '- ...',
    '',
    'Previous summary:',
    normalizeSummaryText(snapshot.conversationSummary) || '(none)',
    '',
    'New older chat turns to merge:',
    transcript,
  ].join('\n');

  const result = await fetchWithTools(
    provider,
    modelId,
    [{ role: 'user', content: prompt, attachments: [] }],
    'You compress chat history into a compact, high-retention markdown summary.',
    [],
  );

  if (result.type !== 'text') {
    throw new Error('Conversation compaction did not return text.');
  }

  const nextSummary = normalizeSummaryText(result.text);
  if (!nextSummary) return false;

  if (state.currentChatId === snapshot.id) {
    state.conversationSummary = nextSummary;
    state.conversationSummaryMessageCount = snapshot.targetCount;
  }

  await saveSummarySnapshot({
    ...snapshot,
    conversationSummary: nextSummary,
    conversationSummaryMessageCount: snapshot.targetCount,
  });

  return true;
}

export function queueConversationCompaction() {
  const snapshot = createSummarySnapshot();
  if (!snapshot) return Promise.resolve(false);

  const signature = [
    snapshot.id,
    snapshot.messages.length,
    snapshot.conversationSummaryMessageCount,
    snapshot.targetCount,
  ].join(':');
  if (queuedSignatures.has(signature)) {
    return summaryChain;
  }

  queuedSignatures.add(signature);

  summaryChain = summaryChain
    .catch(() => {})
    .then(async () => {
      try {
        return await compactConversationSnapshot(snapshot);
      } finally {
        queuedSignatures.delete(signature);
      }
    })
    .catch((error) => {
      queuedSignatures.delete(signature);
      console.warn('[Chat] Conversation compaction failed (non-fatal):', error?.message ?? error);
      return false;
    });

  return summaryChain;
}

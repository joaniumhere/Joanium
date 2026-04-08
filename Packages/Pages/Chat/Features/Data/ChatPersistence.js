/* ══════════════════════════════════════════
   CHAT PERSISTENCE
   Save, load, and start new chats.
   Helpers: chat ID, chat scope, message
   sanitisation for storage.
══════════════════════════════════════════ */
import { state } from '../../../../System/State.js';
import { sanitizeMessagesForUI } from '../UI/ChatBubble.js';

export function generateChatId() {
  const now = new Date();
  const p = v => String(v).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}`;
}

export function currentChatScope() {
  return state.activeProject ? { projectId: state.activeProject.id } : {};
}

function deriveChatTitle(messages = []) {
  const first = messages.find((message) => message.role === 'user');
  const hasFileAttachment = first?.attachments?.some((attachment) => attachment?.type === 'file');
  const hasImageAttachment = first?.attachments?.some((attachment) => attachment?.type === 'image');
  return (
    first?.content?.trim().slice(0, 70) ||
    (hasFileAttachment ? 'File attachment' : hasImageAttachment ? 'Image attachment' : 'Untitled')
  );
}

export function buildChatPayload({
  chatId,
  messages,
  provider = null,
  model = null,
  activeProject = null,
  workspacePath = null,
  conversationSummary = '',
  conversationSummaryMessageCount = 0,
  updatedAt = new Date().toISOString(),
} = {}) {
  if (!chatId || !messages?.length) return null;

  const sanitizedMessages = sanitizeMessagesForUI(messages);
  if (!sanitizedMessages.length) return;
  return {
    id: chatId,
    title: deriveChatTitle(sanitizedMessages),
    updatedAt,
    provider: provider?.provider ?? provider ?? null,
    model: model ?? null,
    projectId: activeProject?.id ?? null,
    projectName: activeProject?.name ?? null,
    workspacePath: workspacePath ?? null,
    projectContext: activeProject?.context ?? '',
    conversationSummary: String(conversationSummary ?? '').trim(),
    conversationSummaryMessageCount: Math.max(0, Number(conversationSummaryMessageCount) || 0),
    messages: sanitizedMessages,
  };
}

export async function saveCurrentChat() {
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

  try {
    await window.electronAPI?.invoke?.('save-chat', payload, currentChatScope());
    return payload;
  } catch (err) { console.warn('[Chat] Could not save chat:', err); }
  return null;
}

export async function trackUsage(usage, chatId, provider = null, modelId = null) {
  if (!usage || (!usage.inputTokens && !usage.outputTokens)) return;
  const p = provider ?? state.selectedProvider;
  const m = modelId ?? state.selectedModel;
  if (!p || !m) return;
  try {
    const modelInfo = p.models?.[m];
    await window.electronAPI?.invoke?.('track-usage', {
      provider: p.provider,
      model: m,
      modelName: modelInfo?.name ?? m,
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
      chatId: chatId ?? state.currentChatId ?? null,
    });
  } catch (err) { console.warn('[Chat] Could not track usage:', err); }
}

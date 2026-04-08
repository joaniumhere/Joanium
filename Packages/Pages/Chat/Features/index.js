import { state } from '../../../System/State.js';
import { welcome, chatView, chatMessages } from '../../../Pages/Shared/Core/DOM.js';
import { reset as resetComposer } from './Composer/index.js';
import { agentLoop, prewarmAgentContext, selectSkillsForMessages } from './Core/Agent.js';

// Sub-modules
import {
  onChatMessagesClick,
  appendMessage,
  createLiveRow,
  sanitizeAssistantReply,
  sanitizeMessagesForUI,
} from './UI/ChatBubble.js';
import { updateTimeline, setupScrollFeatures, bumpScrollBadge } from './UI/ChatTimeline.js';
import { queueCurrentSessionMemorySync } from './Core/ChatMemory.js';
import {
  queueConversationCompaction,
  resetConversationSummary,
  syncConversationSummaryWithMessages,
} from './Core/ConversationSummary.js';
import {
  saveCurrentChat,
  trackUsage,
  generateChatId,
  currentChatScope,
} from './Data/ChatPersistence.js';

/* ══════════════════════════════════════════
   TOKEN FOOTER — always on
══════════════════════════════════════════ */
document.documentElement.classList.add('show-tokens');

/* ══════════════════════════════════════════
   ABORT CONTROLLER — stop generation
══════════════════════════════════════════ */
let _currentAbortController = null;

/** Call this to cancel the in-flight generation. */
export function stopGeneration() {
  if (_currentAbortController) {
    _currentAbortController.abort();
    _currentAbortController = null;
  }
}

/* ══════════════════════════════════════════
   SEND BUTTON UPDATER
══════════════════════════════════════════ */
let _updateSendBtn = () => {};
export function setSendBtnUpdater(fn) {
  _updateSendBtn = fn;
}
const PLANNER_TIMEOUT_MS = 900;

function buildPlanningText(message = {}) {
  const text = String(message?.content ?? '').trim();
  const attachmentNames = Array.isArray(message?.attachments)
    ? message.attachments
        .map((attachment) => attachment?.name ?? attachment?.type ?? '')
        .filter(Boolean)
        .join(' ')
    : '';

  return `${text} ${attachmentNames}`.trim().toLowerCase();
}

function shouldUsePlanner(message = {}) {
  const planningText = buildPlanningText(message);
  if (!planningText) return false;

  if ((message.attachments?.length ?? 0) > 0) return true;
  if (planningText.length >= 260) return true;

  return /\b(file|files|folder|workspace|project|repo|repository|branch|commit|pull request|pr|code|debug|fix|refactor|implement|build|test|lint|terminal|shell|command|browser|website|page|login|navigate|click|book|checkout|calendar|gmail|github|gitlab|drive|docs|sheets|slides|memory|sub-agent|agent)\b/i.test(
    planningText,
  );
}

async function resolveExecutionPlan(messages = []) {
  const lastUserMsg = [...messages].reverse().find((message) => message?.role === 'user');
  if (!lastUserMsg) return { plannedSkills: [], plannedToolCalls: [] };

  const heuristicSkills = await selectSkillsForMessages(messages).catch(() => []);
  if (!shouldUsePlanner(lastUserMsg)) {
    return { plannedSkills: heuristicSkills, plannedToolCalls: [] };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), PLANNER_TIMEOUT_MS);

  try {
    const plan = await planRequest(messages, { signal: controller.signal });
    return {
      plannedSkills: plan.skills?.length ? plan.skills : heuristicSkills,
      plannedToolCalls: plan.toolCalls ?? [],
    };
  } catch {
    return { plannedSkills: heuristicSkills, plannedToolCalls: [] };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function showPlanningTrace(live, plannedSkills = [], plannedToolCalls = []) {
  plannedSkills.forEach((skillName) => {
    const handle = live.push(`[SKILL] ${skillName}`);
    handle?.done?.(true);
  });

  if (plannedToolCalls.length > 0) {
    const handle = live.push('Planning...');
    handle?.done?.(true);
  }
}

/* ══════════════════════════════════════════
   INIT CHAT UI
══════════════════════════════════════════ */
export function initChatUI() {
  if (chatMessages && chatMessages.dataset.bound !== '1') {
    chatMessages.dataset.bound = '1';
    chatMessages.addEventListener('click', onChatMessagesClick);
  }
  setupScrollFeatures();
  updateTimeline();
}

/* ══════════════════════════════════════════
   RESEND FROM CURRENT STATE
══════════════════════════════════════════ */
async function doSendFromState() {
  if (!state.selectedProvider || !state.selectedModel || state.isTyping) return;
  syncConversationSummaryWithMessages();

  state.isTyping = true;
  _updateSendBtn();

  const live = createLiveRow(doSendFromState);
  live.push('Thinking…');

  let plannedSkills = [];
  let plannedToolCalls = [];
  ({ plannedSkills, plannedToolCalls } = await resolveExecutionPlan(state.messages));
  showPlanningTrace(live, plannedSkills, plannedToolCalls);

  try {
    _currentAbortController = new AbortController();
    const {
      text: finalReply,
      usage,
      usedProvider,
      usedModel,
    } = await agentLoop(
      state.messages,
      live,
      plannedSkills,
      plannedToolCalls,
      state.systemPrompt,
      _currentAbortController.signal,
    ).finally(() => {
      _currentAbortController = null;
    });

    const safeReply = sanitizeAssistantReply(finalReply);
    if (safeReply !== finalReply) live.set(safeReply);
    await trackUsage(usage, state.currentChatId, usedProvider, usedModel);
    state.messages.push({
      role: 'assistant',
      content: safeReply,
      attachments: live.getAttachments?.() ?? [],
    });
    saveCurrentChat();
    queueConversationCompaction().catch(() => {});
    bumpScrollBadge();
  } catch (err) {
    _currentAbortController = null;
    if (err.name === 'AbortError') {
      live.setAborted();
      return;
    }
    const errMsg = `Something went wrong: ${err.message}`;
    live.set(errMsg);
    state.messages.push({
      role: 'assistant',
      content: errMsg,
      attachments: live.getAttachments?.() ?? [],
    });
    console.error('[Chat] doSendFromState error:', err);
  } finally {
    state.isTyping = false;
    _updateSendBtn();
    updateTimeline();
  }
}

/* ══════════════════════════════════════════
   CHAT VIEW TRANSITIONS
══════════════════════════════════════════ */
export function showChatView() {
  if (chatView.classList.contains('active')) return;
  welcome.getAnimations().forEach((a) => a.cancel());
  welcome.style.display = 'flex';
  const anim = welcome.animate(
    [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(-16px) scale(0.97)' },
    ],
    { duration: 280, easing: 'cubic-bezier(0.4,0,1,1)', fill: 'forwards' },
  );
  anim.onfinish = () => {
    welcome.style.display = 'none';
  };
  chatView.classList.add('active');
}

export function restoreWelcome() {
  welcome.getAnimations().forEach((a) => a.cancel());
  welcome.style.display = 'flex';
  welcome.style.removeProperty('opacity');
  welcome.style.removeProperty('transform');
  chatView.classList.remove('active');

  const greeting = welcome.querySelector('.welcome-greeting');
  if (greeting) {
    greeting.style.animation = 'none';
    greeting.style.opacity = '1';
    greeting.style.transform = 'none';
    requestAnimationFrame(() => {
      greeting.style.removeProperty('animation');
      greeting.style.removeProperty('opacity');
      greeting.style.removeProperty('transform');
    });
  }
}

/* ══════════════════════════════════════════
   SEND MESSAGE
══════════════════════════════════════════ */
export async function sendMessage({ text, attachments, sendBtnEl }) {
  if ((!text && attachments.length === 0) || state.isTyping) return;
  syncConversationSummaryWithMessages();

  if (!state.currentChatId) state.currentChatId = generateChatId();

  showChatView();
  appendMessage('user', text, true, true, attachments, doSendFromState);
  resetComposer();

  sendBtnEl?.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(0.85)' },
      { transform: 'scale(1.15)' },
      { transform: 'scale(1)' },
    ],
    { duration: 350, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  );

  if (!state.selectedProvider || !state.selectedModel) {
    appendMessage(
      'assistant',
      'No AI provider configured. Add an API key, Ollama, or LM Studio in Settings.',
      true,
      true,
      [],
      doSendFromState,
    );
    return;
  }

  state.isTyping = true;
  _updateSendBtn();

  const live = createLiveRow(doSendFromState);
  live.push('Thinking…');

  let plannedSkills = [];
  let plannedToolCalls = [];
  ({ plannedSkills, plannedToolCalls } = await resolveExecutionPlan(state.messages));
  showPlanningTrace(live, plannedSkills, plannedToolCalls);

  try {
    _currentAbortController = new AbortController();
    const {
      text: finalReply,
      usage,
      usedProvider,
      usedModel,
    } = await agentLoop(
      state.messages,
      live,
      plannedSkills,
      plannedToolCalls,
      state.systemPrompt,
      _currentAbortController.signal,
    ).finally(() => {
      _currentAbortController = null;
    });

    const safeReply = sanitizeAssistantReply(finalReply);
    if (safeReply !== finalReply) live.set(safeReply);
    await trackUsage(usage, state.currentChatId, usedProvider, usedModel);
    state.messages.push({
      role: 'assistant',
      content: safeReply,
      attachments: live.getAttachments?.() ?? [],
    });
    saveCurrentChat();
    queueConversationCompaction().catch(() => {});
    bumpScrollBadge();
    setTimeout(updateTimeline, 100);
  } catch (err) {
    _currentAbortController = null;
    if (err.name === 'AbortError') {
      live.setAborted();
    } else {
      const msg = `Something went wrong: ${err.message}`;
      live.set(msg);
      state.messages.push({
        role: 'assistant',
        content: msg,
        attachments: live.getAttachments?.() ?? [],
      });
      console.error('[Chat] sendMessage error:', err);
    }
  } finally {
    state.isTyping = false;
    _updateSendBtn();
  }
}

/* ══════════════════════════════════════════
   CHAT SESSION HELPERS
══════════════════════════════════════════ */
export function startNewChat(extraCleanup = () => {}) {
  queueCurrentSessionMemorySync('new-chat').catch(() => {});
  state.messages = [];
  state.currentChatId = null;
  state.isTyping = false;
  resetConversationSummary();
  if (_currentAbortController) {
    _currentAbortController.abort();
    _currentAbortController = null;
  }
  document.getElementById('typing-row')?.remove();
  chatMessages.innerHTML = '';
  restoreWelcome();
  resetComposer();
  const timeline = document.getElementById('chat-timeline');
  if (timeline) timeline.classList.remove('visible');
  const scrollBtn = document.getElementById('scroll-to-bottom');
  if (scrollBtn) scrollBtn.classList.remove('visible');
  extraCleanup();
}

export async function loadChat(
  chatId,
  { updateModelLabel, buildModelDropdown, notifyModelSelectionChanged },
) {
  try {
    queueCurrentSessionMemorySync('chat-switch').catch(() => {});
    const chat = await window.electronAPI?.invoke?.('load-chat', chatId, currentChatScope());
    if (!chat) return;
    state.messages = [];
    state.currentChatId = chat.id;
    state.isTyping = false;
    state.conversationSummary = String(chat.conversationSummary ?? '').trim();
    state.conversationSummaryMessageCount = Math.max(
      0,
      Number(chat.conversationSummaryMessageCount) || 0,
    );
    document.getElementById('typing-row')?.remove();
    chatMessages.innerHTML = '';
    resetComposer();
    showChatView();
    const restored = sanitizeMessagesForUI(chat.messages ?? []);
    state.messages = restored;
    syncConversationSummaryWithMessages(restored);
    queueConversationCompaction().catch(() => {});
    restored.forEach((m) =>
      appendMessage(m.role, m.content, false, false, m.attachments, doSendFromState),
    );
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    if (chat.provider && chat.model) {
      const provider = state.providers.find((p) => p.provider === chat.provider);
      if (provider) {
        state.selectedProvider = provider;
        state.selectedModel = chat.model;
        updateModelLabel();
        buildModelDropdown();
      }
    }
    notifyModelSelectionChanged();
    _updateSendBtn();
    setTimeout(updateTimeline, 150);
  } catch (err) {
    console.error('[Chat] Load error:', err);
  }
}

/* Re-export sub-module helpers needed by other files */
export { saveCurrentChat, trackUsage } from './Data/ChatPersistence.js';
export { appendMessage, sanitizeMessagesForUI } from './UI/ChatBubble.js';
export { updateTimeline } from './UI/ChatTimeline.js';
export { prewarmAgentContext } from './Core/Agent.js';

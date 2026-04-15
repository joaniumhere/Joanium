import { ipcMain } from 'electron';
function loadMessages(messageStore) {
  return messageStore.load(() => ({ messages: [] }));
}
function persistMessages(messageStore, data) {
  messageStore.save(data);
}
function toIsoOrFallback(value, fallbackIso = new Date().toISOString()) {
  const fallbackDate = new Date(fallbackIso),
    date = value ? new Date(value) : fallbackDate;
  return Number.isNaN(date.getTime()) ? fallbackIso : date.toISOString();
}
function normalizeChannelMessage(msg = {}) {
  const repliedAt = toIsoOrFallback(msg.repliedAt ?? msg.timestamp),
    receivedAt = toIsoOrFallback(msg.receivedAt ?? repliedAt, repliedAt);
  return {
    id: `chmsg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    channel: String(msg.channel ?? ''),
    from: String(msg.from ?? 'User'),
    incoming: String(msg.incoming ?? ''),
    reply: String(msg.reply ?? ''),
    status: 'error' === msg.status ? 'error' : 'success',
    error: msg.error ? String(msg.error) : null,
    provider: msg.provider ? String(msg.provider) : null,
    model: msg.model ? String(msg.model) : null,
    receivedAt: receivedAt,
    repliedAt: repliedAt,
    timestamp: repliedAt,
    externalId: msg.externalId ? String(msg.externalId) : null,
    targetId: msg.targetId ? String(msg.targetId) : null,
    conversationId: msg.conversationId ? String(msg.conversationId) : null,
  };
}
export const ipcMeta = { needs: ['channelEngine', 'featureStorage'] };
export function register(channelEngine, featureStorage) {
  const messageStore = featureStorage.get('channelMessages');
  (ipcMain.handle('get-channels', () => {
    try {
      return { ok: !0, channels: channelEngine.getAll() };
    } catch (err) {
      return { ok: !1, error: err.message, channels: {} };
    }
  }),
    ipcMain.handle('get-channel-config', (_e, name) => {
      try {
        const c = channelEngine.getChannel(name);
        if (!c) return { ok: !1, error: 'Unknown channel' };
        const safe = { enabled: c.enabled, connectedAt: c.connectedAt };
        return (
          'telegram' === name && (safe.botTokenSet = Boolean(c.botToken)),
          'whatsapp' === name &&
            ((safe.accountSidSet = Boolean(c.accountSid)),
            (safe.authTokenSet = Boolean(c.authToken)),
            (safe.fromNumber = c.fromNumber ?? '')),
          'discord' === name &&
            ((safe.channelId = c.channelId ?? ''), (safe.botTokenSet = Boolean(c.botToken))),
          'slack' === name &&
            ((safe.channelId = c.channelId ?? ''), (safe.botTokenSet = Boolean(c.botToken))),
          { ok: !0, config: safe }
        );
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('save-channel', (_e, name, config) => {
      try {
        return channelEngine.saveChannel(name, config);
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('remove-channel', (_e, name) => {
      try {
        return (channelEngine.removeChannel(name), { ok: !0 });
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('toggle-channel', (_e, name, enabled) => {
      try {
        return (channelEngine.toggleChannel(name, enabled), { ok: !0 });
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('validate-channel', async (_e, name, credentials) => {
      try {
        return 'telegram' === name
          ? { ok: !0, ...(await channelEngine.validateTelegram(credentials.botToken)) }
          : 'whatsapp' === name
            ? {
                ok: !0,
                ...(await channelEngine.validateWhatsApp(
                  credentials.accountSid,
                  credentials.authToken,
                )),
              }
            : 'discord' === name
              ? { ok: !0, ...(await channelEngine.validateDiscord(credentials.botToken)) }
              : 'slack' === name
                ? { ok: !0, ...(await channelEngine.validateSlack(credentials.botToken)) }
                : { ok: !1, error: 'Unknown channel' };
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('channel-reply', (_e, id, text) => {
      try {
        return (channelEngine.resolveReply(id, text), { ok: !0 });
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('save-channel-message', (_e, msg) => {
      try {
        const data = loadMessages(messageStore);
        return (
          data.messages.unshift(normalizeChannelMessage(msg)),
          data.messages.length > 500 && (data.messages.length = 500),
          persistMessages(messageStore, data),
          { ok: !0 }
        );
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('get-channel-messages', () => {
      try {
        return { ok: !0, messages: loadMessages(messageStore).messages };
      } catch (err) {
        return { ok: !1, error: err.message, messages: [] };
      }
    }),
    ipcMain.handle('delete-channel-message', (_e, msgId) => {
      try {
        const data = loadMessages(messageStore);
        return (
          (data.messages = data.messages.filter((m) => m.id !== msgId)),
          persistMessages(messageStore, data),
          { ok: !0 }
        );
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }),
    ipcMain.handle('clear-channel-messages', () => {
      try {
        return (persistMessages(messageStore, { messages: [] }), { ok: !0 });
      } catch (err) {
        return { ok: !1, error: err.message };
      }
    }));
}

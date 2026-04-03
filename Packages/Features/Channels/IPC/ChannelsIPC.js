import { ipcMain } from 'electron';

const MAX_MESSAGES = 500;

function loadMessages(messageStore) {
  return messageStore.load(() => ({ messages: [] }));
}

function persistMessages(messageStore, data) {
  messageStore.save(data);
}

export const ipcMeta = { needs: ['channelEngine', 'featureStorage'] };
export function register(channelEngine, featureStorage) {
  const messageStore = featureStorage.get('channelMessages');

  ipcMain.handle('get-channels', () => {
    try { return { ok: true, channels: channelEngine.getAll() }; }
    catch (err) { return { ok: false, error: err.message, channels: {} }; }
  });

  ipcMain.handle('get-channel-config', (_e, name) => {
    try {
      const c = channelEngine.getChannel(name);
      if (!c) return { ok: false, error: 'Unknown channel' };
      const safe = { enabled: c.enabled, connectedAt: c.connectedAt };
      if (name === 'telegram') safe.botTokenSet = Boolean(c.botToken);
      if (name === 'whatsapp') {
        safe.accountSidSet = Boolean(c.accountSid);
        safe.authTokenSet  = Boolean(c.authToken);
        safe.fromNumber    = c.fromNumber ?? '';
      }
      if (name === 'discord') {
        safe.channelId   = c.channelId ?? '';
        safe.botTokenSet = Boolean(c.botToken);
      }
      if (name === 'slack') {
        safe.channelId   = c.channelId ?? '';
        safe.botTokenSet = Boolean(c.botToken);
      }
      return { ok: true, config: safe };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('save-channel', (_e, name, config) => {
    try { return channelEngine.saveChannel(name, config); }
    catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('remove-channel', (_e, name) => {
    try { channelEngine.removeChannel(name); return { ok: true }; }
    catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('toggle-channel', (_e, name, enabled) => {
    try { channelEngine.toggleChannel(name, enabled); return { ok: true }; }
    catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('validate-channel', async (_e, name, credentials) => {
    try {
      if (name === 'telegram') {
        const info = await channelEngine.validateTelegram(credentials.botToken);
        return { ok: true, ...info };
      }
      if (name === 'whatsapp') {
        const info = await channelEngine.validateWhatsApp(credentials.accountSid, credentials.authToken);
        return { ok: true, ...info };
      }
      if (name === 'discord') {
        const info = await channelEngine.validateDiscord(credentials.botToken);
        return { ok: true, ...info };
      }
      if (name === 'slack') {
        const info = await channelEngine.validateSlack(credentials.botToken);
        return { ok: true, ...info };
      }
      return { ok: false, error: 'Unknown channel' };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('channel-reply', (_e, id, text) => {
    try { channelEngine.resolveReply(id, text); return { ok: true }; }
    catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('save-channel-message', (_e, msg) => {
    try {
      const data = loadMessages(messageStore);
      data.messages.unshift({
        id: `chmsg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        channel: msg.channel,
        incoming: msg.incoming,
        reply: msg.reply,
        timestamp: new Date().toISOString(),
      });
      if (data.messages.length > MAX_MESSAGES) {
        data.messages.length = MAX_MESSAGES;
      }
      persistMessages(messageStore, data);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('get-channel-messages', () => {
    try {
      const data = loadMessages(messageStore);
      return { ok: true, messages: data.messages };
    } catch (err) { return { ok: false, error: err.message, messages: [] }; }
  });

  ipcMain.handle('delete-channel-message', (_e, msgId) => {
    try {
      const data = loadMessages(messageStore);
      data.messages = data.messages.filter(m => m.id !== msgId);
      persistMessages(messageStore, data);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('clear-channel-messages', () => {
    try {
      persistMessages(messageStore, { messages: [] });
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}

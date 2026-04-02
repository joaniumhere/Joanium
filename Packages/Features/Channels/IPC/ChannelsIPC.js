import { ipcMain } from 'electron';
import Paths from '../../../Main/Core/Paths.js';
import { loadJson, persistJson } from '../../../Main/Services/FileService.js';

const MAX_MESSAGES = 500;

function loadMessages() {
  return loadJson(Paths.CHANNEL_MESSAGES_FILE, { messages: [] });
}

function persistMessages(data) {
  persistJson(Paths.CHANNEL_MESSAGES_FILE, data);
}

export const ipcMeta = { needs: ['channelEngine'] };
export function register(channelEngine) {

  /* ── Get all channels (status only, no secrets) ── */
  ipcMain.handle('get-channels', () => {
    try { return { ok: true, channels: channelEngine.getAll() }; }
    catch (err) { return { ok: false, error: err.message, channels: {} }; }
  });

  /* ── Get safe channel config for pre-filling the UI ── */
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

  /* ── Save / connect a channel ── */
  ipcMain.handle('save-channel', (_e, name, config) => {
    try { return channelEngine.saveChannel(name, config); }
    catch (err) { return { ok: false, error: err.message }; }
  });

  /* ── Disconnect / remove a channel ── */
  ipcMain.handle('remove-channel', (_e, name) => {
    try { channelEngine.removeChannel(name); return { ok: true }; }
    catch (err) { return { ok: false, error: err.message }; }
  });

  /* ── Toggle a channel on/off without clearing credentials ── */
  ipcMain.handle('toggle-channel', (_e, name, enabled) => {
    try { channelEngine.toggleChannel(name, enabled); return { ok: true }; }
    catch (err) { return { ok: false, error: err.message }; }
  });

  /* ── Validate credentials ── */
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

  /* ── Reply from renderer's chat pipeline back to channel engine ──
     The renderer's Channel Gateway calls this after running the
     incoming message through agentLoop (full tools + usage tracking).
  ── */
  ipcMain.handle('channel-reply', (_e, id, text) => {
    try { channelEngine.resolveReply(id, text); return { ok: true }; }
    catch (err) { return { ok: false, error: err.message }; }
  });

  /* ══════════════════════════════════════════
     CHANNEL MESSAGE LOG — persisted to JSON
     ══════════════════════════════════════════ */

  /* ── Save a message log entry ── */
  ipcMain.handle('save-channel-message', (_e, msg) => {
    try {
      const data = loadMessages();
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
      persistMessages(data);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  /* ── Get all saved messages ── */
  ipcMain.handle('get-channel-messages', () => {
    try {
      const data = loadMessages();
      return { ok: true, messages: data.messages };
    } catch (err) { return { ok: false, error: err.message, messages: [] }; }
  });

  /* ── Delete a single message by id ── */
  ipcMain.handle('delete-channel-message', (_e, msgId) => {
    try {
      const data = loadMessages();
      data.messages = data.messages.filter(m => m.id !== msgId);
      persistMessages(data);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  /* ── Clear all messages ── */
  ipcMain.handle('clear-channel-messages', () => {
    try {
      persistMessages({ messages: [] });
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}

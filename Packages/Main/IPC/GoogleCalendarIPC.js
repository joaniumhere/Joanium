import { ipcMain } from 'electron';
import * as CalendarAPI from '../../Automation/Integrations/GoogleCalendar.js';

export function register(connectorEngine) {
  // All Calendar calls read from the unified 'google' connector
  function creds() { return connectorEngine.getCredentials('google'); }
  function notConnected() { return { ok: false, error: 'Google Workspace not connected — connect it in Settings → Connectors' }; }

  ipcMain.handle('calendar-list-calendars', async () => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const calendars = await CalendarAPI.listCalendars(c);
      return { ok: true, calendars };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-list-events', async (_e, calendarId = 'primary', opts = {}) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const events = await CalendarAPI.listEvents(c, calendarId, opts);
      return { ok: true, events };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-get-today', async () => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const events = await CalendarAPI.getTodayEvents(c);
      return { ok: true, events };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-get-upcoming', async (_e, days = 7, maxResults = 20) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const events = await CalendarAPI.getUpcomingEvents(c, days, maxResults);
      return { ok: true, events };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-search-events', async (_e, query, maxResults = 20) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!query?.trim()) return { ok: false, error: 'Query is required' };
      const events = await CalendarAPI.searchEvents(c, query, maxResults);
      return { ok: true, events };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-get-event', async (_e, calendarId, eventId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!eventId) return { ok: false, error: 'eventId is required' };
      const event = await CalendarAPI.getEvent(c, calendarId ?? 'primary', eventId);
      return { ok: true, event };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-create-event', async (_e, calendarId = 'primary', eventData) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!eventData?.summary) return { ok: false, error: 'Event summary (title) is required' };
      const event = await CalendarAPI.createEvent(c, calendarId, eventData);
      return { ok: true, event };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-update-event', async (_e, calendarId = 'primary', eventId, updates) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!eventId) return { ok: false, error: 'eventId is required' };
      const event = await CalendarAPI.updateEvent(c, calendarId, eventId, updates ?? {});
      return { ok: true, event };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('calendar-delete-event', async (_e, calendarId = 'primary', eventId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!eventId) return { ok: false, error: 'eventId is required' };
      await CalendarAPI.deleteEvent(c, calendarId, eventId);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}

import { Notification } from 'electron';

export function sendNotification(title, body = '') {
    if (!Notification.isSupported()) {
        console.warn('[AutomationEngine] Notifications not supported on this platform');
        return;
    }
    if (!title) throw new Error('sendNotification: no title provided');
    const n = new Notification({ title, body });
    n.show();
    console.log(`[AutomationEngine] sendNotification → "${title}"`);
}
import { ACTION_META } from '../Config/Constants.js';
import { escapeHtml, capitalize, generateId, timeAgo } from '../../../../../System/Utils.js';

export { escapeHtml, capitalize, generateId };

const TRIGGER_ICONS = {
    on_startup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L4.5 13H11l-1 9L20.5 11H14L13 2z" stroke-linejoin="round"/></svg>`,
    interval: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v5l3 2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    hourly: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5M12 12l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    daily: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 15a6 6 0 0 1 12 0"/><path d="M12 4v3M4 15h16" stroke-linecap="round"/><path d="M7 10 5.5 8.5M17 10l1.5-1.5" stroke-linecap="round"/></svg>`,
    weekly: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18" stroke-linecap="round"/></svg>`,
    fallback: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function formatTriggerLabel(trigger) {
    if (!trigger?.type) return 'Unknown trigger';

    switch (trigger.type) {
        case 'on_startup':
            return 'Startup';
        case 'interval': {
            const minutes = Number(trigger.minutes);
            return `Every ${Number.isFinite(minutes) && minutes > 0 ? minutes : 30}m`;
        }
        case 'hourly':
            return 'Hourly';
        case 'daily':
            return trigger.time ? `Daily ${trigger.time}` : 'Daily';
        case 'weekly': {
            const parts = [capitalize(trigger.day ?? ''), trigger.time ?? ''].filter(Boolean);
            return parts.length ? parts.join(' ') : 'Weekly';
        }
        default:
            return capitalize(String(trigger.type).replace(/_/g, ' '));
    }
}

export function getTriggerPresentation(trigger) {
    const type = trigger?.type ?? 'fallback';

    return {
        label: formatTriggerLabel(trigger),
        icon: TRIGGER_ICONS[type] ?? TRIGGER_ICONS.fallback,
    };
}

export function formatTrigger(trigger) {
    return getTriggerPresentation(trigger).label;
}

export function formatActionsSummary(actions = []) {
    if (!actions.length) return 'No actions configured';
    const label = actions.length === 1 ? '1 action' : `${actions.length} actions`;
    const types = [...new Set(actions.map(action => {
        const meta = ACTION_META[action.type];
        const base = meta?.label || action.type;
        if (action.type === 'open_folder') return base + (action.openTerminal ? ' + terminal' : '');
        if (action.type === 'run_command') return base + (action.silent ? ' (silent)' : '');
        return base;
    }))];
    return `${label}: ${types.join(', ')}`;
}

export function formatLastRun(lastRun) {
    if (!lastRun) return '';
    return `Last run: ${timeAgo(lastRun)}`;
}

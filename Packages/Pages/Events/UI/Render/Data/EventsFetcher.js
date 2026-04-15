const CHANNEL_LABELS = Object.freeze({
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  discord: 'Discord',
  slack: 'Slack',
});

function channelLabel(name) {
  return CHANNEL_LABELS[name] ?? name ?? 'Channel';
}

export async function fetchHistory() {
  const events = [];
  try {
    const res = await window.electronAPI?.invoke?.('get-agents'),
      agents = Array.isArray(res?.agents) ? res.agents : [];
    for (const agent of agents)
      for (const entry of agent.history ?? [])
        events.push({
          id: `agent__${agent.id}__${entry.timestamp}`,
          type: 'agent',
          source: agent.name,
          agentId: agent.id,
          status: entry.error ? 'error' : 'success',
          timestamp: entry.timestamp,
          summary: entry.summary || '',
          fullResponse: entry.fullResponse || '',
          error: entry.error || null,
          skipReason: null,
          trigger: agent.trigger || null,
          agentEnabled: agent.enabled,
        });
  } catch {}
  try {
    const res = await window.electronAPI?.invoke?.('get-automations'),
      automations = Array.isArray(res?.automations) ? res.automations : [];
    for (const automation of automations)
      for (const job of automation.jobs ?? [])
        for (const entry of job.history ?? []) {
          const status = entry.error
            ? 'error'
            : entry.nothingToReport || entry.skipped
              ? 'skipped'
              : 'success';
          events.push({
            id: `auto__${automation.id}__${job.id}__${entry.timestamp}`,
            type: 'automation',
            source: automation.name,
            autoId: automation.id,
            jobId: job.id,
            jobName: job.name || 'Job',
            status: status,
            timestamp: entry.timestamp,
            summary: entry.summary || '',
            fullResponse: entry.fullResponse || '',
            error: entry.error || null,
            skipReason: entry.skipReason || null,
            trigger: job.trigger || null,
            autoEnabled: automation.enabled,
          });
        }
  } catch {}
  try {
    const res = await window.electronAPI?.invoke?.('get-channel-messages'),
      messages = Array.isArray(res?.messages) ? res.messages : [];
    for (const [index, entry] of messages.entries()) {
      const timestamp =
          entry.receivedAt || entry.timestamp || entry.repliedAt || new Date().toISOString(),
        channelName = channelLabel(entry.channel);
      events.push({
        id: entry.id || `channel__${entry.channel ?? 'unknown'}__${timestamp}__${index}`,
        type: 'channel',
        source: channelName,
        channel: entry.channel || 'channel',
        status: entry.error || 'error' === entry.status ? 'error' : 'success',
        timestamp: timestamp,
        summary: entry.incoming || '',
        fullResponse: entry.reply || '',
        replyText: entry.reply || '',
        inboundMessage: entry.incoming || '',
        channelFrom: entry.from || 'User',
        jobName: entry.from || 'User',
        error: entry.error || null,
        skipReason: null,
        trigger: null,
        receivedAt: entry.receivedAt || timestamp,
        repliedAt: entry.repliedAt || entry.timestamp || null,
        provider: entry.provider || null,
        model: entry.model || null,
        externalId: entry.externalId || null,
        targetId: entry.targetId || null,
        conversationId: entry.conversationId || null,
      });
    }
  } catch {}
  return (
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    events.slice(0, 200)
  );
}
export async function fetchRunning() {
  try {
    const res = await window.electronAPI?.invoke?.('get-running-jobs');
    return Array.isArray(res?.running) ? res.running : [];
  } catch {
    return [];
  }
}

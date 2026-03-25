export const MAX_JOBS = 5;

export const DATA_SOURCE_TYPES = [
  { value: 'gmail_inbox', label: '\u{1F4E7} Gmail - Unread inbox', group: 'Email' },
  { value: 'gmail_search', label: '\u{1F4E7} Gmail - Search emails', group: 'Email' },
  { value: 'github_notifications', label: '\u{1F419} GitHub - Notifications', group: 'GitHub' },
  { value: 'github_repos', label: '\u{1F419} GitHub - All my repos', group: 'GitHub' },
  { value: 'github_prs', label: '\u{1F419} GitHub - Pull requests', group: 'GitHub' },
  { value: 'github_issues', label: '\u{1F419} GitHub - Issues', group: 'GitHub' },
  { value: 'github_commits', label: '\u{1F419} GitHub - Recent commits', group: 'GitHub' },
  { value: 'rss_feed', label: '\u{1F4E1} RSS / Atom Feed', group: 'Web & Feeds' },
  { value: 'reddit_posts', label: '\u{1F534} Reddit - Subreddit posts', group: 'Web & Feeds' },
  { value: 'hacker_news', label: '\u{1F536} Hacker News - Top stories', group: 'Web & Feeds' },
  { value: 'fetch_url', label: '\u{1F310} Fetch URL - Any web page', group: 'Web & Feeds' },
  { value: 'weather', label: '\u{1F324}\uFE0F Weather - Current conditions', group: 'System & Data' },
  { value: 'crypto_price', label: '\u{1FA99} Crypto - Live prices', group: 'System & Data' },
  { value: 'system_stats', label: '\u{1F5A5}\uFE0F System Stats - CPU / Memory', group: 'System & Data' },
  { value: 'read_file', label: '\u{1F4C4} Read File - Local file', group: 'System & Data' },
  { value: 'custom_context', label: '\u270D\uFE0F Custom - Provide context directly', group: 'Other' },
];

export const OUTPUT_TYPES = [
  { value: 'send_email', label: '\u{1F4E7} Send email via Gmail', group: 'Messaging' },
  { value: 'send_notification', label: '\u{1F514} Desktop notification', group: 'Messaging' },
  { value: 'write_file', label: '\u{1F4DD} Write to a file', group: 'Files' },
  { value: 'append_to_memory', label: '\u{1F9E0} Append to AI Memory', group: 'AI' },
  { value: 'http_webhook', label: '\u{1F310} HTTP webhook / POST', group: 'Webhooks' },
];

export const INSTRUCTION_TEMPLATES = {
  gmail_inbox: 'Read these emails. Identify the most important ones needing action today. For each: subject, sender, what action is needed, and urgency. Then briefly list FYI emails.',
  gmail_search: 'Analyze these matching emails. Summarize findings, highlight patterns and urgent items.',
  github_notifications: 'Review these GitHub notifications. Group by type (PR reviews needed, mentions, issues). List immediate action items first.',
  github_repos: 'Review my repositories. Identify any that have open PRs, recent issues, or activity needing attention. Summarize what needs my focus.',
  github_prs: 'Analyze these pull requests. For each: what it does, readiness to merge, concerns, who needs to act.',
  github_issues: 'Review these issues. Categorize by priority. Identify blocked, needs-clarification, or closeable items.',
  github_commits: 'Analyze recent commits. Summarize what changed and flag any risky or large changes.',
  rss_feed: 'Read these feed articles. Identify the most relevant and interesting items. Summarize key developments.',
  reddit_posts: 'Review these posts. Identify trending topics, significant discussions, and anything worth knowing.',
  hacker_news: 'Summarize the most relevant stories. Focus on AI, engineering, and startup news. Give a brief insight for each.',
  fetch_url: 'Read and analyze this content. Extract key information and anything actionable.',
  weather: 'Based on current weather, provide a practical briefing: what to wear, any warnings, how it affects outdoor plans.',
  crypto_price: 'Analyze these prices and 24h changes. Flag significant moves (>5%), note any trends.',
  system_stats: 'Analyze these system stats. Flag any concerning resource usage. Provide a brief health assessment.',
  read_file: 'Analyze this file content. Summarize key information, patterns, and anything actionable.',
  custom_context: 'Analyze the provided information and give a thoughtful, useful response.',
};

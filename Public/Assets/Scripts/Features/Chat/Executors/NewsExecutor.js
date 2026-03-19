// openworld — Features/Chat/Executors/NewsExecutor.js
import { safeJson } from './utils.js';

const HANDLED = new Set(['get_news']);

export function handles(toolName) { return HANDLED.has(toolName); }

export async function execute(toolName, params, onStage = () => { }) {
    if (toolName !== 'get_news') throw new Error(`NewsExecutor: unknown tool "${toolName}"`);

    const { query, category, country, count = 5 } = params;
    onStage(`📰 Fetching latest news…`);

    // Try newsdata.io with optional API key
    let apiKey = '';
    try {
        const config = await window.electronAPI?.getFreeConnectorConfig?.('newsdata');
        apiKey = config?.credentials?.apiKey?.trim() ?? '';
    } catch { /* optional */ }

    if (!apiKey) {
        // Fallback: use GNews free API (no key, 10 req/day but good enough)
        onStage(`📰 Fetching news from GNews…`);
        const max = Math.min(count, 10);
        let url = `https://gnews.io/api/v4/top-headlines?lang=en&max=${max}&apikey=`;

        // GNews needs a key too — let's use a different free approach:
        // Use Wikipedia's "In the news" current events or an RSS-to-JSON service
        // Best free option: use newsapi.org alternative → wikimedia current events
        // Actually let's use the free tier of gnews or a proxy

        // Use a reliable free news source — RSS feed via rss2json
        const rssQuery = query ? encodeURIComponent(query) : 'world';
        const rssUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=${rssQuery}%26hl=en&count=${max}`;

        try {
            const data = await safeJson(rssUrl);
            if (data.status === 'ok' && data.items?.length) {
                const articles = data.items.slice(0, max);
                const newsLines = articles.map((a, i) => {
                    const date = a.pubDate ? new Date(a.pubDate).toLocaleDateString() : '';
                    return [
                        `${i + 1}. **${a.title}**`,
                        `   ${date}${a.author ? ` · ${a.author}` : ''}`,
                        `   🔗 ${a.link}`,
                    ].join('\n');
                }).join('\n\n');

                return [
                    `📰 Latest News${query ? ` — "${query}"` : ''}`,
                    ``,
                    newsLines,
                    ``,
                    `Source: Google News via RSS`,
                    `💡 Tip: Add a free API key in Settings → Connectors → News for better results.`,
                ].join('\n');
            }
        } catch { /* fall through */ }

        return [
            `📰 News search requires an API key for reliable results.`,
            ``,
            `To set up:`,
            `1. Go to newsdata.io and create a free account`,
            `2. Copy your API key`,
            `3. In openworld: Settings → Connectors → News → Add key`,
            ``,
            `Free tier: 200 requests/day — plenty for personal use.`,
        ].join('\n');
    }

    // With API key — use newsdata.io
    onStage(`📰 Fetching from Newsdata.io…`);
    const max = Math.min(count, 10);
    let url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&language=en&size=${max}`;

    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (country) url += `&country=${encodeURIComponent(country)}`;

    const data = await safeJson(url);
    const articles = data.results ?? [];
    if (!articles.length) {
        return `No news articles found${query ? ` for "${query}"` : ''}. Try broader search terms.`;
    }

    const newsLines = articles.slice(0, max).map((a, i) => {
        const date = a.pubDate ? new Date(a.pubDate).toLocaleDateString() : '';
        const source = a.source_name ?? a.source_id ?? '';
        return [
            `${i + 1}. **${a.title}**`,
            `   ${source}${date ? ` · ${date}` : ''}`,
            a.description ? `   ${a.description.slice(0, 150)}${a.description.length > 150 ? '…' : ''}` : '',
            `   🔗 ${a.link}`,
        ].filter(Boolean).join('\n');
    }).join('\n\n');

    return [
        `📰 Latest News${query ? ` — "${query}"` : ''}${category ? ` (${category})` : ''}`,
        ``,
        newsLines,
        ``,
        `Source: Newsdata.io`,
    ].join('\n');
}

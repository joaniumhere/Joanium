import * as NotionAPI from '../API/NotionAPI.js';
import { requireNotionCredentials } from '../Shared/Common.js';

export const notionDataSourceCollectors = {
  async notion_recent_pages(ctx) {
    const creds = requireNotionCredentials(ctx);
    const pages = await NotionAPI.searchPages(creds, '', 20);
    if (!pages.length) return 'EMPTY: No Notion pages found.';
    return `Notion Pages — ${pages.length} recently edited:\n\n${pages
      .map(
        (p, i) =>
          `${i + 1}. ${p.title} — last edited ${p.lastEdited ? new Date(p.lastEdited).toLocaleDateString() : 'unknown'}`,
      )
      .join('\n')}`;
  },
};

export const notionOutputHandlers = {};

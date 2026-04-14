import * as NotionAPI from '../API/NotionAPI.js';
import { getNotionCredentials, notConnected } from '../Shared/Common.js';

export async function executeNotionChatTool(ctx, toolName, params) {
  const creds = getNotionCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'notion_search_pages') {
      const pages = await NotionAPI.searchPages(creds, params?.query ?? '', 20);
      return { ok: true, pages };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

import * as NotionAPI from '../API/NotionAPI.js';
import { getNotionCredentials, notConnected } from '../Shared/Common.js';

export async function executeNotionChatTool(ctx, toolName, params) {
  const creds = getNotionCredentials(ctx);
  if (!creds) return notConnected();

  try {
    // ─── Pages ───────────────────────────────────────────────────────────────

    if (toolName === 'notion_search_pages') {
      const pages = await NotionAPI.searchPages(creds, params?.query ?? '', 20);
      return { ok: true, pages };
    }

    if (toolName === 'notion_get_page') {
      const page = await NotionAPI.getPage(creds, params.page_id);
      return { ok: true, page };
    }

    if (toolName === 'notion_create_page') {
      const result = await NotionAPI.createPage(creds, {
        parentId: params.parent_id,
        parentType: params.parent_type ?? 'page_id',
        title: params.title,
      });
      return { ok: true, ...result };
    }

    if (toolName === 'notion_update_page_title') {
      const result = await NotionAPI.updatePageTitle(creds, params.page_id, params.new_title);
      return { ok: true, ...result };
    }

    if (toolName === 'notion_archive_page') {
      const result = await NotionAPI.archivePage(creds, params.page_id);
      return { ok: true, ...result };
    }

    if (toolName === 'notion_get_page_property') {
      const data = await NotionAPI.getPageProperty(creds, params.page_id, params.property_id);
      return { ok: true, property: data };
    }

    if (toolName === 'notion_create_page_with_content') {
      const result = await NotionAPI.createPageWithContent(creds, {
        parentId: params.parent_id,
        parentType: params.parent_type ?? 'page_id',
        title: params.title,
        contentBlocks: params.content_blocks ?? [],
      });
      return { ok: true, ...result };
    }

    // ─── Blocks ───────────────────────────────────────────────────────────────

    if (toolName === 'notion_get_page_content') {
      const blocks = await NotionAPI.getBlockChildren(creds, params.block_id, params.limit ?? 50);
      return { ok: true, blocks };
    }

    if (toolName === 'notion_append_text_block') {
      const blocks = await NotionAPI.appendTextBlock(creds, params.block_id, params.text);
      return { ok: true, blocks };
    }

    if (toolName === 'notion_append_todo_block') {
      const blocks = await NotionAPI.appendTodoBlock(
        creds,
        params.block_id,
        params.text,
        params.checked ?? false,
      );
      return { ok: true, blocks };
    }

    if (toolName === 'notion_append_heading_block') {
      const blocks = await NotionAPI.appendHeadingBlock(
        creds,
        params.block_id,
        params.text,
        params.level ?? 2,
      );
      return { ok: true, blocks };
    }

    if (toolName === 'notion_append_bullet_list') {
      const blocks = await NotionAPI.appendBulletList(creds, params.block_id, params.items ?? []);
      return { ok: true, blocks };
    }

    if (toolName === 'notion_append_numbered_list') {
      const blocks = await NotionAPI.appendNumberedList(creds, params.block_id, params.items ?? []);
      return { ok: true, blocks };
    }

    if (toolName === 'notion_append_code_block') {
      const blocks = await NotionAPI.appendCodeBlock(
        creds,
        params.block_id,
        params.code,
        params.language ?? 'plain text',
      );
      return { ok: true, blocks };
    }

    if (toolName === 'notion_append_divider') {
      const blocks = await NotionAPI.appendDivider(creds, params.block_id);
      return { ok: true, blocks };
    }

    if (toolName === 'notion_delete_block') {
      const result = await NotionAPI.deleteBlock(creds, params.block_id);
      return { ok: true, ...result };
    }

    if (toolName === 'notion_get_block_children') {
      const blocks = await NotionAPI.getBlockChildren(creds, params.block_id, params.limit ?? 50);
      return { ok: true, blocks };
    }

    // ─── Databases ────────────────────────────────────────────────────────────

    if (toolName === 'notion_search_databases') {
      const databases = await NotionAPI.searchDatabases(creds, params?.limit ?? 20);
      return { ok: true, databases };
    }

    if (toolName === 'notion_get_database') {
      const database = await NotionAPI.getDatabase(creds, params.database_id);
      return { ok: true, database };
    }

    if (toolName === 'notion_get_database_schema') {
      const schema = await NotionAPI.getDatabaseSchema(creds, params.database_id);
      return { ok: true, schema };
    }

    if (toolName === 'notion_query_database') {
      const entries = await NotionAPI.queryDatabase(creds, params.database_id, params.limit ?? 20);
      return { ok: true, entries };
    }

    if (toolName === 'notion_filter_database') {
      const entries = await NotionAPI.filterDatabase(
        creds,
        params.database_id,
        params.filter,
        params.limit ?? 20,
      );
      return { ok: true, entries };
    }

    if (toolName === 'notion_create_database') {
      const result = await NotionAPI.createDatabase(creds, {
        parentPageId: params.parent_page_id,
        title: params.title,
        properties: params.properties ?? {},
      });
      return { ok: true, ...result };
    }

    if (toolName === 'notion_create_database_entry') {
      const result = await NotionAPI.createDatabaseEntry(creds, params.database_id, {
        title: params.title,
        properties: params.properties ?? {},
      });
      return { ok: true, ...result };
    }

    if (toolName === 'notion_update_database_entry') {
      const result = await NotionAPI.updateDatabaseEntry(creds, params.page_id, params.properties);
      return { ok: true, ...result };
    }

    if (toolName === 'notion_archive_database_entry') {
      const result = await NotionAPI.archiveDatabaseEntry(creds, params.page_id);
      return { ok: true, ...result };
    }

    // ─── Comments ─────────────────────────────────────────────────────────────

    if (toolName === 'notion_get_comments') {
      const comments = await NotionAPI.getComments(creds, params.block_id);
      return { ok: true, comments };
    }

    if (toolName === 'notion_add_comment') {
      const result = await NotionAPI.addComment(creds, params.page_id, params.text);
      return { ok: true, ...result };
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    if (toolName === 'notion_get_users') {
      const users = await NotionAPI.getUsers(creds, params?.limit ?? 50);
      return { ok: true, users };
    }

    if (toolName === 'notion_get_user') {
      const user = await NotionAPI.getUser(creds, params.user_id);
      return { ok: true, user };
    }

    if (toolName === 'notion_get_bot_info') {
      const bot = await NotionAPI.getBot(creds);
      return { ok: true, bot };
    }

    return null; // unknown tool
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

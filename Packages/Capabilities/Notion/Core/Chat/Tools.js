export const NOTION_TOOLS = [
  // ─── Pages ─────────────────────────────────────────────────────────────────
  {
    name: 'notion_search_pages',
    description: 'Search Notion pages and return their titles, URLs, and last-edited times.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      query: {
        type: 'string',
        required: false,
        description: 'Search query. Leave blank to get the most recently edited pages.',
      },
    },
  },
  {
    name: 'notion_get_page',
    description:
      'Retrieve full metadata for a single Notion page by its ID, including all properties, URL, and timestamps.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The Notion page ID (UUID format).',
      },
    },
  },
  {
    name: 'notion_create_page',
    description: 'Create a new Notion page as a child of an existing page or database.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      parent_id: {
        type: 'string',
        required: true,
        description: 'ID of the parent page or database.',
      },
      parent_type: {
        type: 'string',
        required: false,
        description: 'Either "page_id" (default) or "database_id".',
      },
      title: {
        type: 'string',
        required: false,
        description: 'Title of the new page.',
      },
    },
  },
  {
    name: 'notion_update_page_title',
    description: 'Rename an existing Notion page by updating its title property.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the page to rename.',
      },
      new_title: {
        type: 'string',
        required: true,
        description: 'The new title for the page.',
      },
    },
  },
  {
    name: 'notion_archive_page',
    description:
      'Archive (soft-delete) a Notion page so it no longer appears in search or the workspace.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The ID of the page to archive.',
      },
    },
  },
  {
    name: 'notion_get_page_property',
    description: 'Retrieve the value of a specific property on a Notion page by property ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The Notion page ID.',
      },
      property_id: {
        type: 'string',
        required: true,
        description: 'The property ID to retrieve (visible in notion_get_page results).',
      },
    },
  },
  {
    name: 'notion_create_page_with_content',
    description:
      'Create a new Notion page and immediately populate it with one or more paragraph blocks of text.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      parent_id: {
        type: 'string',
        required: true,
        description: 'ID of the parent page.',
      },
      title: {
        type: 'string',
        required: false,
        description: 'Title of the new page.',
      },
      content_blocks: {
        type: 'array',
        required: true,
        description: 'Array of strings — each becomes a paragraph block in the page body.',
      },
    },
  },

  // ─── Blocks ─────────────────────────────────────────────────────────────────
  {
    name: 'notion_get_page_content',
    description:
      'Retrieve all top-level content blocks of a Notion page, including their type, text, and whether they have nested children.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'Page ID or block ID to read children from.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of blocks to return (default 50).',
      },
    },
  },
  {
    name: 'notion_append_text_block',
    description: 'Append a plain paragraph of text to the end of a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The paragraph text to append.',
      },
    },
  },
  {
    name: 'notion_append_todo_block',
    description: 'Append a to-do (checkbox) item to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The to-do item text.',
      },
      checked: {
        type: 'boolean',
        required: false,
        description: 'Whether the to-do should start as checked. Defaults to false.',
      },
    },
  },
  {
    name: 'notion_append_heading_block',
    description: 'Append a heading (H1, H2, or H3) to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'Heading text.',
      },
      level: {
        type: 'number',
        required: false,
        description: 'Heading level: 1, 2, or 3. Defaults to 2.',
      },
    },
  },
  {
    name: 'notion_append_bullet_list',
    description: 'Append one or more bulleted list items to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      items: {
        type: 'array',
        required: true,
        description: 'Array of strings — each becomes a separate bullet item.',
      },
    },
  },
  {
    name: 'notion_append_numbered_list',
    description: 'Append one or more numbered list items to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      items: {
        type: 'array',
        required: true,
        description: 'Array of strings — each becomes a sequential numbered list item.',
      },
    },
  },
  {
    name: 'notion_append_code_block',
    description: 'Append a code block with syntax highlighting to a Notion page or block.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append to.',
      },
      code: {
        type: 'string',
        required: true,
        description: 'The code content to display.',
      },
      language: {
        type: 'string',
        required: false,
        description:
          'Programming language for syntax highlighting (e.g. "javascript", "python"). Defaults to "plain text".',
      },
    },
  },
  {
    name: 'notion_append_divider',
    description:
      'Append a horizontal divider line to a Notion page or block to visually separate sections.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'ID of the page or block to append the divider to.',
      },
    },
  },
  {
    name: 'notion_delete_block',
    description:
      'Permanently delete (archive) a specific block from a Notion page by its block ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'The ID of the block to delete.',
      },
    },
  },
  {
    name: 'notion_get_block_children',
    description:
      'Retrieve the nested child blocks of any Notion block, useful for reading toggle lists, columns, or synced blocks.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'The parent block ID whose children you want to retrieve.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of child blocks to return (default 50).',
      },
    },
  },

  // ─── Databases ───────────────────────────────────────────────────────────────
  {
    name: 'notion_search_databases',
    description:
      'List all Notion databases the integration can access, sorted by most recently edited.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of databases to return (default 20).',
      },
    },
  },
  {
    name: 'notion_get_database',
    description: 'Retrieve metadata and property names for a specific Notion database.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID.',
      },
    },
  },
  {
    name: 'notion_get_database_schema',
    description:
      'Return the full property schema (column definitions) of a Notion database, including each property name, type, and ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID.',
      },
    },
  },
  {
    name: 'notion_query_database',
    description:
      'Retrieve all entries (pages) in a Notion database, returning their IDs, URLs, and raw properties.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to query.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of entries to return (default 20).',
      },
    },
  },
  {
    name: 'notion_filter_database',
    description:
      'Query a Notion database with a filter condition, such as matching a select property, checkbox, date range, or text value.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to filter.',
      },
      filter: {
        type: 'object',
        required: true,
        description:
          'A Notion filter object, e.g. { "property": "Status", "select": { "equals": "In Progress" } }.',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of results (default 20).',
      },
    },
  },
  {
    name: 'notion_create_database',
    description:
      'Create a new inline Notion database as a child of an existing page, with a given title and optional property schema.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      parent_page_id: {
        type: 'string',
        required: true,
        description: 'ID of the page that will contain the new database.',
      },
      title: {
        type: 'string',
        required: true,
        description: 'Title of the new database.',
      },
      properties: {
        type: 'object',
        required: false,
        description:
          'Optional Notion property schema object for additional columns (Name/title column is always added automatically).',
      },
    },
  },
  {
    name: 'notion_create_database_entry',
    description:
      'Create a new row (page) in a Notion database with a title and optional property values.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      database_id: {
        type: 'string',
        required: true,
        description: 'The Notion database ID to add the entry to.',
      },
      title: {
        type: 'string',
        required: false,
        description: 'Value for the Name/title property of the new entry.',
      },
      properties: {
        type: 'object',
        required: false,
        description:
          'Additional Notion property values to set on the entry (using Notion property value shape).',
      },
    },
  },
  {
    name: 'notion_update_database_entry',
    description: 'Update one or more property values on an existing Notion database entry (page).',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID of the database entry to update.',
      },
      properties: {
        type: 'object',
        required: true,
        description: 'Notion property values to update, keyed by property name.',
      },
    },
  },
  {
    name: 'notion_archive_database_entry',
    description:
      'Archive (remove) an entry from a Notion database without permanently deleting it.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID of the database entry to archive.',
      },
    },
  },

  // ─── Comments ────────────────────────────────────────────────────────────────
  {
    name: 'notion_get_comments',
    description: 'Retrieve all comments on a Notion page, including their text and timestamps.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      block_id: {
        type: 'string',
        required: true,
        description: 'The page or block ID to fetch comments for.',
      },
    },
  },
  {
    name: 'notion_add_comment',
    description: 'Post a new comment on a Notion page.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      page_id: {
        type: 'string',
        required: true,
        description: 'The page ID to comment on.',
      },
      text: {
        type: 'string',
        required: true,
        description: 'The comment text to post.',
      },
    },
  },

  // ─── Users ───────────────────────────────────────────────────────────────────
  {
    name: 'notion_get_users',
    description:
      'List all members (people and bots) in the Notion workspace, including their names and email addresses.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of users to return (default 50).',
      },
    },
  },
  {
    name: 'notion_get_user',
    description:
      'Retrieve profile information for a specific Notion workspace member by their user ID.',
    category: 'notion',
    connectorId: 'notion',
    parameters: {
      user_id: {
        type: 'string',
        required: true,
        description: 'The Notion user ID (UUID format).',
      },
    },
  },
  {
    name: 'notion_get_bot_info',
    description:
      "Return information about the integration's bot user, including its name and the workspace it belongs to.",
    category: 'notion',
    connectorId: 'notion',
    parameters: {},
  },
];

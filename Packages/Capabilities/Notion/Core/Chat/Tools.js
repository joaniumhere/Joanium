export const NOTION_TOOLS = [
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
];

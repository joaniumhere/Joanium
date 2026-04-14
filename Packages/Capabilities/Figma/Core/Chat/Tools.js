export const FIGMA_TOOLS = [
  {
    name: 'figma_get_file_info',
    description:
      'Get metadata about a Figma file — name, pages, last modified date, component count, and style count.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key — found in the URL: figma.com/file/<KEY>/...',
      },
    },
  },
];

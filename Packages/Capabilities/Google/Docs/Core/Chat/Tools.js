export const DOCS_TOOLS = [
  {
    name: 'docs_get_info',
    description:
      'Get metadata about a Google Doc — title, document ID, character count, and a direct edit link.',
    category: 'docs',
    parameters: {
      document_id: {
        type: 'string',
        required: true,
        description: 'Google Doc document ID (from the URL).',
      },
    },
  },
  {
    name: 'docs_read',
    description:
      'Read the full text content of a Google Doc, including table text. Returns up to 30,000 characters.',
    category: 'docs',
    parameters: {
      document_id: { type: 'string', required: true, description: 'Google Doc document ID.' },
    },
  },
  {
    name: 'docs_create',
    description: 'Create a new blank Google Doc with a given title.',
    category: 'docs',
    parameters: {
      title: { type: 'string', required: true, description: 'Title for the new document.' },
    },
  },
  {
    name: 'docs_append_text',
    description: 'Append text to the end of an existing Google Doc.',
    category: 'docs',
    parameters: {
      document_id: { type: 'string', required: true, description: 'Google Doc document ID.' },
      text: { type: 'string', required: true, description: 'Text content to append.' },
    },
  },
  {
    name: 'docs_prepend_text',
    description: 'Insert text at the very beginning of an existing Google Doc.',
    category: 'docs',
    parameters: {
      document_id: { type: 'string', required: true, description: 'Google Doc document ID.' },
      text: { type: 'string', required: true, description: 'Text content to prepend.' },
    },
  },
  {
    name: 'docs_insert_text',
    description:
      'Insert text at a specific character index in a Google Doc. Use docs_read first to understand the document structure. Index 1 is the very start of the document body.',
    category: 'docs',
    parameters: {
      document_id: { type: 'string', required: true, description: 'Google Doc document ID.' },
      text: { type: 'string', required: true, description: 'Text content to insert.' },
      index: {
        type: 'number',
        required: false,
        description: 'Character index at which to insert the text. Defaults to 1 (start of body).',
      },
    },
  },
  {
    name: 'docs_replace_text',
    description: 'Find and replace all occurrences of a string in a Google Doc.',
    category: 'docs',
    parameters: {
      document_id: { type: 'string', required: true, description: 'Google Doc document ID.' },
      search_text: {
        type: 'string',
        required: true,
        description: 'The text to search for (case-sensitive).',
      },
      replacement: { type: 'string', required: true, description: 'The text to replace it with.' },
    },
  },
  {
    name: 'docs_delete_range',
    description:
      'Delete a range of characters from a Google Doc by start and end index. Use docs_read first to identify the correct indices.',
    category: 'docs',
    parameters: {
      document_id: { type: 'string', required: true, description: 'Google Doc document ID.' },
      start_index: {
        type: 'number',
        required: true,
        description: 'Inclusive start character index of the range to delete.',
      },
      end_index: {
        type: 'number',
        required: true,
        description: 'Exclusive end character index of the range to delete.',
      },
    },
  },
  {
    name: 'docs_clear_content',
    description:
      'Delete all body text from a Google Doc, leaving it blank. This is irreversible — confirm with the user before calling.',
    category: 'docs',
    parameters: {
      document_id: { type: 'string', required: true, description: 'Google Doc document ID.' },
    },
  },
];

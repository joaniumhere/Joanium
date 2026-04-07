export const MEMORY_TOOLS = [
  {
    name: 'list_personal_memory_files',
    description:
      'List the available personal memory markdown files, what each file is for, and whether it already contains facts. These files contain only personal context, not workspace, code, or project details.',
    category: 'utility',
    parameters: {},
  },
  {
    name: 'search_personal_memory',
    description:
      "Search the user's personal memory files for relevant topics like favorite music, family, education, support preferences, or communication style without loading every file.",
    category: 'utility',
    parameters: {
      query: {
        type: 'string',
        required: true,
        description:
          'What to look for in personal memory, for example "music they love", "how to cheer them up", or "family context".',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Maximum number of matching files to return (default: 5, max: 12).',
      },
    },
  },
  {
    name: 'read_personal_memory_files',
    description:
      'Read one or more specific personal memory markdown files by filename. Use this for personal, emotional, or preference-based replies. Do not use it for coding, debugging, or repo work unless the user explicitly asks about personal memory.',
    category: 'utility',
    parameters: {
      files: {
        type: 'array',
        required: true,
        description: 'Array of memory filenames to read, such as ["Likes.md", "Support.md"].',
      },
    },
  },
];

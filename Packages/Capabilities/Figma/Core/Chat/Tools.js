export const FIGMA_TOOLS = [
  // ─── Files ─────────────────────────────────────────────────────────────────
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
  {
    name: 'figma_get_file_nodes',
    description:
      'Fetch detailed data for one or more specific nodes inside a Figma file by their node IDs. Useful for inspecting frames, groups, or components.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        required: true,
        description: 'Array of node IDs to fetch (e.g. ["1:2", "3:4"]).',
      },
    },
  },
  {
    name: 'figma_get_file_page',
    description:
      'Get the contents of a specific page within a Figma file, including all direct children (frames, groups, components) on that page.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      page_id: {
        type: 'string',
        required: true,
        description: 'The page node ID (e.g. "0:1"). Retrieve page IDs from figma_get_file_info.',
      },
    },
  },
  {
    name: 'figma_get_file_versions',
    description:
      'List the version history of a Figma file, including named saves, autosaves, and who created each version.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_get_file_thumbnail',
    description:
      'Retrieve the thumbnail URL for a Figma file so it can be previewed or linked in messages.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_get_file_components',
    description:
      'List all components defined inside a specific Figma file, with their names, keys, descriptions, and node IDs.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_get_file_styles',
    description:
      'List all styles (color, text, effect, grid) defined in a Figma file, including their types, names, and keys.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_get_image_fills',
    description:
      'Retrieve the download URLs for all image fills used within a Figma file (images embedded as fills on shapes or frames).',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },

  // ─── Export / Render ───────────────────────────────────────────────────────
  {
    name: 'figma_export_nodes_png',
    description:
      'Export one or more Figma nodes as PNG images and return their download URLs. Great for previewing specific frames or components.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        required: true,
        description: 'Array of node IDs to export.',
      },
      scale: {
        type: 'number',
        required: false,
        description: 'Export scale multiplier (0.01–4). Defaults to 1.',
      },
    },
  },
  {
    name: 'figma_export_nodes_svg',
    description:
      'Export one or more Figma nodes as SVG files and return their download URLs. Ideal for icons or vector assets.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        required: true,
        description: 'Array of node IDs to export as SVG.',
      },
    },
  },
  {
    name: 'figma_export_nodes_pdf',
    description:
      'Export one or more Figma frames or nodes as PDF files and return their download URLs.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        required: true,
        description: 'Array of node IDs to export as PDF.',
      },
    },
  },
  {
    name: 'figma_export_nodes_jpg',
    description: 'Export one or more Figma nodes as JPEG images and return their download URLs.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      node_ids: {
        type: 'array',
        items: { type: 'string' },
        required: true,
        description: 'Array of node IDs to export as JPEG.',
      },
      scale: {
        type: 'number',
        required: false,
        description: 'Export scale multiplier (0.01–4). Defaults to 1.',
      },
    },
  },

  // ─── Comments ──────────────────────────────────────────────────────────────
  {
    name: 'figma_get_file_comments',
    description:
      'Retrieve all comments on a Figma file, including their author, message text, creation time, and resolved status.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_post_comment',
    description: 'Post a new comment on a Figma file. Optionally anchor it to a specific node.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      message: {
        type: 'string',
        required: true,
        description: 'The comment text to post.',
      },
      node_id: {
        type: 'string',
        required: false,
        description: 'Optional node ID to anchor the comment to a specific frame or element.',
      },
    },
  },
  {
    name: 'figma_delete_comment',
    description:
      'Delete a specific comment from a Figma file by its comment ID. Only works on comments the authenticated user owns.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      comment_id: {
        type: 'string',
        required: true,
        description: 'ID of the comment to delete.',
      },
    },
  },
  {
    name: 'figma_resolve_comment',
    description: 'Mark a comment on a Figma file as resolved.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      comment_id: {
        type: 'string',
        required: true,
        description: 'ID of the comment to resolve.',
      },
    },
  },

  // ─── Teams & Projects ──────────────────────────────────────────────────────
  {
    name: 'figma_get_team_projects',
    description:
      'List all projects within a Figma team. Returns project IDs and names that can be used with figma_get_project_files.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      team_id: {
        type: 'string',
        required: true,
        description: 'Figma team ID — found in the URL when viewing a team page.',
      },
    },
  },
  {
    name: 'figma_get_project_files',
    description:
      'List all files inside a Figma project, including file names, keys, thumbnail URLs, and last-modified timestamps.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      project_id: {
        type: 'string',
        required: true,
        description: 'Figma project ID. Get this from figma_get_team_projects.',
      },
    },
  },

  // ─── Components ────────────────────────────────────────────────────────────
  {
    name: 'figma_get_team_components',
    description:
      'List all published components in a Figma team library, with names, keys, file origins, and thumbnail URLs.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      team_id: {
        type: 'string',
        required: true,
        description: 'Figma team ID.',
      },
    },
  },
  {
    name: 'figma_get_component',
    description:
      'Get detailed information about a single published Figma component by its key, including name, description, file origin, and thumbnail.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      component_key: {
        type: 'string',
        required: true,
        description: 'The unique key of the Figma component.',
      },
    },
  },
  {
    name: 'figma_get_team_component_sets',
    description: 'List all published component sets (variants) in a Figma team library.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      team_id: {
        type: 'string',
        required: true,
        description: 'Figma team ID.',
      },
    },
  },
  {
    name: 'figma_get_component_set',
    description:
      'Get detailed metadata for a single Figma component set (a group of component variants) by its key.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      component_set_key: {
        type: 'string',
        required: true,
        description: 'The unique key of the Figma component set.',
      },
    },
  },

  // ─── Styles ────────────────────────────────────────────────────────────────
  {
    name: 'figma_get_team_styles',
    description:
      'List all published styles in a Figma team library (colors, text styles, effects, grids), including their types, names, and file origins.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      team_id: {
        type: 'string',
        required: true,
        description: 'Figma team ID.',
      },
    },
  },
  {
    name: 'figma_get_style',
    description:
      'Get detailed metadata for a single published Figma style by its key, including its type, description, and file origin.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      style_key: {
        type: 'string',
        required: true,
        description: 'The unique key of the Figma style.',
      },
    },
  },

  // ─── Variables ─────────────────────────────────────────────────────────────
  {
    name: 'figma_get_local_variables',
    description:
      'Retrieve all local design variables and variable collections defined in a Figma file, including their types (color, number, string, boolean) and modes.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_get_published_variables',
    description:
      'Retrieve all published (library-shared) design variables and collections from a Figma file, including their resolved types and descriptions.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },

  // ─── Derived / Utility ─────────────────────────────────────────────────────
  {
    name: 'figma_summarize_comments',
    description:
      'Fetch all comments from a Figma file and return a structured summary: total count, open vs resolved breakdown, top commenters, and a list of unresolved feedback items.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_get_file_overview',
    description:
      'Get a comprehensive overview of a Figma file: metadata, all pages, component count, style count, version count, and recent version authors. Ideal for a quick audit or briefing.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_search_team_components',
    description:
      'Search for components in a Figma team library by name (case-insensitive substring match). Returns matching components with their keys and file origins.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      team_id: {
        type: 'string',
        required: true,
        description: 'Figma team ID.',
      },
      query: {
        type: 'string',
        required: true,
        description: 'Search string to match against component names.',
      },
    },
  },
  {
    name: 'figma_diff_versions',
    description:
      'Compare two versions of a Figma file and summarize what changed: who saved each version, the labels, descriptions, and time elapsed between them.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      version_a: {
        type: 'string',
        required: true,
        description: 'ID of the earlier version to compare from.',
      },
      version_b: {
        type: 'string',
        required: true,
        description: 'ID of the later version to compare to.',
      },
    },
  },
  {
    name: 'figma_count_open_comments',
    description:
      'Quickly count how many unresolved (open) comments exist on a Figma file without returning full comment bodies.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
    },
  },
  {
    name: 'figma_list_page_frames',
    description:
      'Get all top-level frames on a specific page of a Figma file — useful for understanding the screen-level structure of a design.',
    category: 'figma',
    connectorId: 'figma',
    parameters: {
      file_key: {
        type: 'string',
        required: true,
        description: 'Figma file key.',
      },
      page_id: {
        type: 'string',
        required: true,
        description: 'Page node ID.',
      },
    },
  },
];

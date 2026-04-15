export const LINEAR_TOOLS = [
  // ── Viewer ────────────────────────────────────────────────────────────────
  {
    name: 'linear_list_my_issues',
    description: "List the user's assigned Linear issues with status, priority, and team.",
    category: 'linear',
    connectorId: 'linear',
    parameters: {},
  },
  {
    name: 'linear_get_viewer',
    description: 'Get the currently authenticated Linear user profile (id, name, email).',
    category: 'linear',
    connectorId: 'linear',
    parameters: {},
  },

  // ── Issues ────────────────────────────────────────────────────────────────
  {
    name: 'linear_get_issue',
    description: 'Get full details of a specific Linear issue by its ID.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID.', required: true },
    },
  },
  {
    name: 'linear_create_issue',
    description: 'Create a new Linear issue in a team.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      title: { type: 'string', description: 'Issue title.', required: true },
      teamId: { type: 'string', description: 'Team ID to create the issue in.', required: true },
      description: {
        type: 'string',
        description: 'Issue description (markdown).',
        required: false,
      },
      assigneeId: { type: 'string', description: 'User ID to assign.', required: false },
      stateId: { type: 'string', description: 'Workflow state ID.', required: false },
      priority: {
        type: 'number',
        description: '0=none 1=urgent 2=high 3=medium 4=low.',
        required: false,
      },
      labelIds: { type: 'array', description: 'Array of label IDs.', required: false },
      dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format.', required: false },
    },
  },
  {
    name: 'linear_update_issue',
    description: 'Update one or more fields on an existing Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID.', required: true },
      title: { type: 'string', description: 'New title.', required: false },
      description: { type: 'string', description: 'New description (markdown).', required: false },
      assigneeId: { type: 'string', description: 'User ID to assign.', required: false },
      stateId: { type: 'string', description: 'New workflow state ID.', required: false },
      priority: {
        type: 'number',
        description: '0=none 1=urgent 2=high 3=medium 4=low.',
        required: false,
      },
      labelIds: { type: 'array', description: 'Replacement array of label IDs.', required: false },
      dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format.', required: false },
    },
  },
  {
    name: 'linear_delete_issue',
    description: 'Permanently delete a Linear issue by ID.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID to delete.', required: true },
    },
  },
  {
    name: 'linear_archive_issue',
    description: 'Archive a Linear issue (soft delete — recoverable).',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID to archive.', required: true },
    },
  },
  {
    name: 'linear_search_issues',
    description: 'Full-text search across all Linear issues.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      query: { type: 'string', description: 'Search query string.', required: true },
      limit: { type: 'number', description: 'Max results (default 25).', required: false },
    },
  },
  {
    name: 'linear_assign_issue',
    description: 'Assign a Linear issue to a specific user.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID.', required: true },
      assigneeId: { type: 'string', description: 'User ID to assign to.', required: true },
    },
  },
  {
    name: 'linear_update_issue_state',
    description: 'Move a Linear issue to a different workflow state.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID.', required: true },
      stateId: { type: 'string', description: 'Target state ID.', required: true },
    },
  },
  {
    name: 'linear_update_issue_priority',
    description: 'Change the priority of a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID.', required: true },
      priority: {
        type: 'number',
        description: '0=none 1=urgent 2=high 3=medium 4=low.',
        required: true,
      },
    },
  },
  {
    name: 'linear_set_issue_due_date',
    description: 'Set or clear the due date on a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID.', required: true },
      dueDate: {
        type: 'string',
        description: 'Date in YYYY-MM-DD. Pass null to clear.',
        required: false,
      },
    },
  },

  // ── Comments ──────────────────────────────────────────────────────────────
  {
    name: 'linear_list_comments',
    description: 'List all comments on a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      issueId: { type: 'string', description: 'The issue ID.', required: true },
    },
  },
  {
    name: 'linear_add_comment',
    description: 'Post a new comment on a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      issueId: { type: 'string', description: 'The issue ID.', required: true },
      body: { type: 'string', description: 'Comment body (markdown).', required: true },
    },
  },
  {
    name: 'linear_update_comment',
    description: 'Edit the body of an existing comment.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'Comment ID.', required: true },
      body: { type: 'string', description: 'New comment body.', required: true },
    },
  },
  {
    name: 'linear_delete_comment',
    description: 'Delete a comment from a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'Comment ID to delete.', required: true },
    },
  },

  // ── Teams ─────────────────────────────────────────────────────────────────
  {
    name: 'linear_list_teams',
    description: 'List all Linear teams in the workspace.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {},
  },
  {
    name: 'linear_get_team',
    description: 'Get details of a specific Linear team including member count and issue count.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The team ID.', required: true },
    },
  },
  {
    name: 'linear_list_team_members',
    description: 'List all members of a specific Linear team.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      teamId: { type: 'string', description: 'The team ID.', required: true },
    },
  },
  {
    name: 'linear_list_team_states',
    description: 'List the workflow states (e.g. Backlog, In Progress, Done) for a team.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      teamId: { type: 'string', description: 'The team ID.', required: true },
    },
  },
  {
    name: 'linear_list_team_labels',
    description: 'List all issue labels defined for a specific team.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      teamId: { type: 'string', description: 'The team ID.', required: true },
    },
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  {
    name: 'linear_list_projects',
    description: 'List all projects in the Linear workspace.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      limit: { type: 'number', description: 'Max results (default 25).', required: false },
    },
  },
  {
    name: 'linear_get_project',
    description: 'Get details of a specific Linear project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The project ID.', required: true },
    },
  },
  {
    name: 'linear_create_project',
    description: 'Create a new Linear project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      name: { type: 'string', description: 'Project name.', required: true },
      teamIds: { type: 'array', description: 'Array of team IDs.', required: true },
      description: { type: 'string', description: 'Project description.', required: false },
      state: { type: 'string', description: 'Project state (e.g. "planned").', required: false },
    },
  },
  {
    name: 'linear_list_project_issues',
    description: 'List all issues belonging to a specific project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      projectId: { type: 'string', description: 'The project ID.', required: true },
      limit: { type: 'number', description: 'Max results (default 25).', required: false },
    },
  },

  // ── Members ───────────────────────────────────────────────────────────────
  {
    name: 'linear_list_members',
    description: 'List all members in the Linear organization.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      limit: { type: 'number', description: 'Max results (default 50).', required: false },
    },
  },
  {
    name: 'linear_get_user',
    description: 'Get a Linear user profile and their recently assigned issues.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The user ID.', required: true },
    },
  },

  // ── Cycles ────────────────────────────────────────────────────────────────
  {
    name: 'linear_list_cycles',
    description: 'List sprint cycles for a team.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      teamId: { type: 'string', description: 'The team ID.', required: true },
      limit: { type: 'number', description: 'Max results (default 10).', required: false },
    },
  },
  {
    name: 'linear_get_cycle_issues',
    description: 'Get all issues inside a specific sprint cycle.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      cycleId: { type: 'string', description: 'The cycle ID.', required: true },
      limit: { type: 'number', description: 'Max results (default 25).', required: false },
    },
  },

  // ── Labels ────────────────────────────────────────────────────────────────
  {
    name: 'linear_list_labels',
    description: 'List all issue labels across the entire Linear workspace.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      limit: { type: 'number', description: 'Max results (default 50).', required: false },
    },
  },
  {
    name: 'linear_create_label',
    description: 'Create a new issue label in a team.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      name: { type: 'string', description: 'Label name.', required: true },
      teamId: { type: 'string', description: 'Team to create the label in.', required: true },
      color: { type: 'string', description: 'Hex color (e.g. #FF5733).', required: false },
    },
  },
];

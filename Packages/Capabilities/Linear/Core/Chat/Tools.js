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

  // ── Issue Relations (NEW) ─────────────────────────────────────────────────
  {
    name: 'linear_list_issue_relations',
    description: 'List all relations for a Linear issue (blocks, duplicates, related issues).',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      issueId: { type: 'string', description: 'The issue ID.', required: true },
    },
  },
  {
    name: 'linear_create_issue_relation',
    description: 'Create a relation between two Linear issues.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      issueId: { type: 'string', description: 'The source issue ID.', required: true },
      relatedIssueId: { type: 'string', description: 'The related issue ID.', required: true },
      type: {
        type: 'string',
        description:
          'Relation type: "blocks" | "blocked_by" | "duplicate" | "duplicate_of" | "related".',
        required: true,
      },
    },
  },
  {
    name: 'linear_delete_issue_relation',
    description: 'Remove a relation between two Linear issues.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue relation ID to delete.', required: true },
    },
  },
  {
    name: 'linear_unarchive_issue',
    description: 'Restore a previously archived Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The issue ID to unarchive.', required: true },
    },
  },

  // ── Attachments (NEW) ─────────────────────────────────────────────────────
  {
    name: 'linear_list_attachments',
    description: 'List all URL attachments on a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      issueId: { type: 'string', description: 'The issue ID.', required: true },
    },
  },
  {
    name: 'linear_create_attachment',
    description: 'Add a URL attachment (link) to a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      issueId: { type: 'string', description: 'The issue ID.', required: true },
      title: { type: 'string', description: 'Attachment title.', required: true },
      url: { type: 'string', description: 'The URL to attach.', required: true },
      subtitle: {
        type: 'string',
        description: 'Optional subtitle / description.',
        required: false,
      },
      iconUrl: { type: 'string', description: 'Optional icon URL.', required: false },
    },
  },
  {
    name: 'linear_delete_attachment',
    description: 'Remove an attachment from a Linear issue.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The attachment ID to delete.', required: true },
    },
  },

  // ── Notifications (NEW) ───────────────────────────────────────────────────
  {
    name: 'linear_list_notifications',
    description: "List the authenticated user's Linear notifications.",
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      limit: { type: 'number', description: 'Max results (default 25).', required: false },
    },
  },
  {
    name: 'linear_mark_notification_read',
    description: 'Mark a specific Linear notification as read.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The notification ID.', required: true },
    },
  },
  {
    name: 'linear_archive_notification',
    description: 'Archive a Linear notification to dismiss it.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The notification ID to archive.', required: true },
    },
  },

  // ── Projects — extended (NEW) ─────────────────────────────────────────────
  {
    name: 'linear_update_project',
    description: 'Update a Linear project name, description, state, or dates.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The project ID.', required: true },
      name: { type: 'string', description: 'New project name.', required: false },
      description: { type: 'string', description: 'New description.', required: false },
      state: {
        type: 'string',
        description: 'New state: "planned" | "started" | "paused" | "completed" | "cancelled".',
        required: false,
      },
      startDate: { type: 'string', description: 'Start date YYYY-MM-DD.', required: false },
      targetDate: { type: 'string', description: 'Target date YYYY-MM-DD.', required: false },
      leadId: { type: 'string', description: 'User ID of the project lead.', required: false },
    },
  },
  {
    name: 'linear_archive_project',
    description: 'Archive a Linear project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The project ID to archive.', required: true },
    },
  },

  // ── Project Milestones (NEW) ──────────────────────────────────────────────
  {
    name: 'linear_list_project_milestones',
    description: 'List all milestones for a Linear project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      projectId: { type: 'string', description: 'The project ID.', required: true },
    },
  },
  {
    name: 'linear_create_project_milestone',
    description: 'Create a milestone inside a Linear project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      projectId: { type: 'string', description: 'The project ID.', required: true },
      name: { type: 'string', description: 'Milestone name.', required: true },
      targetDate: { type: 'string', description: 'Target date YYYY-MM-DD.', required: false },
      description: { type: 'string', description: 'Milestone description.', required: false },
    },
  },
  {
    name: 'linear_update_project_milestone',
    description: 'Update the name, date, or description of a project milestone.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The milestone ID.', required: true },
      name: { type: 'string', description: 'New name.', required: false },
      targetDate: { type: 'string', description: 'New target date YYYY-MM-DD.', required: false },
      description: { type: 'string', description: 'New description.', required: false },
    },
  },
  {
    name: 'linear_delete_project_milestone',
    description: 'Delete a milestone from a Linear project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The milestone ID to delete.', required: true },
    },
  },

  // ── Project Updates (NEW) ─────────────────────────────────────────────────
  {
    name: 'linear_list_project_updates',
    description: 'List status updates (health posts) for a Linear project.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      projectId: { type: 'string', description: 'The project ID.', required: true },
      limit: { type: 'number', description: 'Max results (default 10).', required: false },
    },
  },
  {
    name: 'linear_create_project_update',
    description: 'Post a status update on a Linear project with optional health signal.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      projectId: { type: 'string', description: 'The project ID.', required: true },
      body: { type: 'string', description: 'Update body (markdown).', required: true },
      health: {
        type: 'string',
        description: 'Health signal: "onTrack" | "atRisk" | "offTrack".',
        required: false,
      },
    },
  },

  // ── Cycles — extended (NEW) ───────────────────────────────────────────────
  {
    name: 'linear_create_cycle',
    description: 'Create a new sprint cycle for a team.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      teamId: { type: 'string', description: 'The team ID.', required: true },
      startsAt: {
        type: 'string',
        description: 'Cycle start date-time (ISO 8601).',
        required: true,
      },
      endsAt: { type: 'string', description: 'Cycle end date-time (ISO 8601).', required: true },
      name: { type: 'string', description: 'Optional cycle name.', required: false },
    },
  },
  {
    name: 'linear_update_cycle',
    description: 'Update a sprint cycle name or dates.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The cycle ID.', required: true },
      name: { type: 'string', description: 'New cycle name.', required: false },
      startsAt: { type: 'string', description: 'New start date-time (ISO 8601).', required: false },
      endsAt: { type: 'string', description: 'New end date-time (ISO 8601).', required: false },
      description: { type: 'string', description: 'Cycle description.', required: false },
    },
  },
  {
    name: 'linear_archive_cycle',
    description: 'Archive a sprint cycle.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The cycle ID to archive.', required: true },
    },
  },
  {
    name: 'linear_add_issues_to_cycle',
    description: 'Add one or more issues to a sprint cycle.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      cycleId: { type: 'string', description: 'The cycle ID.', required: true },
      issueIds: { type: 'array', description: 'Array of issue IDs to add.', required: true },
    },
  },

  // ── Workflow States (NEW) ─────────────────────────────────────────────────
  {
    name: 'linear_create_workflow_state',
    description: 'Create a new workflow state for a team (e.g. a custom "In Review" column).',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      teamId: { type: 'string', description: 'The team ID.', required: true },
      name: { type: 'string', description: 'State name.', required: true },
      type: {
        type: 'string',
        description:
          'State type: "triage" | "backlog" | "unstarted" | "started" | "completed" | "cancelled".',
        required: true,
      },
      color: { type: 'string', description: 'Hex color (e.g. #FF5733).', required: true },
      position: {
        type: 'number',
        description: 'Sort position within its type group.',
        required: false,
      },
    },
  },
  {
    name: 'linear_update_workflow_state',
    description: 'Update the name, color, or position of an existing workflow state.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The workflow state ID.', required: true },
      name: { type: 'string', description: 'New state name.', required: false },
      color: { type: 'string', description: 'New hex color.', required: false },
      position: { type: 'number', description: 'New sort position.', required: false },
      description: { type: 'string', description: 'State description.', required: false },
    },
  },
  {
    name: 'linear_archive_workflow_state',
    description: 'Archive a workflow state, removing it from active use.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The workflow state ID to archive.', required: true },
    },
  },

  // ── Teams — extended (NEW) ────────────────────────────────────────────────
  {
    name: 'linear_update_team',
    description: 'Update a Linear team name, description, identifier key, or timezone.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The team ID.', required: true },
      name: { type: 'string', description: 'New team name.', required: false },
      description: { type: 'string', description: 'New description.', required: false },
      key: {
        type: 'string',
        description: 'New team identifier key (e.g. "ENG").',
        required: false,
      },
      timezone: {
        type: 'string',
        description: 'Timezone string (e.g. "America/New_York").',
        required: false,
      },
    },
  },

  // ── Labels — extended (NEW) ───────────────────────────────────────────────
  {
    name: 'linear_update_label',
    description: 'Update the name or color of an existing issue label.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The label ID.', required: true },
      name: { type: 'string', description: 'New label name.', required: false },
      color: { type: 'string', description: 'New hex color.', required: false },
    },
  },
  {
    name: 'linear_archive_label',
    description: 'Archive an issue label, removing it from active use.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {
      id: { type: 'string', description: 'The label ID to archive.', required: true },
    },
  },

  // ── Favorites (NEW) ───────────────────────────────────────────────────────
  {
    name: 'linear_list_favorites',
    description: "List the authenticated user's favorited issues and projects in Linear.",
    category: 'linear',
    connectorId: 'linear',
    parameters: {},
  },

  // ── Organization (NEW) ────────────────────────────────────────────────────
  {
    name: 'linear_get_organization',
    description: 'Get the current Linear workspace/organization details including user count.',
    category: 'linear',
    connectorId: 'linear',
    parameters: {},
  },
];

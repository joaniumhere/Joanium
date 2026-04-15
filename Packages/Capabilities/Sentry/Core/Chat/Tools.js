export const SENTRY_TOOLS = [
  // ─── Issues ──────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_issues',
    description:
      'List the most recent unresolved Sentry issues across the default organization, with error level and occurrence count.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_issue',
    description:
      'Get full details of a single Sentry issue by its issue ID, including culprit, status, level, affected user count, and permalink.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },
  {
    name: 'sentry_resolve_issue',
    description:
      'Mark a Sentry issue as resolved by its issue ID. Use this when a fix has been confirmed.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to resolve.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_ignore_issue',
    description:
      'Ignore a Sentry issue by its issue ID so it no longer appears in the active issue list.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to ignore.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_assign_issue',
    description: 'Assign a Sentry issue to a team member by their username or email address.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: {
        type: 'string',
        description: 'The numeric Sentry issue ID to assign.',
        required: true,
      },
      assignee: {
        type: 'string',
        description: 'Username or email of the member to assign the issue to.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_bulk_resolve_issues',
    description: 'Resolve multiple Sentry issues at once by providing a list of issue IDs.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of numeric Sentry issue IDs to resolve.',
        required: true,
      },
    },
  },
  {
    name: 'sentry_search_issues',
    description:
      'Search Sentry issues using a custom query string (e.g. "is:unresolved browser:Chrome", "assigned:me", "times_seen:>100").',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      query: { type: 'string', description: 'Sentry search query string.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_fatal_issues',
    description:
      'List only fatal-level unresolved Sentry issues — the highest severity errors requiring immediate attention.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      limit: {
        type: 'number',
        description: 'Maximum number of results (default 25).',
        required: false,
      },
    },
  },

  // ─── Issue Events & Tags ──────────────────────────────────────────────────────
  {
    name: 'sentry_list_issue_events',
    description:
      'List recent individual events (occurrences) for a specific Sentry issue, including timestamps and affected users.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of events to return (default 10).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_get_latest_event',
    description:
      'Get the most recent event for a Sentry issue, including full stack trace entries, tags, and user context.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },
  {
    name: 'sentry_list_issue_tags',
    description:
      'List all tags for a Sentry issue (e.g. browser, OS, environment, release) with top values and counts, useful for spotting patterns.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },
  {
    name: 'sentry_list_issue_hashes',
    description:
      'List the fingerprint hashes grouped under a Sentry issue. Useful for understanding how many unique stack trace variants are grouped together.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      issueId: { type: 'string', description: 'The numeric Sentry issue ID.', required: true },
    },
  },

  // ─── Projects ─────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_projects',
    description:
      'List all Sentry projects in the connected organization, including platform, status, and creation date.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_project',
    description:
      'Get detailed information about a specific Sentry project by its slug, including owning team and latest release.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: {
        type: 'string',
        description: 'The project slug (e.g. "my-app").',
        required: true,
      },
    },
  },
  {
    name: 'sentry_list_project_issues',
    description: 'List unresolved issues scoped to a specific Sentry project.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of issues to return (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_project_events',
    description: 'List the most recent events captured in a specific Sentry project.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of events to return (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_project_releases',
    description:
      'List releases deployed for a specific Sentry project, including commit counts, new issue counts, and deploy counts.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of releases (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_alert_rules',
    description:
      'List all alert rules configured for a specific Sentry project, including conditions and notification actions.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },
  {
    name: 'sentry_list_user_feedback',
    description:
      'List user-submitted feedback attached to Sentry events for a specific project, including comments and reporter email.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
      limit: {
        type: 'number',
        description: 'Maximum number of feedback entries (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_list_dsym_files',
    description:
      'List debug symbol (dSYM / ProGuard / Breakpad) files uploaded to a Sentry project. Useful for verifying symbolication is set up correctly.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      projectSlug: { type: 'string', description: 'The project slug.', required: true },
    },
  },

  // ─── Organizations ────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_organizations',
    description: 'List all Sentry organizations accessible with the connected auth token.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_organization',
    description:
      'Get detailed information about the connected Sentry organization, including member count and enabled features.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_list_members',
    description:
      'List all members of the connected Sentry organization, including their roles and email addresses.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_list_environments',
    description:
      'List all environments defined in the Sentry organization (e.g. production, staging, development).',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_get_org_stats',
    description:
      'Get organization-wide error event volume statistics for the past 14 days using the Sentry Stats V2 API.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },

  // ─── Teams ────────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_teams',
    description: 'List all teams in the connected Sentry organization, including member counts.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {},
  },
  {
    name: 'sentry_list_team_projects',
    description: 'List all Sentry projects assigned to a specific team.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      teamSlug: { type: 'string', description: 'The team slug.', required: true },
    },
  },

  // ─── Releases ─────────────────────────────────────────────────────────────────
  {
    name: 'sentry_list_org_releases',
    description:
      'List all releases across the connected Sentry organization, showing version, deploy count, new issues, and associated projects.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      limit: {
        type: 'number',
        description: 'Maximum number of releases (default 25).',
        required: false,
      },
    },
  },
  {
    name: 'sentry_get_release',
    description:
      'Get detailed information about a specific release version in Sentry, including authors, commit count, and associated projects.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      version: {
        type: 'string',
        description: 'The release version string (e.g. "2.3.1" or a commit SHA).',
        required: true,
      },
    },
  },
  {
    name: 'sentry_list_deploys',
    description:
      'List all deploys for a specific release version in Sentry, showing environment, start time, and finish time.',
    category: 'sentry',
    connectorId: 'sentry',
    parameters: {
      version: { type: 'string', description: 'The release version string.', required: true },
    },
  },
];

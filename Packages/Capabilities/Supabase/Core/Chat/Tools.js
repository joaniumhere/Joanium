export const SUPABASE_TOOLS = [
  {
    name: 'supabase_list_projects',
    description:
      "List all the user's Supabase projects with their region, status, and project reference.",
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {},
  },
  {
    name: 'supabase_get_project',
    description:
      'Get detailed information about a specific Supabase project, including its database host, port, and current status.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: {
        type: 'string',
        description: 'The project reference ID (e.g. abcdefghijkl).',
        required: true,
      },
    },
  },
  {
    name: 'supabase_get_project_health',
    description:
      'Check the health of all services (database, auth, storage, functions, etc.) for a specific Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },
  {
    name: 'supabase_list_organizations',
    description: 'List all Supabase organizations the user belongs to.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {},
  },
  {
    name: 'supabase_get_organization',
    description: 'Get details of a specific Supabase organization by its slug.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      orgSlug: { type: 'string', description: 'The organization slug.', required: true },
    },
  },

  // ─── Database ──────────────────────────────────────────────────────────────
  {
    name: 'supabase_list_schemas',
    description: 'List all database schemas in a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      includeSystemSchemas: {
        type: 'boolean',
        description: 'Include pg_catalog, information_schema, etc. Defaults to false.',
      },
    },
  },
  {
    name: 'supabase_list_tables',
    description: 'List all tables in a Supabase project database, optionally filtered by schema.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      schema: { type: 'string', description: 'Schema name to filter by. Defaults to "public".' },
    },
  },
  {
    name: 'supabase_list_columns',
    description:
      'List all columns for tables in a given schema (or a specific table) in a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      schema: { type: 'string', description: 'Schema name. Defaults to "public".' },
      table: { type: 'string', description: 'Table name to filter columns by (optional).' },
    },
  },
  {
    name: 'supabase_list_views',
    description: 'List all database views in a Supabase project, optionally filtered by schema.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      schema: { type: 'string', description: 'Schema name to filter by. Defaults to "public".' },
    },
  },
  {
    name: 'supabase_list_extensions',
    description: 'List all available and installed PostgreSQL extensions in a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },
  {
    name: 'supabase_list_roles',
    description: 'List all database roles (users) in a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      includeSystemRoles: {
        type: 'boolean',
        description: 'Include built-in system roles. Defaults to false.',
      },
    },
  },
  {
    name: 'supabase_list_migrations',
    description: 'List all database migration history for a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },
  {
    name: 'supabase_list_triggers',
    description: 'List all database triggers in a Supabase project schema.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      schema: { type: 'string', description: 'Schema name to filter by. Defaults to "public".' },
    },
  },
  {
    name: 'supabase_list_db_functions',
    description: 'List all database functions and stored procedures in a Supabase project schema.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      schema: { type: 'string', description: 'Schema name to filter by. Defaults to "public".' },
    },
  },
  {
    name: 'supabase_list_indexes',
    description: 'List all database indexes for tables in a Supabase project schema.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      schema: { type: 'string', description: 'Schema name to filter by. Defaults to "public".' },
    },
  },
  {
    name: 'supabase_run_query',
    description:
      'Run a read-only SQL query against a Supabase project database and return the results. Use for SELECT statements and data inspection.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      query: {
        type: 'string',
        description: 'The SQL query to execute (e.g. SELECT * FROM users LIMIT 10).',
        required: true,
      },
    },
  },

  // ─── Edge Functions ────────────────────────────────────────────────────────
  {
    name: 'supabase_list_functions',
    description: 'List all edge functions deployed to a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },
  {
    name: 'supabase_get_function',
    description:
      'Get full details of a specific edge function in a Supabase project, including its entrypoint, version, and JWT settings.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      functionSlug: {
        type: 'string',
        description: 'The slug (identifier) of the edge function.',
        required: true,
      },
    },
  },

  // ─── Storage ───────────────────────────────────────────────────────────────
  {
    name: 'supabase_list_buckets',
    description:
      'List all storage buckets in a Supabase project, including their public/private status and file size limits.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },
  {
    name: 'supabase_get_bucket',
    description: 'Get details of a specific storage bucket in a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      bucketId: { type: 'string', description: 'The bucket ID or name.', required: true },
    },
  },

  // ─── Auth ──────────────────────────────────────────────────────────────────
  {
    name: 'supabase_list_auth_users',
    description:
      'List authenticated users in a Supabase project, including their email, provider, and sign-in history.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      page: { type: 'number', description: 'Page number for pagination. Defaults to 1.' },
      perPage: {
        type: 'number',
        description: 'Number of users per page (max 1000). Defaults to 50.',
      },
      keywords: {
        type: 'string',
        description: 'Search keyword to filter users by email or phone.',
      },
    },
  },
  {
    name: 'supabase_get_auth_config',
    description:
      'Get the auth configuration for a Supabase project, including enabled OAuth providers, JWT expiry, sign-up settings, and site URL.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },

  // ─── API / PostgREST ───────────────────────────────────────────────────────
  {
    name: 'supabase_get_postgrest_config',
    description:
      'Get the PostgREST API configuration for a Supabase project, including exposed schemas, max rows, and DB pool size.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },
  {
    name: 'supabase_get_api_settings',
    description:
      'Get the API settings for a Supabase project including the project URL, anon key, and service role key.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },

  // ─── Secrets ───────────────────────────────────────────────────────────────
  {
    name: 'supabase_list_secrets',
    description:
      'List the names of all edge function secrets stored in a Supabase project (values are never exposed).',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },

  // ─── Custom Domains ────────────────────────────────────────────────────────
  {
    name: 'supabase_get_custom_hostname',
    description:
      'Get the custom hostname (vanity domain) configuration and verification status for a Supabase project.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },

  // ─── Network ───────────────────────────────────────────────────────────────
  {
    name: 'supabase_get_network_restrictions',
    description:
      'Get the network access restrictions (allowed IP CIDRs) for a Supabase project database.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
    },
  },

  // ─── Logs ──────────────────────────────────────────────────────────────────
  {
    name: 'supabase_get_logs',
    description:
      'Retrieve recent logs from a Supabase project service. Supports api, auth, storage, postgres, realtime, and functions.',
    category: 'supabase',
    connectorId: 'supabase',
    parameters: {
      projectRef: { type: 'string', description: 'The project reference ID.', required: true },
      service: {
        type: 'string',
        description:
          'Service to get logs from: "api", "auth", "storage", "postgres", "realtime", or "functions". Defaults to "api".',
      },
      limit: {
        type: 'number',
        description: 'Number of log entries to retrieve (max 1000). Defaults to 50.',
      },
    },
  },
];

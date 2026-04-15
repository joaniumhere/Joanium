export const NETLIFY_TOOLS = [
  // ── Existing ──────────────────────────────────────────────────────────────
  {
    name: 'netlify_list_sites',
    description: "List the user's Netlify sites with their publish status, URL, and custom domain.",
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {},
  },

  // ── Sites ─────────────────────────────────────────────────────────────────
  {
    name: 'netlify_get_site',
    description: 'Get full details for a specific Netlify site by its site ID.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  {
    name: 'netlify_update_site',
    description:
      'Update settings for a Netlify site (e.g. name, custom_domain, build command, publish directory).',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      name: { type: 'string', description: 'New site name (subdomain).', required: false },
      custom_domain: { type: 'string', description: 'Custom domain to assign.', required: false },
      build_command: { type: 'string', description: 'Build command override.', required: false },
      publish_directory: {
        type: 'string',
        description: 'Publish directory override.',
        required: false,
      },
    },
  },
  {
    name: 'netlify_delete_site',
    description: 'Permanently delete a Netlify site. This action is irreversible.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID to delete.', required: true },
    },
  },
  {
    name: 'netlify_list_site_files',
    description: "List all files in a site's current published deploy.",
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },

  // ── Deploys ────────────────────────────────────────────────────────────────
  {
    name: 'netlify_get_deploy',
    description: 'Get details of a specific deploy by its deploy ID, including state and errors.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      deploy_id: { type: 'string', description: 'The deploy ID.', required: true },
    },
  },
  {
    name: 'netlify_list_site_deploys',
    description: 'List recent deploys for a specific site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      limit: {
        type: 'number',
        description: 'Number of deploys to return (default 10).',
        required: false,
      },
    },
  },
  {
    name: 'netlify_cancel_deploy',
    description: 'Cancel an in-progress deploy.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      deploy_id: { type: 'string', description: 'The deploy ID to cancel.', required: true },
    },
  },
  {
    name: 'netlify_restore_deploy',
    description: 'Roll back (restore) a site to a previous deploy.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      deploy_id: { type: 'string', description: 'The deploy ID to restore.', required: true },
    },
  },
  {
    name: 'netlify_trigger_site_build',
    description: 'Trigger a new deploy/build for a site, optionally clearing the build cache.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      clear_cache: {
        type: 'boolean',
        description: 'Whether to clear the build cache before deploying.',
        required: false,
      },
    },
  },

  // ── Forms & Submissions ────────────────────────────────────────────────────
  {
    name: 'netlify_list_forms',
    description: 'List all Netlify Forms configured for a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  {
    name: 'netlify_list_form_submissions',
    description: 'List submissions for a specific Netlify Form.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      form_id: { type: 'string', description: 'The Netlify form ID.', required: true },
      limit: {
        type: 'number',
        description: 'Number of submissions to return (default 20).',
        required: false,
      },
    },
  },
  {
    name: 'netlify_delete_form_submission',
    description: 'Delete a specific form submission by its ID.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      submission_id: {
        type: 'string',
        description: 'The form submission ID to delete.',
        required: true,
      },
    },
  },

  // ── Hooks (Notifications) ──────────────────────────────────────────────────
  {
    name: 'netlify_list_hooks',
    description: 'List notification hooks (webhooks, Slack, email) configured for a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  {
    name: 'netlify_create_hook',
    description: 'Create a notification hook for a site (e.g. Slack or webhook on deploy events).',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      type: {
        type: 'string',
        description: 'Hook type, e.g. "url" for webhook or "slack".',
        required: true,
      },
      event: {
        type: 'string',
        description: 'Event to trigger on, e.g. "deploy_created", "deploy_failed".',
        required: true,
      },
      data: {
        type: 'object',
        description: 'Hook-specific data, e.g. { url: "https://..." } for webhooks.',
        required: true,
      },
    },
  },
  {
    name: 'netlify_delete_hook',
    description: 'Delete a notification hook by its hook ID.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      hook_id: { type: 'string', description: 'The hook ID to delete.', required: true },
    },
  },

  // ── Build Hooks ────────────────────────────────────────────────────────────
  {
    name: 'netlify_list_build_hooks',
    description: 'List all build hooks for a site. Build hooks are URLs that trigger a new build.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  {
    name: 'netlify_create_build_hook',
    description: 'Create a new build hook for a site with a title and target branch.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      title: {
        type: 'string',
        description: 'Descriptive label for the build hook.',
        required: true,
      },
      branch: {
        type: 'string',
        description: 'Branch to build when the hook is triggered.',
        required: true,
      },
    },
  },
  {
    name: 'netlify_delete_build_hook',
    description: 'Delete a build hook from a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      build_hook_id: {
        type: 'string',
        description: 'The build hook ID to delete.',
        required: true,
      },
    },
  },
  {
    name: 'netlify_trigger_build_hook',
    description: 'Fire a build hook by its ID to trigger an immediate site build.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      build_hook_id: {
        type: 'string',
        description: 'The build hook ID to trigger.',
        required: true,
      },
    },
  },

  // ── Environment Variables ──────────────────────────────────────────────────
  {
    name: 'netlify_list_env_vars',
    description: "List all environment variables set on a site's build environment.",
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  {
    name: 'netlify_update_env_vars',
    description: 'Set or update one or more environment variables on a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      vars: {
        type: 'object',
        description: 'Key-value pairs of env vars to set, e.g. { "API_KEY": "abc123" }.',
        required: true,
      },
    },
  },
  {
    name: 'netlify_delete_env_var',
    description: 'Delete a single environment variable from a site by key.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      key: {
        type: 'string',
        description: 'The environment variable key to delete.',
        required: true,
      },
    },
  },

  // ── DNS ────────────────────────────────────────────────────────────────────
  {
    name: 'netlify_list_dns_zones',
    description: "List all DNS zones managed by the user's Netlify account.",
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {},
  },
  {
    name: 'netlify_list_dns_records',
    description: 'List all DNS records within a specific DNS zone.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      zone_id: { type: 'string', description: 'The DNS zone ID.', required: true },
    },
  },
  {
    name: 'netlify_create_dns_record',
    description: 'Create a new DNS record (A, CNAME, MX, TXT, etc.) in a DNS zone.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      zone_id: { type: 'string', description: 'The DNS zone ID.', required: true },
      type: {
        type: 'string',
        description: 'Record type, e.g. "A", "CNAME", "TXT".',
        required: true,
      },
      hostname: { type: 'string', description: 'The hostname for the record.', required: true },
      value: {
        type: 'string',
        description: 'The record value (IP, target, text, etc.).',
        required: true,
      },
      ttl: { type: 'number', description: 'TTL in seconds (optional).', required: false },
    },
  },
  {
    name: 'netlify_delete_dns_record',
    description: 'Delete a DNS record from a zone by its record ID.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      zone_id: { type: 'string', description: 'The DNS zone ID.', required: true },
      record_id: { type: 'string', description: 'The DNS record ID to delete.', required: true },
    },
  },

  // ── Accounts & Members ─────────────────────────────────────────────────────
  {
    name: 'netlify_list_accounts',
    description: 'List all Netlify teams/accounts the authenticated user belongs to.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {},
  },
  {
    name: 'netlify_list_members',
    description: 'List all members of a Netlify team/account.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      account_id: {
        type: 'string',
        description: 'The account/team slug or ID.',
        required: true,
      },
    },
  },

  // ── SSL ────────────────────────────────────────────────────────────────────
  {
    name: 'netlify_get_ssl',
    description: 'Get SSL/TLS certificate details for a site, including expiry and state.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  {
    name: 'netlify_provision_ssl',
    description: 'Provision or renew the SSL certificate for a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },

  // ── Snippets ───────────────────────────────────────────────────────────────
  {
    name: 'netlify_list_snippets',
    description: 'List all code snippets (HTML injection rules) configured for a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
];

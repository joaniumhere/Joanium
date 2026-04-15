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

  // ════════════════════════════════════════════════════════════════════════════
  // NEW TOOLS (30)
  // ════════════════════════════════════════════════════════════════════════════

  // ── User ──────────────────────────────────────────────────────────────────
  // NEW 1
  {
    name: 'netlify_get_current_user',
    description:
      'Get the profile of the currently authenticated Netlify user (name, email, avatar, connected accounts).',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {},
  },

  // ── Sites ─────────────────────────────────────────────────────────────────
  // NEW 2
  {
    name: 'netlify_create_site',
    description:
      'Create a new Netlify site, optionally specifying a name (subdomain) and custom domain.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      name: {
        type: 'string',
        description: 'Desired site name / subdomain (e.g. "my-awesome-app").',
        required: false,
      },
      custom_domain: {
        type: 'string',
        description: 'Custom domain to assign immediately.',
        required: false,
      },
    },
  },
  // NEW 3
  {
    name: 'netlify_create_site_in_team',
    description:
      'Create a new Netlify site inside a specific team/account instead of the personal account.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      account_id: {
        type: 'string',
        description: 'The team/account slug or ID to create the site under.',
        required: true,
      },
      name: {
        type: 'string',
        description: 'Desired site name / subdomain.',
        required: false,
      },
      custom_domain: {
        type: 'string',
        description: 'Custom domain to assign.',
        required: false,
      },
    },
  },
  // NEW 4
  {
    name: 'netlify_purge_cache',
    description:
      'Immediately purge (invalidate) the CDN cache for a site, forcing fresh content to be served on the next request.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  // NEW 5
  {
    name: 'netlify_list_site_functions',
    description: 'List all Netlify Functions (serverless functions) currently deployed on a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  // NEW 6
  {
    name: 'netlify_list_service_instances',
    description:
      'List all installed plugin/service instances (e.g. Netlify Graph, A/B testing add-ons) active on a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },

  // ── Deploys ────────────────────────────────────────────────────────────────
  // NEW 7
  {
    name: 'netlify_lock_deploy',
    description:
      'Lock a deploy to keep it permanently as the live (published) deploy, preventing future deploys from replacing it.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      deploy_id: { type: 'string', description: 'The deploy ID to lock.', required: true },
    },
  },
  // NEW 8
  {
    name: 'netlify_unlock_deploy',
    description:
      'Unlock a previously locked deploy, allowing future deploys to replace it as the live version.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      deploy_id: { type: 'string', description: 'The deploy ID to unlock.', required: true },
    },
  },
  // NEW 9
  {
    name: 'netlify_retry_deploy',
    description: 'Retry a failed or stuck deploy using the same source and configuration.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      deploy_id: { type: 'string', description: 'The deploy ID to retry.', required: true },
    },
  },

  // ── Forms ──────────────────────────────────────────────────────────────────
  // NEW 10
  {
    name: 'netlify_delete_form',
    description: 'Permanently delete a Netlify Form and all its submissions from a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      form_id: { type: 'string', description: 'The Netlify form ID to delete.', required: true },
    },
  },

  // ── DNS ────────────────────────────────────────────────────────────────────
  // NEW 11
  {
    name: 'netlify_get_dns_zone',
    description: 'Get full details of a single DNS zone by its zone ID.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      zone_id: { type: 'string', description: 'The DNS zone ID.', required: true },
    },
  },
  // NEW 12
  {
    name: 'netlify_create_dns_zone',
    description:
      'Create a new DNS zone for a domain name, optionally assigning it to a specific team account.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      name: {
        type: 'string',
        description: 'The domain name for the new zone, e.g. "example.com".',
        required: true,
      },
      account_id: {
        type: 'string',
        description: 'Account/team ID to assign the zone to (optional).',
        required: false,
      },
    },
  },
  // NEW 13
  {
    name: 'netlify_delete_dns_zone',
    description: 'Delete a DNS zone and all its records. This action is irreversible.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      zone_id: { type: 'string', description: 'The DNS zone ID to delete.', required: true },
    },
  },
  // NEW 14
  {
    name: 'netlify_transfer_dns_zone',
    description: 'Transfer ownership of a DNS zone to a different Netlify account/team.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      zone_id: { type: 'string', description: 'The DNS zone ID to transfer.', required: true },
      transfer_account_id: {
        type: 'string',
        description: 'The destination account ID.',
        required: true,
      },
      transfer_user_id: {
        type: 'string',
        description: 'The destination user ID.',
        required: true,
      },
    },
  },

  // ── Accounts ──────────────────────────────────────────────────────────────
  // NEW 15
  {
    name: 'netlify_get_account',
    description: 'Get details of a specific Netlify team/account by its ID or slug.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      account_id: { type: 'string', description: 'The account/team slug or ID.', required: true },
    },
  },
  // NEW 16
  {
    name: 'netlify_update_account',
    description: 'Update a Netlify team/account — name, slug, or billing email.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      account_id: { type: 'string', description: 'The account/team slug or ID.', required: true },
      name: { type: 'string', description: 'New display name for the team.', required: false },
      slug: { type: 'string', description: 'New URL slug for the team.', required: false },
      billing_email: {
        type: 'string',
        description: 'Billing contact email address.',
        required: false,
      },
    },
  },
  // NEW 17
  {
    name: 'netlify_invite_member',
    description:
      'Invite a new member to a Netlify team by email, assigning them a role (Owner, Collaborator, etc.).',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      account_id: { type: 'string', description: 'The account/team slug or ID.', required: true },
      email: {
        type: 'string',
        description: 'Email address of the person to invite.',
        required: true,
      },
      role: {
        type: 'string',
        description: 'Role to grant: "Owner", "Collaborator", "Controller", or "Reviewer".',
        required: true,
      },
    },
  },
  // NEW 18
  {
    name: 'netlify_remove_member',
    description: 'Remove a member from a Netlify team by their member ID.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      account_id: { type: 'string', description: 'The account/team slug or ID.', required: true },
      member_id: { type: 'string', description: 'The member ID to remove.', required: true },
    },
  },
  // NEW 19
  {
    name: 'netlify_list_audit_log',
    description: 'Fetch the audit log for a Netlify team/account, showing who did what and when.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      account_id: { type: 'string', description: 'The account/team slug or ID.', required: true },
      limit: {
        type: 'number',
        description: 'Number of log entries to return (default 30).',
        required: false,
      },
    },
  },

  // ── Snippets ───────────────────────────────────────────────────────────────
  // NEW 20
  {
    name: 'netlify_create_snippet',
    description:
      'Inject an HTML snippet (e.g. analytics tag, chat widget) into every page of a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      title: { type: 'string', description: 'Label for the snippet.', required: true },
      general: {
        type: 'string',
        description: 'HTML to inject on all pages.',
        required: true,
      },
      position: {
        type: 'string',
        description: 'Where to inject: "head" (default) or "footer".',
        required: false,
      },
      goal: {
        type: 'string',
        description: 'Optional HTML to inject only on goal pages.',
        required: false,
      },
    },
  },
  // NEW 21
  {
    name: 'netlify_get_snippet',
    description: 'Get a specific HTML injection snippet by its ID.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      snippet_id: { type: 'string', description: 'The snippet ID.', required: true },
    },
  },
  // NEW 22
  {
    name: 'netlify_update_snippet',
    description: 'Update the content, title, or position of an existing HTML injection snippet.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      snippet_id: { type: 'string', description: 'The snippet ID to update.', required: true },
      title: { type: 'string', description: 'New label for the snippet.', required: false },
      general: { type: 'string', description: 'Updated HTML content.', required: false },
      position: {
        type: 'string',
        description: 'Injection position: "head" or "footer".',
        required: false,
      },
    },
  },
  // NEW 23
  {
    name: 'netlify_delete_snippet',
    description: 'Delete an HTML injection snippet from a site.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      snippet_id: { type: 'string', description: 'The snippet ID to delete.', required: true },
    },
  },

  // ── Deploy Keys ────────────────────────────────────────────────────────────
  // NEW 24
  {
    name: 'netlify_list_deploy_keys',
    description:
      'List all deploy keys (SSH key pairs) on the account, used to authorise repo access during builds.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {},
  },
  // NEW 25
  {
    name: 'netlify_create_deploy_key',
    description:
      'Generate a new deploy key (SSH key pair). The public key should then be added to your Git repository.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {},
  },
  // NEW 26
  {
    name: 'netlify_get_deploy_key',
    description: 'Get a specific deploy key by its ID, including the public key value.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      key_id: { type: 'string', description: 'The deploy key ID.', required: true },
    },
  },
  // NEW 27
  {
    name: 'netlify_delete_deploy_key',
    description: 'Delete a deploy key, revoking its access to linked repositories.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      key_id: { type: 'string', description: 'The deploy key ID to delete.', required: true },
    },
  },

  // ── Split Tests (A/B Testing) ──────────────────────────────────────────────
  // NEW 28
  {
    name: 'netlify_list_split_tests',
    description:
      'List all A/B split tests configured for a site, showing branch weights and status.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
    },
  },
  // NEW 29
  {
    name: 'netlify_create_split_test',
    description: 'Create an A/B split test on a site by defining branch names and traffic weights.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      branches: {
        type: 'array',
        description:
          'Array of branch objects with "branch" (name) and "percentage" (0–100), e.g. [{ "branch": "main", "percentage": 80 }, { "branch": "experiment", "percentage": 20 }].',
        required: true,
      },
    },
  },
  // NEW 30
  {
    name: 'netlify_update_split_test',
    description: 'Update the branch weights of an existing A/B split test.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      split_test_id: { type: 'string', description: 'The split test ID.', required: true },
      branches: {
        type: 'array',
        description: 'Updated branch objects with "branch" and "percentage" fields.',
        required: true,
      },
    },
  },
  // NEW 31 (bonus)
  {
    name: 'netlify_enable_split_test',
    description:
      'Publish (activate) an A/B split test so live traffic starts being distributed across branches.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      split_test_id: {
        type: 'string',
        description: 'The split test ID to enable.',
        required: true,
      },
    },
  },
  // NEW 32 (bonus)
  {
    name: 'netlify_disable_split_test',
    description:
      'Unpublish (pause) an active A/B split test, routing all traffic back to the main branch.',
    category: 'netlify',
    connectorId: 'netlify',
    parameters: {
      site_id: { type: 'string', description: 'The Netlify site ID.', required: true },
      split_test_id: {
        type: 'string',
        description: 'The split test ID to disable.',
        required: true,
      },
    },
  },
];

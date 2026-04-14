import defineFeature from '../../Core/DefineFeature.js';
import * as JiraAPI from './API/JiraAPI.js';
import { getJiraCredentials, notConnected } from './Shared/Common.js';
import { JIRA_TOOLS } from './Chat/Tools.js';
import { executeJiraChatTool } from './Chat/ChatExecutor.js';
import { jiraDataSourceCollectors, jiraOutputHandlers } from './Automation/AutomationHandlers.js';

function withJira(ctx, cb) {
  const creds = getJiraCredentials(ctx);
  return creds
    ? cb(creds).catch((e) => ({ ok: false, error: e.message }))
    : Promise.resolve(notConnected());
}

export default defineFeature({
  id: 'jira',
  name: 'Jira',

  connectors: {
    services: [
      {
        id: 'jira',
        name: 'Jira',
        icon: '<img src="../../../Assets/Icons/Jira.png" alt="Jira" style="width: 26px; height: 26px; object-fit: contain;" />',
        description:
          'Track tickets, browse projects, and monitor assigned issues across your Jira Cloud workspace.',
        helpUrl: 'https://id.atlassian.com/manage-profile/security/api-tokens',
        helpText: 'Create an API Token →',
        oauthType: null,
        subServices: [],
        setupSteps: [
          'Go to id.atlassian.com/manage-profile/security/api-tokens',
          'Click "Create API token" and give it a label',
          'Copy the token and enter it below along with your Atlassian email',
          'Enter your Jira site URL (e.g. https://yourcompany.atlassian.net)',
        ],
        capabilities: [
          'List your assigned Jira issues with status and priority',
          'Browse projects across your Jira workspace',
          'Monitor issue workload via automations',
        ],
        fields: [
          {
            key: 'email',
            label: 'Atlassian Email',
            placeholder: 'you@example.com',
            type: 'text',
            hint: 'The email address associated with your Atlassian account.',
          },
          {
            key: 'token',
            label: 'API Token',
            placeholder: 'Your Atlassian API token',
            type: 'password',
            hint: 'Create at id.atlassian.com/manage-profile/security/api-tokens.',
          },
          {
            key: 'siteUrl',
            label: 'Jira Site URL',
            placeholder: 'https://yourcompany.atlassian.net',
            type: 'text',
            hint: 'Your Jira Cloud site URL, e.g. https://yourcompany.atlassian.net',
          },
        ],
        automations: [
          {
            name: 'Issue Digest',
            description: 'Daily — summarize open Jira issues assigned to you by priority',
          },
        ],
        defaultState: { enabled: false, credentials: {} },
        async validate(ctx) {
          const creds = ctx.connectorEngine?.getCredentials('jira');
          if (!creds?.email || !creds?.token || !creds?.siteUrl)
            return { ok: false, error: 'Email, API token, and site URL are all required' };
          try {
            const me = await JiraAPI.getMyself(creds);
            ctx.connectorEngine?.updateCredentials('jira', {
              displayName: me.displayName ?? null,
              accountId: me.accountId ?? null,
            });
            return { ok: true, displayName: me.displayName };
          } catch (err) {
            return { ok: false, error: err.message };
          }
        },
      },
    ],
  },

  main: {
    methods: {
      listProjects: async (ctx) =>
        withJira(ctx, async (creds) => ({
          ok: true,
          projects: await JiraAPI.listProjects(creds),
        })),
      getMyIssues: async (ctx, { limit } = {}) =>
        withJira(ctx, async (creds) => ({
          ok: true,
          issues: await JiraAPI.getMyOpenIssues(creds, limit ?? 25),
        })),
      searchIssues: async (ctx, { jql, limit } = {}) =>
        withJira(ctx, async (creds) => ({
          ok: true,
          issues: await JiraAPI.searchIssues(creds, jql ?? '', limit ?? 25),
        })),
      executeChatTool: async (ctx, { toolName, params }) =>
        executeJiraChatTool(ctx, toolName, params),
    },
  },

  renderer: { chatTools: JIRA_TOOLS },

  automation: {
    dataSources: [{ value: 'jira_my_issues', label: 'Jira - My Issues', group: 'Jira' }],
    outputTypes: [],
    instructionTemplates: {
      jira_my_issues:
        'Review these Jira issues assigned to me. Prioritize by urgency and status, flag anything blocked or overdue, and suggest a list of focus items for today.',
    },
    dataSourceCollectors: jiraDataSourceCollectors,
    outputHandlers: jiraOutputHandlers,
  },

  prompt: {
    async getContext(ctx) {
      const creds = getJiraCredentials(ctx);
      if (!creds) return null;
      const name = creds.displayName ?? creds.email ?? null;
      return {
        connectedServices: [name ? `Jira (${name})` : 'Jira'],
        sections: [
          'Jira is connected. You can list assigned issues using the jira_list_my_issues tool.',
        ],
      };
    },
  },
});

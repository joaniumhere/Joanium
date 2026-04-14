import defineFeature from '../../Core/DefineFeature.js';
import * as VercelAPI from './API/VercelAPI.js';
import { getVercelCredentials, notConnected } from './Shared/Common.js';
import { VERCEL_TOOLS } from './Chat/Tools.js';
import { executeVercelChatTool } from './Chat/ChatExecutor.js';
import {
  vercelDataSourceCollectors,
  vercelOutputHandlers,
} from './Automation/AutomationHandlers.js';

function withVercel(ctx, cb) {
  const creds = getVercelCredentials(ctx);
  return creds
    ? cb(creds).catch((e) => ({ ok: false, error: e.message }))
    : Promise.resolve(notConnected());
}

export default defineFeature({
  id: 'vercel',
  name: 'Vercel',

  connectors: {
    services: [
      {
        id: 'vercel',
        name: 'Vercel',
        icon: '<img src="../../../Assets/Icons/Vercel.png" alt="Vercel" style="width: 26px; height: 26px; object-fit: contain;" />',
        description: 'Monitor your Vercel projects, deployments, and domains from chat.',
        helpUrl: 'https://vercel.com/account/tokens',
        helpText: 'Create a Personal Access Token →',
        oauthType: null,
        subServices: [],
        setupSteps: [
          'Go to vercel.com → Settings → Tokens',
          'Click "Create" and give the token a descriptive name',
          "Copy the token immediately — it won't be shown again",
        ],
        capabilities: [
          'List all projects with framework and deploy status',
          'Monitor recent deployments via automations',
          'AI is aware of your Vercel environment via system prompt',
        ],
        fields: [
          {
            key: 'token',
            label: 'Personal Access Token',
            placeholder: 'Your Vercel access token',
            type: 'password',
            hint: 'Create at vercel.com/account/tokens. Only shown once when created.',
          },
        ],
        automations: [
          {
            name: 'Deployment Monitor',
            description: 'Daily — summarize recent deployments and flag any failures',
          },
        ],
        defaultState: { enabled: false, credentials: {} },
        async validate(ctx) {
          const creds = ctx.connectorEngine?.getCredentials('vercel');
          if (!creds?.token) return { ok: false, error: 'No credentials stored' };
          try {
            const user = await VercelAPI.getUser(creds);
            ctx.connectorEngine?.updateCredentials('vercel', {
              username: user.username ?? user.name ?? null,
            });
            return { ok: true, username: user.username ?? user.name };
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
        withVercel(ctx, async (creds) => ({
          ok: true,
          projects: await VercelAPI.listProjects(creds),
        })),
      listDeployments: async (ctx, { limit } = {}) =>
        withVercel(ctx, async (creds) => ({
          ok: true,
          deployments: await VercelAPI.listDeployments(creds, limit),
        })),
      executeChatTool: async (ctx, { toolName, params }) =>
        executeVercelChatTool(ctx, toolName, params),
    },
  },

  renderer: { chatTools: VERCEL_TOOLS },

  automation: {
    dataSources: [
      { value: 'vercel_deployments', label: 'Vercel - Recent Deployments', group: 'Vercel' },
    ],
    outputTypes: [],
    instructionTemplates: {
      vercel_deployments:
        'Review these Vercel deployments. Summarize which succeeded, which failed, and highlight any patterns or recurring errors.',
    },
    dataSourceCollectors: vercelDataSourceCollectors,
    outputHandlers: vercelOutputHandlers,
  },

  prompt: {
    async getContext(ctx) {
      const creds = getVercelCredentials(ctx);
      if (!creds) return null;
      const username = creds.username ?? null;
      return {
        connectedServices: [username ? `Vercel (@${username})` : 'Vercel'],
        sections: [
          'Vercel is connected. You can list projects and deployments using the vercel_list_projects tool.',
        ],
      };
    },
  },
});

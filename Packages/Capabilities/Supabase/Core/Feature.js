import defineFeature from '../../Core/DefineFeature.js';
import * as SupabaseAPI from './API/SupabaseAPI.js';
import { getSupabaseCredentials, notConnected } from './Shared/Common.js';
import { SUPABASE_TOOLS } from './Chat/Tools.js';
import { executeSupabaseChatTool } from './Chat/ChatExecutor.js';
import {
  supabaseDataSourceCollectors,
  supabaseOutputHandlers,
} from './Automation/AutomationHandlers.js';

function withSupabase(ctx, cb) {
  const creds = getSupabaseCredentials(ctx);
  return creds
    ? cb(creds).catch((e) => ({ ok: false, error: e.message }))
    : Promise.resolve(notConnected());
}

export default defineFeature({
  id: 'supabase',
  name: 'Supabase',

  connectors: {
    services: [
      {
        id: 'supabase',
        name: 'Supabase',
        icon: '<img src="../../../Assets/Icons/Supabase.png" alt="Supabase" style="width: 26px; height: 26px; object-fit: contain;" />',
        description: 'Monitor your Supabase projects, databases, and edge functions from chat.',
        helpUrl: 'https://supabase.com/dashboard/account/tokens',
        helpText: 'Create an Access Token →',
        oauthType: null,
        subServices: [],
        setupSteps: [
          'Go to supabase.com → Dashboard → Account → Access Tokens',
          'Click "Generate new token" and give it a name',
          'Copy the generated token below',
        ],
        capabilities: [
          'List all Supabase projects with region and status',
          'Monitor project health via automations',
          'AI is aware of your Supabase environment',
        ],
        fields: [
          {
            key: 'token',
            label: 'Access Token',
            placeholder: 'sbp_...',
            type: 'password',
            hint: 'Create at supabase.com/dashboard/account/tokens.',
          },
        ],
        automations: [
          {
            name: 'Project Status',
            description: 'Daily — report Supabase project statuses and flag any issues',
          },
        ],
        defaultState: { enabled: false, credentials: {} },
        async validate(ctx) {
          const creds = ctx.connectorEngine?.getCredentials('supabase');
          if (!creds?.token) return { ok: false, error: 'No credentials stored' };
          try {
            const projects = await SupabaseAPI.listProjects(creds);
            return { ok: true, projectCount: projects.length };
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
        withSupabase(ctx, async (creds) => ({
          ok: true,
          projects: await SupabaseAPI.listProjects(creds),
        })),
      listFunctions: async (ctx, { projectRef }) =>
        withSupabase(ctx, async (creds) => ({
          ok: true,
          functions: await SupabaseAPI.listFunctions(creds, projectRef),
        })),
      executeChatTool: async (ctx, { toolName, params }) =>
        executeSupabaseChatTool(ctx, toolName, params),
    },
  },

  renderer: { chatTools: SUPABASE_TOOLS },

  automation: {
    dataSources: [{ value: 'supabase_projects', label: 'Supabase - Projects', group: 'Supabase' }],
    outputTypes: [],
    instructionTemplates: {
      supabase_projects:
        'Review these Supabase projects. Summarize their status, flag any that are inactive or paused, and note any concerns.',
    },
    dataSourceCollectors: supabaseDataSourceCollectors,
    outputHandlers: supabaseOutputHandlers,
  },

  prompt: {
    async getContext(ctx) {
      const creds = getSupabaseCredentials(ctx);
      if (!creds) return null;
      return {
        connectedServices: ['Supabase'],
        sections: [
          'Supabase is connected. You can list projects using the supabase_list_projects tool.',
        ],
      };
    },
  },
});

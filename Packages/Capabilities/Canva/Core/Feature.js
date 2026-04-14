import defineFeature from '../../Core/DefineFeature.js';
import * as CanvaAPI from './API/CanvaAPI.js';
import { getCanvaCredentials, notConnected } from './Shared/Common.js';
import { CANVA_TOOLS } from './Chat/Tools.js';
import { executeCanvaChatTool } from './Chat/ChatExecutor.js';
import { canvaDataSourceCollectors, canvaOutputHandlers } from './Automation/AutomationHandlers.js';

async function getCanvaWorkspace() {
  return import('../CanvaWorkspace.js');
}

function withCanva(ctx, cb) {
  const creds = getCanvaCredentials(ctx);
  return creds
    ? cb(creds).catch((e) => ({ ok: false, error: e.message }))
    : Promise.resolve(notConnected());
}

export default defineFeature({
  id: 'canva',
  name: 'Canva',

  connectors: {
    services: [
      {
        id: 'canva',
        name: 'Canva',
        icon: '<img src="../../../Assets/Icons/Canva.png" alt="Canva" style="width: 26px; height: 26px; object-fit: contain;" />',
        description: 'Browse and manage your Canva designs, and monitor recent creative activity.',
        helpUrl: 'https://www.canva.dev/docs/connect/quickstart/',
        helpText: 'Set up Canva Connect API →',
        oauthType: 'canva',
        connectMethod: 'oauthStart',
        connectLabel: 'Connect with Canva',
        connectingLabel: 'Opening Canva authorisation...',
        subServices: [],
        setupSteps: [
          'Go to canva.dev and sign in with your Canva account',
          'Click "Create an integration" and fill in your app details',
          'Under Redirect URIs, add: http://localhost:42814/oauth/callback',
          'Copy the Client ID and Client Secret from your integration page',
          'Enter them below and click Connect',
        ],
        capabilities: [
          'List and browse your Canva designs in chat',
          'Monitor recent design activity via automations',
          'AI is aware of your connected Canva account',
        ],
        fields: [
          {
            key: 'clientId',
            label: 'Client ID',
            placeholder: 'Your Canva integration Client ID',
            type: 'text',
            hint: 'Found in your integration settings at canva.dev.',
          },
          {
            key: 'clientSecret',
            label: 'Client Secret',
            placeholder: 'Your Canva integration Client Secret',
            type: 'password',
            hint: 'Keep this private. Found in your integration settings at canva.dev.',
          },
        ],
        automations: [
          {
            name: 'Design Activity',
            description: 'Daily — list recently updated designs and creative activity',
          },
        ],
        defaultState: { enabled: false, credentials: {} },
        async validate(ctx) {
          const creds = ctx.connectorEngine?.getCredentials('canva');
          if (!creds?.accessToken)
            return { ok: false, error: 'Not connected — complete the Canva OAuth flow first.' };
          try {
            const { getFreshCreds } = await getCanvaWorkspace();
            const freshCreds = await getFreshCreds(creds);
            const user = await CanvaAPI.getUser(freshCreds);
            const displayName = user.display_name ?? user.name ?? 'Canva user';
            ctx.connectorEngine?.updateCredentials('canva', { displayName });
            return { ok: true, displayName };
          } catch (err) {
            return { ok: false, error: err.message };
          }
        },
      },
    ],
  },

  lifecycle: {
    async onBoot(ctx) {
      const { setConnectorEngine } = await getCanvaWorkspace();
      setConnectorEngine(ctx.connectorEngine);
    },
  },

  main: {
    methods: {
      async oauthStart(ctx, { clientId, clientSecret }) {
        if (!clientId?.trim() || !clientSecret?.trim()) {
          return { ok: false, error: 'Client ID and Client Secret are required' };
        }
        const { startOAuthFlow } = await getCanvaWorkspace();
        const tokens = await startOAuthFlow(clientId.trim(), clientSecret.trim());
        ctx.connectorEngine?.saveConnector('canva', tokens);
        ctx.invalidateSystemPrompt?.();
        return { ok: true, displayName: tokens.displayName };
      },

      listDesigns: async (ctx) =>
        withCanva(ctx, async (creds) => {
          const { getFreshCreds } = await getCanvaWorkspace();
          const freshCreds = await getFreshCreds(creds);
          return { ok: true, designs: await CanvaAPI.listDesigns(freshCreds) };
        }),

      executeChatTool: async (ctx, { toolName, params }) =>
        executeCanvaChatTool(ctx, toolName, params),
    },
  },

  renderer: { chatTools: CANVA_TOOLS },

  automation: {
    dataSources: [
      { value: 'canva_recent_designs', label: 'Canva - Recent Designs', group: 'Canva' },
    ],
    outputTypes: [],
    instructionTemplates: {
      canva_recent_designs:
        'Review these Canva designs. Summarize recent activity, note which designs were updated most recently, and flag anything that needs attention.',
    },
    dataSourceCollectors: canvaDataSourceCollectors,
    outputHandlers: canvaOutputHandlers,
  },

  prompt: {
    async getContext(ctx) {
      const creds = getCanvaCredentials(ctx);
      if (!creds) return null;
      const displayName = creds.displayName ?? null;
      return {
        connectedServices: [displayName ? `Canva (${displayName})` : 'Canva'],
        sections: [
          "Canva is connected. You can list the user's designs using the canva_list_designs tool.",
        ],
      };
    },
  },
});

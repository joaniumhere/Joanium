import defineFeature from '../../../Core/DefineFeature.js';
import * as FormsAPI from './API/FormsAPI.js';
import { FORMS_TOOLS } from './Chat/Tools.js';
import { executeFormsChatTool } from './Chat/ChatExecutor.js';
import { withGoogle } from '../../Common.js';

export default defineFeature({
  id: 'forms',
  name: 'Google Forms',
  dependsOn: ['google-workspace'],
  connectors: {
    serviceExtensions: [
      {
        target: 'google',
        subServices: [
          {
            key: 'forms',
            icon: '<img src="../../../Assets/Icons/Forms.png" alt="Google Forms" style="width: 26px; height: 26px; object-fit: contain;" />',
            name: 'Google Forms',
            apiUrl: 'https://console.cloud.google.com/apis/library/forms.googleapis.com',
          },
        ],
        capabilities: [
          'Read Google Form structure and questions',
          'Retrieve and analyze form responses',
        ],
      },
    ],
  },
  main: {
    methods: {
      async getForm(ctx, { formId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!formId) return { ok: false, error: 'formId is required' };
          const form = await FormsAPI.getForm(credentials, formId);
          return { ok: true, form, questions: FormsAPI.extractQuestions(form) };
        });
      },

      async listResponses(ctx, { formId, maxResults = 50, filter } = {}) {
        return withGoogle(ctx, async (credentials) => {
          if (!formId) return { ok: false, error: 'formId is required' };
          return {
            ok: true,
            ...(await FormsAPI.listResponses(credentials, formId, { maxResults, filter })),
          };
        });
      },

      async getResponse(ctx, { formId, responseId }) {
        return withGoogle(ctx, async (credentials) => {
          if (!formId || !responseId)
            return { ok: false, error: 'formId and responseId are required' };
          return {
            ok: true,
            response: await FormsAPI.getResponse(credentials, formId, responseId),
          };
        });
      },

      async executeChatTool(ctx, { toolName, params }) {
        return executeFormsChatTool(ctx, toolName, params);
      },
    },
  },
  renderer: {
    chatTools: FORMS_TOOLS,
  },
});

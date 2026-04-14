import * as NetlifyAPI from '../API/NetlifyAPI.js';
import { requireNetlifyCredentials } from '../Shared/Common.js';

export const netlifyDataSourceCollectors = {
  async netlify_deployments(ctx) {
    const creds = requireNetlifyCredentials(ctx);
    const deploys = await NetlifyAPI.listAllDeploys(creds, 20);
    if (!deploys.length) return 'EMPTY: No Netlify deployments found.';
    const failed = deploys.filter((d) => d.state === 'error');
    return [
      `Netlify Deployments — ${deploys.length} recent${failed.length ? ` (${failed.length} failed)` : ''}:`,
      '',
      ...deploys.map(
        (d, i) =>
          `${i + 1}. ${d.siteName ?? d.siteId} — ${d.state}${d.branch ? ` [${d.branch}]` : ''}${d.errorMessage ? ` ⚠ ${d.errorMessage}` : ''}`,
      ),
    ].join('\n');
  },
};

export const netlifyOutputHandlers = {};

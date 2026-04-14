import * as VercelAPI from '../API/VercelAPI.js';
import { requireVercelCredentials } from '../Shared/Common.js';

export const vercelDataSourceCollectors = {
  async vercel_deployments(ctx) {
    const creds = requireVercelCredentials(ctx);
    const deploys = await VercelAPI.listDeployments(creds, 20);
    if (!deploys.length) return 'EMPTY: No Vercel deployments found.';
    return `Vercel Deployments — ${deploys.length} recent:\n\n${deploys
      .map((d, i) => `${i + 1}. ${d.name} — ${d.state} (${d.target})${d.url ? ` → ${d.url}` : ''}`)
      .join('\n')}`;
  },
};

export const vercelOutputHandlers = {};

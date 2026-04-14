import * as CanvaAPI from '../API/CanvaAPI.js';
import { requireCanvaCredentials } from '../Shared/Common.js';

export const canvaDataSourceCollectors = {
  async canva_recent_designs(ctx) {
    const creds = requireCanvaCredentials(ctx);
    const designs = await CanvaAPI.listDesigns(creds);
    if (!designs.length) return 'EMPTY: No Canva designs found.';
    return `Canva Designs — ${designs.length} recent:\n\n${designs
      .map(
        (d, i) =>
          `${i + 1}. ${d.title} (${d.type}) — updated ${d.updatedAt ? new Date(d.updatedAt * 1000).toLocaleDateString() : 'unknown'}`,
      )
      .join('\n')}`;
  },
};

export const canvaOutputHandlers = {};

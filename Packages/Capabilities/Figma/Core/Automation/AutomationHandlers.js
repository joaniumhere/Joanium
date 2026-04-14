import * as FigmaAPI from '../API/FigmaAPI.js';
import { requireFigmaCredentials } from '../Shared/Common.js';

export const figmaDataSourceCollectors = {
  async figma_file_comments(ctx, dataSource) {
    if (!dataSource?.file_key) throw new Error('file_key is required for figma_file_comments');
    const creds = requireFigmaCredentials(ctx);
    const comments = await FigmaAPI.getFileComments(creds, dataSource.file_key);
    if (!comments.length) return 'EMPTY: No comments found on this Figma file.';
    const open = comments.filter((c) => !c.resolved);
    const resolved = comments.filter((c) => c.resolved);
    return [
      `Figma File Comments — ${comments.length} total (${open.length} open, ${resolved.length} resolved):`,
      '',
      ...open.slice(0, 20).map((c, i) => `${i + 1}. [OPEN] ${c.author}: ${c.message}`),
      ...(resolved.length ? [`\n${resolved.length} comment(s) already resolved.`] : []),
    ].join('\n');
  },
};

export const figmaOutputHandlers = {};

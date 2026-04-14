import * as SupabaseAPI from '../API/SupabaseAPI.js';
import { requireSupabaseCredentials } from '../Shared/Common.js';

export const supabaseDataSourceCollectors = {
  async supabase_projects(ctx) {
    const creds = requireSupabaseCredentials(ctx);
    const projects = await SupabaseAPI.listProjects(creds);
    if (!projects.length) return 'EMPTY: No Supabase projects found.';
    return `Supabase Projects — ${projects.length} total:\n\n${projects
      .map((p, i) => `${i + 1}. ${p.name} (${p.ref}) — ${p.status} in ${p.region}`)
      .join('\n')}`;
  },
};

export const supabaseOutputHandlers = {};

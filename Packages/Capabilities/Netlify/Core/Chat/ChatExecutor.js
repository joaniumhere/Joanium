import * as NetlifyAPI from '../API/NetlifyAPI.js';
import { getNetlifyCredentials, notConnected } from '../Shared/Common.js';

export async function executeNetlifyChatTool(ctx, toolName, params) {
  const creds = getNetlifyCredentials(ctx);
  if (!creds) return notConnected();

  try {
    // ── Sites ──────────────────────────────────────────────────────────────
    if (toolName === 'netlify_list_sites') {
      const sites = await NetlifyAPI.listSites(creds);
      return { ok: true, sites };
    }

    if (toolName === 'netlify_get_site') {
      const site = await NetlifyAPI.getSite(creds, params.site_id);
      return { ok: true, site };
    }

    if (toolName === 'netlify_update_site') {
      const { site_id, ...rest } = params;
      const body = {};
      if (rest.name !== undefined) body.name = rest.name;
      if (rest.custom_domain !== undefined) body.custom_domain = rest.custom_domain;
      if (rest.build_command !== undefined || rest.publish_directory !== undefined) {
        body.build_settings = {};
        if (rest.build_command !== undefined) body.build_settings.cmd = rest.build_command;
        if (rest.publish_directory !== undefined) body.build_settings.dir = rest.publish_directory;
      }
      const site = await NetlifyAPI.updateSite(creds, site_id, body);
      return { ok: true, site };
    }

    if (toolName === 'netlify_delete_site') {
      const result = await NetlifyAPI.deleteSite(creds, params.site_id);
      return { ok: true, ...result };
    }

    if (toolName === 'netlify_list_site_files') {
      const files = await NetlifyAPI.listSiteFiles(creds, params.site_id);
      return { ok: true, files };
    }

    // ── Deploys ────────────────────────────────────────────────────────────
    if (toolName === 'netlify_get_deploy') {
      const deploy = await NetlifyAPI.getDeploy(creds, params.deploy_id);
      return { ok: true, deploy };
    }

    if (toolName === 'netlify_list_site_deploys') {
      const deploys = await NetlifyAPI.listSiteDeploys(creds, params.site_id, params.limit);
      return { ok: true, deploys };
    }

    if (toolName === 'netlify_cancel_deploy') {
      const deploy = await NetlifyAPI.cancelDeploy(creds, params.deploy_id);
      return { ok: true, deploy };
    }

    if (toolName === 'netlify_restore_deploy') {
      const deploy = await NetlifyAPI.restoreDeploy(creds, params.deploy_id);
      return { ok: true, deploy };
    }

    if (toolName === 'netlify_trigger_site_build') {
      const deploy = await NetlifyAPI.triggerSiteBuild(creds, params.site_id, {
        clearCache: params.clear_cache ?? false,
      });
      return { ok: true, deploy };
    }

    // ── Forms & Submissions ────────────────────────────────────────────────
    if (toolName === 'netlify_list_forms') {
      const forms = await NetlifyAPI.listForms(creds, params.site_id);
      return { ok: true, forms };
    }

    if (toolName === 'netlify_list_form_submissions') {
      const submissions = await NetlifyAPI.listFormSubmissions(creds, params.form_id, params.limit);
      return { ok: true, submissions };
    }

    if (toolName === 'netlify_delete_form_submission') {
      const result = await NetlifyAPI.deleteSubmission(creds, params.submission_id);
      return { ok: true, ...result };
    }

    // ── Hooks (Notifications) ──────────────────────────────────────────────
    if (toolName === 'netlify_list_hooks') {
      const hooks = await NetlifyAPI.listHooks(creds, params.site_id);
      return { ok: true, hooks };
    }

    if (toolName === 'netlify_create_hook') {
      const hook = await NetlifyAPI.createHook(creds, {
        site_id: params.site_id,
        type: params.type,
        event: params.event,
        data: params.data,
      });
      return { ok: true, hook };
    }

    if (toolName === 'netlify_delete_hook') {
      const result = await NetlifyAPI.deleteHook(creds, params.hook_id);
      return { ok: true, ...result };
    }

    // ── Build Hooks ────────────────────────────────────────────────────────
    if (toolName === 'netlify_list_build_hooks') {
      const buildHooks = await NetlifyAPI.listBuildHooks(creds, params.site_id);
      return { ok: true, buildHooks };
    }

    if (toolName === 'netlify_create_build_hook') {
      const buildHook = await NetlifyAPI.createBuildHook(creds, params.site_id, {
        title: params.title,
        branch: params.branch,
      });
      return { ok: true, buildHook };
    }

    if (toolName === 'netlify_delete_build_hook') {
      const result = await NetlifyAPI.deleteBuildHook(creds, params.site_id, params.build_hook_id);
      return { ok: true, ...result };
    }

    if (toolName === 'netlify_trigger_build_hook') {
      const result = await NetlifyAPI.triggerBuildHook(creds, params.build_hook_id);
      return { ok: true, ...result };
    }

    // ── Environment Variables ──────────────────────────────────────────────
    if (toolName === 'netlify_list_env_vars') {
      const env = await NetlifyAPI.listEnvVars(creds, params.site_id);
      return { ok: true, env };
    }

    if (toolName === 'netlify_update_env_vars') {
      const env = await NetlifyAPI.updateEnvVars(creds, params.site_id, params.vars);
      return { ok: true, env };
    }

    if (toolName === 'netlify_delete_env_var') {
      const result = await NetlifyAPI.deleteEnvVar(creds, params.site_id, params.key);
      return { ok: true, ...result };
    }

    // ── DNS ────────────────────────────────────────────────────────────────
    if (toolName === 'netlify_list_dns_zones') {
      const zones = await NetlifyAPI.listDnsZones(creds);
      return { ok: true, zones };
    }

    if (toolName === 'netlify_list_dns_records') {
      const records = await NetlifyAPI.listDnsRecords(creds, params.zone_id);
      return { ok: true, records };
    }

    if (toolName === 'netlify_create_dns_record') {
      const record = await NetlifyAPI.createDnsRecord(creds, params.zone_id, {
        type: params.type,
        hostname: params.hostname,
        value: params.value,
        ttl: params.ttl,
      });
      return { ok: true, record };
    }

    if (toolName === 'netlify_delete_dns_record') {
      const result = await NetlifyAPI.deleteDnsRecord(creds, params.zone_id, params.record_id);
      return { ok: true, ...result };
    }

    // ── Accounts & Members ─────────────────────────────────────────────────
    if (toolName === 'netlify_list_accounts') {
      const accounts = await NetlifyAPI.listAccounts(creds);
      return { ok: true, accounts };
    }

    if (toolName === 'netlify_list_members') {
      const members = await NetlifyAPI.listMembers(creds, params.account_id);
      return { ok: true, members };
    }

    // ── SSL ────────────────────────────────────────────────────────────────
    if (toolName === 'netlify_get_ssl') {
      const ssl = await NetlifyAPI.getSsl(creds, params.site_id);
      return { ok: true, ssl };
    }

    if (toolName === 'netlify_provision_ssl') {
      const ssl = await NetlifyAPI.provisionSsl(creds, params.site_id);
      return { ok: true, ssl };
    }

    // ── Snippets ───────────────────────────────────────────────────────────
    if (toolName === 'netlify_list_snippets') {
      const snippets = await NetlifyAPI.listSnippets(creds, params.site_id);
      return { ok: true, snippets };
    }

    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

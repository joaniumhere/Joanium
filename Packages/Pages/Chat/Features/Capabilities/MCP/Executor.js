let _mcpToolNames = new Set();
let _lastFetch = 0;
let _refreshPromise = null;
const CACHE_TTL = 30_000; // 30 s

async function refreshMCPTools() {
  if (Date.now() - _lastFetch < CACHE_TTL) return;
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const res = await window.electronAPI?.invoke?.('mcp-get-tools');
      if (res?.ok) {
        _mcpToolNames = new Set((res.tools ?? []).map(t => t.name));
        _lastFetch = Date.now();
      }
    } catch { /* non-fatal */ }
  })().finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

export async function handles(toolName) {
  await refreshMCPTools();
  return _mcpToolNames.has(toolName);
}

// Synchronous check — used by Index.js normalization lookup
export function handlesSync(toolName) {
  return _mcpToolNames.has(toolName);
}

export async function execute(toolName, params, onStage = () => { }) {
  onStage(`🔌 Calling MCP tool: ${toolName}`);

  const result = await window.electronAPI?.invoke?.('mcp-call-tool', { toolName, args: params });
  if (!result) return '⚠️ MCP is not available in this environment.';
  if (!result.ok) throw new Error(result.error ?? 'MCP tool call failed');

  return result.result ?? '(no output)';
}

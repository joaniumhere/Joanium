
import { CAPABILITY_MANIFESTS } from './CapabilityInfo.js';
export { CAPABILITY_MANIFESTS };

export const ALL_TRIGGERED_TOOLS = CAPABILITY_MANIFESTS.flatMap((m) => m.tools);
export const TOOLS_BY_GROUP = new Map(
  CAPABILITY_MANIFESTS.filter((m) => m.tools.length > 0).map((m) => [m.name, m.tools]),
);
export const TOOL_NAMES_BY_GROUP = new Map(
  [...TOOLS_BY_GROUP.entries()].map(([name, tools]) => [name, new Set(tools.map((t) => t.name))]),
);
export const CATEGORY_CONNECTOR_MAP = new Map();
for (const manifest of CAPABILITY_MANIFESTS)
  for (const cat of manifest.featureCategories) {
    const connectorId = manifest.connectors[cat];
    connectorId && CATEGORY_CONNECTOR_MAP.set(cat, connectorId);
  }
export const MANIFEST_EXECUTORS = CAPABILITY_MANIFESTS.map((m) => m.executor).filter(Boolean);
export const TRIGGERED_GROUPS_FROM_MANIFESTS = CAPABILITY_MANIFESTS.map((m) => ({
  name: m.name,
  description: m.description,
  triggers: m.triggers,
  featureCategories: m.featureCategories,
}));

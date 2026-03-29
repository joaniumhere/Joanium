# Documentation

This folder documents the current Evelina codebase as it exists in this repository today: a thin Electron main process, a single-page renderer shell, project-scoped workspaces, scheduled automations, scheduled AI agents, channel responders, MCP integration, and local-first persistence under `Data/`.

## Suggested Reading Order

1. [Architecture.md](Architecture.md)
2. [Features.md](Features.md)
3. [Projects.md](Projects.md)
4. [Automations.md](Automations.md)
5. [Agents.md](Agents.md)
6. [Connectors.md](Connectors.md)
7. [Channels.md](Channels.md)
8. [MCP.md](MCP.md)
9. [Skills.md](Skills.md)
10. [Personas.md](Personas.md)
11. [IPC-Reference.md](IPC-Reference.md)
12. [Development.md](Development.md)

## Document Map

| Doc | Covers |
| --- | --- |
| [Architecture.md](Architecture.md) | Startup flow, package boundaries, renderer routing, engines, persistence, system prompt assembly |
| [Features.md](Features.md) | User-facing capabilities across chat, workspaces, automations, agents, events, settings, and analytics |
| [Projects.md](Projects.md) | Project records, workspace context, project-scoped chats, and active project behavior |
| [Automations.md](Automations.md) | Trigger model, action catalog, execution rules, and saved JSON shape |
| [Agents.md](Agents.md) | Scheduled AI jobs, data sources, outputs, history, and model failover behavior |
| [Connectors.md](Connectors.md) | AI providers, Gmail/GitHub, and the built-in free API connector catalog |
| [Channels.md](Channels.md) | Telegram, WhatsApp, Discord, and Slack reply pipeline |
| [MCP.md](MCP.md) | MCP server configuration, built-in browser MCP, and how tools surface in chat |
| [Skills.md](Skills.md) | Skill file format, enablement model, and how enabled skills affect prompts |
| [Personas.md](Personas.md) | Persona file format, active persona persistence, and page behavior |
| [IPC-Reference.md](IPC-Reference.md) | Main IPC domains, preload methods, and payload expectations |
| [Development.md](Development.md) | Extension patterns for pages, IPC, chat capabilities, actions, agents, and providers |

## Current Runtime Map

- `App.js` boots the app, registers IPC, and starts the background engines.
- `Packages/Main/` contains Electron-facing services, IPC handlers, paths, and window management.
- `Packages/Renderer/` contains the SPA shell, pages, shared state, and feature modules.
- `Packages/Automation/`, `Packages/Agents/`, `Packages/Channels/`, and `Packages/MCP/` are separate runtime subsystems, not renderer-only helpers.
- `Public/index.html` is the main app shell. `Public/Setup.html` is the only separate onboarding shell still loaded directly.
- `Data/` is the source of truth for user settings, chats, projects, connector state, automation state, agents, channels, MCP server configs, usage, and window state.

## Notes On Accuracy

- These docs describe the current SPA-based renderer, not the older multi-page renderer architecture.
- Skills are now enabled or disabled explicitly through `Data/Skills.json`; disabled skill files are ignored.
- Channels are configured from Settings and reply through the full renderer chat pipeline.
- MCP is live and includes a built-in browser server that drives the in-app browser preview.

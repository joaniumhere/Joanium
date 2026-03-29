# Joanium

> One desktop AI workspace for chat, projects, automations, agents, and tools.

**Website:** [Joanium.com](https://joanium.com)

Joanium is a local-first desktop AI app built with Electron. It brings together multi-model chat, project-aware workspace tools, scheduled automations, AI agents, channels, MCP servers, skills, personas, and usage tracking in one place.

It is built for people who want a serious AI workspace, not a pile of disconnected tabs, scripts, and dashboards.

## What Joanium Does

- Chat with different AI models from one interface.
- Work inside real project folders with file, terminal, git, and browser-aware tooling.
- Run scheduled automations for deterministic tasks.
- Run scheduled AI agents for monitoring, summaries, triage, and recurring analysis.
- Connect services like Gmail and GitHub to bring live context into chat and background jobs.
- Extend the app with MCP servers, skills, and personas.
- Keep data stored locally under `Data/` instead of treating your desktop like a browser tab.

## Why It Feels Different

- **Local-first by default** - chats, settings, projects, usage, and runtime state live on your machine.
- **Built for real workflows** - chat is connected to projects, tools, automations, and agents instead of existing as an isolated prompt box.
- **Modular architecture** - main process services, renderer features, automations, agents, channels, and MCP stay cleanly separated.
- **Expandable without chaos** - connectors, skills, personas, and docs make it easier to grow the app without turning it into a mess.

## Quick Start

```bash
# Prerequisites: Node.js 18+ and npm

git clone <repository-url>
cd <repository-folder>
npm install
npm start
```

On first launch, Joanium walks through setup and stores its local app data inside `Data/`.

## Core Areas

- **Chat** - multi-model conversations with local tools, connectors, and MCP support.
- **Projects** - workspace-aware context with project-scoped chats and tooling.
- **Automations** - scheduled action chains for repeatable tasks.
- **Agents** - scheduled AI jobs that collect data, reason over it, and produce outputs.
- **Events** - a live operational timeline for runs, failures, skips, and active jobs.
- **Skills** - local Markdown-based behavior packs that shape how the assistant works.
- **Personas** - switch the assistant's identity, tone, and framing.
- **Usage** - local tracking for model activity and cost visibility.

## Project Structure

```text
Joanium/
|-- App.js
|-- package.json
|-- Packages/
|   |-- Main/          # Electron-facing services, IPC, paths, windows
|   |-- Renderer/      # SPA shell, pages, shared state, feature modules
|   |-- Automation/    # Scheduler and action execution
|   |-- Agents/        # Scheduled AI jobs and job history
|   |-- Channels/      # External channel responders
|   |-- Connectors/    # AI providers, Gmail, GitHub, and other integrations
|   |-- MCP/           # MCP runtime support
|   `-- System/        # Shared system prompt and app-level logic
|-- Public/            # App shells and static assets
|-- Data/              # Local user data, chats, projects, usage, config
|-- Skills/            # Installed skill definitions
|-- Personas/          # Persona definitions
`-- Docs/              # Architecture and feature documentation
```

## Documentation

The [`Docs/`](Docs/) folder covers the current runtime and feature set in depth.

- [`Docs/Architecture.md`](Docs/Architecture.md) - startup flow, package boundaries, renderer routing, and persistence
- [`Docs/Features.md`](Docs/Features.md) - chat, projects, automations, agents, events, skills, personas, and usage
- [`Docs/Projects.md`](Docs/Projects.md) - workspace behavior and project-scoped chat storage
- [`Docs/Automations.md`](Docs/Automations.md) - triggers, actions, and execution rules
- [`Docs/Agents.md`](Docs/Agents.md) - scheduled AI jobs, inputs, outputs, and history
- [`Docs/Connectors.md`](Docs/Connectors.md) - providers, Gmail, GitHub, and connector setup
- [`Docs/Channels.md`](Docs/Channels.md) - external channel reply flow
- [`Docs/MCP.md`](Docs/MCP.md) - MCP server support and tool surfacing
- [`Docs/Development.md`](Docs/Development.md) - extension patterns and implementation guidance

## Status

Joanium is actively being built and refined. The current codebase already includes the app shell, project-aware workflows, scheduled runtimes, connector support, and local persistence model that the product is built around.

## Built By

[Joel Jolly](https://joeljolly.vercel.app)  
MIT License

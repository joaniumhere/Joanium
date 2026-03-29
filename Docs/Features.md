# Features

This document describes the product as it works in the current repository, not the older multi-page version. Evelina now runs as a single renderer shell backed by several main-process engines, so many features share the same state, model selection, system prompt, and persistence layer.

## Core Product Shape

The current sidebar pages are:

- `Chat`
- `Automations`
- `Agents`
- `Events`
- `Skills`
- `Personas`
- `Usage`

The Settings modal contains additional operational panels that are not separate sidebar pages:

- provider/API configuration
- connectors
- channels
- MCP servers
- user profile, memory, and instructions
- theme and appearance controls

That split matters because some important runtime features, such as Channels and MCP, are configured from Settings but are consumed by the chat pipeline and background engines.

## Chat

The chat page is the center of the app. It is not a thin text box over a single LLM request. It is a stateful orchestration layer that can:

- choose the active provider and model
- stream assistant output
- call built-in tools
- call Gmail and GitHub tools through IPC
- call workspace and terminal tools when a project/workspace is active
- call connected MCP tools
- persist chat history locally
- keep usage tracking in sync
- share the active system prompt with channels and other AI-driven flows

### What the current chat flow supports

- plain text prompts
- image attachments
- extracted text from supported local documents
- workspace-aware file and shell tooling
- connector-backed tools
- MCP-backed tools
- browser automation through the built-in browser MCP server

### Tool groups exposed to chat

Current built-in tool families include:

- Gmail
- GitHub
- terminal and workspace inspection
- file reads and writes
- git helpers
- browser/search helpers
- weather, crypto, finance, geography, astronomy, Wikipedia, dictionary, quotes, jokes, facts, and utility helpers

The final tool list is assembled dynamically. Built-in tools are registered locally, then connected MCP tools are merged into the registry at runtime.

### Important current chat constraints

- Workspace tools are only useful when a workspace path is active.
- Some browser-control MCP tools are treated as higher risk and may require explicit user confirmation in the chat flow.
- Chat history is sanitized before persistence so hidden internal tool-execution messages do not get stored alongside normal conversation turns.

## Projects And Workspaces

Projects are first-class records now. They are not just a remembered folder path.

Each project stores:

- a stable project id
- display name
- absolute workspace root path
- optional free-form project context
- creation and update timestamps
- last-opened timestamp

Projects matter because they change how chat behaves:

- the active project becomes `state.activeProject`
- the active workspace path becomes `state.workspacePath`
- project chats are saved under that project's storage folder instead of global chat storage
- workspace tools now have a clear scope to inspect or modify

This means Evelina supports both:

- global chats under `Data/Chats/`
- project-scoped chats under `Data/Projects/<project-id>/Chats/`

See [Projects.md](Projects.md) for the storage and lifecycle details.

## Automations

Automations are scheduled non-AI action chains that run in the main process. They are useful for deterministic tasks such as:

- opening websites
- sending notifications
- running shell commands or scripts
- creating folders or moving files
- writing files
- sending Gmail messages
- checking GitHub state
- hitting webhooks

Key traits of the current automation system:

- runs on startup and on a 60-second scheduler tick
- supports `on_startup`, `interval`, `hourly`, `daily`, and `weekly` triggers
- persists definitions and recent history in `Data/Automations.json`
- stops the current action chain on the first thrown error

Automations are ideal when you already know the exact action sequence you want. They do not do planning or summarization themselves.

See [Automations.md](Automations.md) for the action catalog and trigger rules.

## Agents

Agents are scheduled AI jobs. They are different from automations in one important way: they collect data, ask a model to interpret it, and then decide what output to produce based on the configured output type.

Typical agent use cases:

- daily email briefings
- PR review summaries
- issue triage
- website or feed monitoring
- alerts generated from local files or system stats

Current agent behavior includes:

- per-agent primary model selection
- fallback model chain
- multiple jobs per agent
- multiple data sources per job
- structured job history
- `[NOTHING]` short-circuit handling when there is nothing actionable
- optional outputs like email, file writing, notifications, webhooks, memory append, and GitHub PR review comments

Agents are AI-first and decision-oriented. Automations are deterministic and action-first.

See [Agents.md](Agents.md) for the exact source and output types.

## Events

The Events page is an operational timeline, not a separate persisted subsystem.

It aggregates:

- automation history
- agent job history
- currently running agent jobs

Important implementation details:

- it refreshes frequently from live IPC calls
- there is no dedicated `Events.json`
- clearing event history clears automation and agent histories at the source

This page is mainly for visibility and troubleshooting. It helps answer:

- what ran
- when it ran
- whether it acted, skipped, or failed
- what is still running right now

## Skills

Skills are local Markdown files that can be enabled or disabled. Enabled skills are injected into the system prompt. Disabled skills are ignored.

That makes the current skill system much stronger than a simple tag library. A skill is effectively prompt-time behavior and domain guidance that the assistant can use during planning and response generation.

The skills page currently supports:

- listing installed skill files
- toggling individual skills
- enabling all skills
- disabling all skills

The enablement state lives in `Data/Skills.json`, not inside the skill files themselves.

See [Skills.md](Skills.md) for the file format and prompt effects.

## Personas

Personas are also Markdown files, but they serve a different role from skills.

- A persona changes the assistant's identity, tone, and framing.
- A skill adds domain-specific guidance or workflows.

Only one persona is active at a time. The active persona is stored in `Data/ActivePersona.json` and is folded into the system prompt.

The personas page supports:

- listing available persona files
- selecting one as active
- resetting back to the default assistant identity

See [Personas.md](Personas.md) for the format and activation model.

## Connectors

The connector layer currently includes two categories:

- service connectors that require credentials, such as Gmail and GitHub
- free data connectors that are enabled locally and may or may not need an API key

These connectors are shared across multiple product areas:

- chat tools
- automations
- agents
- system prompt enrichment

Examples:

- Gmail powers inbox reading, search, send, label, reply, archive, and draft workflows
- GitHub powers repo access, issues, PRs, notifications, workflows, stats, and reviews
- free connectors supply weather, crypto, exchange rates, FRED, NASA, quotes, Wikipedia, and other utility data

See [Connectors.md](Connectors.md) for the full connector inventory.

## Channels

Channels let external messages enter the app through Telegram, WhatsApp, Discord, or Slack.

The current architecture is important:

- `ChannelEngine` polls the remote service in the main process
- incoming messages are forwarded to the renderer through `channel-incoming`
- the renderer runs the full chat agent loop
- the renderer replies through `channel-reply`
- the main process sends the final text back to the originating platform

This means channel replies use the same AI stack as normal chat:

- selected provider/model
- current system prompt
- tool access
- usage tracking

They are not handled by a separate lightweight bot implementation.

See [Channels.md](Channels.md) for platform-specific configuration details.

## MCP And Browser Preview

Evelina includes live MCP support and an embedded browser preview.

Current MCP capabilities:

- custom MCP servers over `stdio`
- custom MCP servers over `http`
- a built-in browser server exposed as `builtin_browser`
- runtime merging of MCP tools into the chat tool registry

The built-in browser server is special because it is connected to the in-app browser preview. When the assistant uses browser tools, the navigation can be shown inside the app instead of disappearing into an invisible headless flow.

See [MCP.md](MCP.md) for the connection and tool-surfacing model.

## Usage Analytics

Usage tracking is local and persisted in `Data/Usage.json`.

The current system records:

- timestamp
- provider
- model
- model display name
- input tokens
- output tokens
- chat id when applicable

Agent runs also write usage records, but they do so with `chatId: null`.

The Usage page is therefore the shared accounting layer for:

- normal chat sessions
- scheduled agent runs

## Settings And Setup

The first-run setup shell is still separate from the main app shell. After setup:

- provider keys and provider settings are read from `User.json`
- the main app loads `Public/index.html`
- ongoing configuration is handled from the Settings modal rather than a dedicated setup-only route

Current provider families include:

- Anthropic
- OpenAI
- Google
- OpenRouter
- Mistral
- NVIDIA
- DeepSeek
- MiniMax
- Ollama
- LM Studio

Local providers use normalized OpenAI-compatible `/v1/chat/completions` endpoints and require both an endpoint and a model id to be truly usable.

## How These Features Work Together

The most important thing to understand about the current codebase is that these features are not isolated products:

- projects influence chat persistence and workspace tools
- connectors power chat, automations, agents, and prompt enrichment
- personas and enabled skills alter the system prompt used by chat and channel replies
- MCP extends the chat tool surface dynamically
- the browser preview exists largely to support browser MCP actions
- events summarize automation and agent runtime state
- usage tracks both interactive chat and scheduled AI work

That shared architecture is why stale docs become misleading quickly. If you change one subsystem, it often changes the behavior of several others.

# Architecture

Evelina is an Electron desktop app with a thin main-process bootstrap and a single-page renderer shell. The current codebase is not a collection of independent HTML pages anymore; it is one app shell that mounts feature pages into a shared renderer layout while background engines continue running in the main process.

## High-Level Shape

```text
App.js
  -> creates engines
  -> registers IPC
  -> creates BrowserWindow
  -> attaches BrowserPreviewService
  -> starts automation / agents / channels / MCP background work

Public/Setup.html
  -> first-run onboarding only

Public/index.html
  -> main app shell
  -> loads Packages/Renderer/Application/Main.js
  -> mounts page modules into #page-outlet

Data/
  -> all user, runtime, and history persistence
```

## Process Boundaries

### Main process

The main process owns everything that needs Node, Electron, the filesystem, or long-lived background state.

Core responsibilities:

- app lifecycle and window creation
- IPC registration
- persistence to `Data/`
- external connector credentials and token refresh
- scheduled automations
- scheduled AI agents
- channel polling and reply forwarding
- MCP server connections
- embedded browser preview management
- terminal and workspace operations

Key packages:

- `Packages/Main/Core/` for `Paths.js` and `Window.js`
- `Packages/Main/IPC/` for domain-specific IPC files
- `Packages/Main/Services/` for user, chat, project, prompt, browser preview, and window state services
- `Packages/Automation/` for scheduled automation actions
- `Packages/Agents/` for scheduled AI jobs
- `Packages/Channels/` for Telegram / WhatsApp / Discord / Slack polling
- `Packages/Connectors/` for persisted connector state
- `Packages/MCP/` for MCP transports and registry
- `Packages/System/` for system prompt generation

### Renderer process

The renderer owns UI state, page mounting, chat orchestration, tool execution, and the feature modules that call into IPC.

Core responsibilities:

- shared app shell and SPA routing
- page rendering and cleanup
- chat UI and composer
- model selection and user interaction
- tool planning and tool execution orchestration
- browser preview panel layout
- settings, library, and projects modals

Key packages:

- `Packages/Renderer/Application/Main.js` for app bootstrap and navigation
- `Packages/Renderer/Pages/` for mountable page modules
- `Packages/Renderer/Features/` for chat, connectors, channels panel, MCP panel, themes, AI transport, and composer behavior
- `Packages/Renderer/Shared/` for state, DOM refs, modals, navigation, and utilities

### Preload bridge

`Packages/Electron/Bridge/Preload.js` is the only place where renderer code touches `ipcRenderer`. It exposes a curated `window.electronAPI` surface instead of giving the renderer raw Node or Electron access.

Important flags in the window configuration:

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: false`

The renderer therefore cannot read files or spawn processes directly; it must go through IPC.

## Startup Sequence

When Electron becomes ready, `App.js` performs the following:

1. Ensures `Data/`, `Data/Chats/`, and `Data/Projects/` exist.
2. Instantiates:
   - `ConnectorEngine`
   - `AutomationEngine`
   - `AgentsEngine`
   - `ChannelEngine`
3. Registers all IPC modules.
4. Starts the automation, agent, and channel engines.
5. Chooses `Public/Setup.html` or `Public/index.html` based on `User.json`.
6. Creates the frameless `BrowserWindow`.
7. Attaches `BrowserPreviewService` to that window.
8. Hands the window to `ChannelEngine` so incoming channel messages can be routed through the renderer chat pipeline.
9. Starts MCP auto-connect in the background after the window is already visible.

The result is that background scheduling and connector state live independently of whichever renderer page is active.

## Renderer Routing

The current app shell is `Public/index.html`, which contains:

- a title bar
- a persistent sidebar
- a theme panel
- an avatar/settings panel
- a single `#page-outlet` mount point

`Packages/Renderer/Application/Main.js` lazy-loads pages into that outlet. The active page map is currently:

- `chat`
- `automations`
- `agents`
- `events`
- `skills`
- `personas`
- `usage`

`Public/Setup.html` remains a separate onboarding shell. Channels and MCP are configured from the Settings modal, not from the main sidebar.

## Current Data Flow

### Standard chat request

```text
Composer input
  -> attachment parsing / extraction
  -> agent planner (optional tool plan + selected skills)
  -> agent loop
  -> model provider transport
  -> zero or more tool calls
  -> final streamed answer
  -> usage tracking
  -> chat persistence
```

The chat path is renderer-heavy:

- the renderer plans the request
- the renderer executes most tool calls
- IPC is used for filesystem, terminal, Gmail, GitHub, connectors, MCP, and persistence

### Automation run

```text
AutomationEngine tick
  -> shouldRunNow()
  -> runAction(action)
  -> filesystem / shell / connector integrations
  -> history entry persisted to Automations.json
```

### Agent run

```text
AgentsEngine tick
  -> shouldRunNow()
  -> collectData() from connectors / web / local file / system
  -> single-shot AI call with failover
  -> output executor
  -> history entry persisted to Agents.json
  -> usage appended to Usage.json
```

### Channel reply

```text
ChannelEngine poll
  -> incoming message detected
  -> send channel-incoming IPC to renderer
  -> renderer ChannelGateway runs full agentLoop()
  -> renderer replies via channel-reply IPC
  -> ChannelEngine sends message back to Telegram / Twilio / Discord / Slack
```

## Chat Architecture

The renderer chat stack is split across:

- `Features/Composer/` for text, images, and document attachments
- `Features/AI/` for provider transports and streaming/tool-call normalization
- `Features/Chat/Core/Agent.js` for planning, failover, execution loop, and privacy rules
- `Features/Chat/Capabilities/` for tool definitions and executors
- `Features/Chat/UI/` for timeline, bubbles, tool output, and embedded terminal UI

Key current behaviors:

- native tool calling is used across Anthropic, Google, OpenAI-style providers, and connected MCP tools
- enabled skills are loaded before planning and can be emphasized again at runtime for a specific request
- workspace-aware tools are filtered out when no active project/workspace is open
- browser-control MCP tools are treated specially so the chat loop can require confirmation before irreversible actions like checkout or booking submission

## Persistent Data Layout

All mutable app state lives under `Data/`.

```text
Data/
├── User.json
├── Models.json
├── Connectors.json
├── Automations.json
├── Agents.json
├── Channels.json
├── MCPServers.json
├── Skills.json
├── ActivePersona.json
├── Usage.json
├── WindowState.json
├── Memory.md
├── CustomInstructions.md
├── Chats/
└── Projects/
    └── <project-id>/
        ├── Project.json
        └── Chats/
```

What each file does:

- `User.json`: name, setup flag, API keys, provider settings, preferences
- `Models.json`: static provider and model catalog
- `Connectors.json`: Gmail, GitHub, and free API connector state
- `Automations.json`: automation definitions and recent run history
- `Agents.json`: agent definitions, job history, and last-run timestamps
- `Channels.json`: channel credentials, enablement, and polling cursors
- `MCPServers.json`: user-defined MCP server configs
- `Skills.json`: enable/disable map for skill files
- `ActivePersona.json`: the active persona object
- `Usage.json`: usage records capped at 20,000 entries
- `WindowState.json`: window size, position, maximize/fullscreen state
- `Chats/`: global chat transcripts
- `Projects/<id>/Chats/`: project-scoped chat transcripts

`Packages/Main/Core/Paths.js` is the single source of truth for these paths.

## System Prompt Assembly

`Packages/System/Prompting/SystemPrompt.js` builds the full system prompt. It currently includes:

- the default assistant identity or the active persona
- user name
- local time and current date
- country from `ipapi.co` when available
- OS and hardware summary
- connected Gmail / GitHub identities
- up to 20 GitHub repos
- `Memory.md`
- `CustomInstructions.md`
- the full bodies of enabled skills from `Skills/`

`Packages/Main/Services/SystemPromptService.js` caches the built prompt for 5 minutes and invalidates the cache when settings, skills, connectors, or personas change.

## Browser Preview Architecture

The app includes an in-app browser preview driven by `BrowserPreviewService`.

Main-process side:

- owns a `BrowserView`
- normalizes headers and user agent
- tracks page title, URL, load state, and history
- emits preview state updates back to the renderer

Renderer side:

- `Pages/Chat/Features/BrowserPreview.js` reserves layout space
- synchronizes bounds back to the main process
- hides the preview while modal overlays are open

This browser preview is used by the built-in browser MCP server so browser automation can stay visible inside chat.

## Background Engines

### `ConnectorEngine`

Persists and exposes connector state for Gmail, GitHub, and free APIs.

### `AutomationEngine`

Runs non-AI scheduled action chains every 60 seconds and on startup.

### `AgentsEngine`

Runs scheduled AI jobs every 60 seconds and on startup, with per-agent model selection and fallback models.

### `ChannelEngine`

Polls configured channels every 5 seconds and routes replies through the renderer chat pipeline.

### `MCPRegistry`

Manages connected MCP sessions across builtin, stdio, and HTTP transports.

## Shared Renderer State

`Packages/Renderer/Shared/Core/State.js` currently stores a minimal mutable state object rather than a reactive store library.

Current top-level concerns include:

- message list
- current chat id
- composer attachments
- configured providers
- selected provider and model
- active project
- workspace path
- user name
- current system prompt

The app relies on explicit render/update calls and DOM events instead of Redux, Zustand, or a component framework.

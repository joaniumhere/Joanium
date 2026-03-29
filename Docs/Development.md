# Development

This guide documents how the current Evelina codebase is organized and how to extend it without drifting away from the runtime architecture that exists today.

## Local Development

Current package scripts:

```bash
npm start
npm run dev
npm run lint
npm run build
```

What they do:

- `npm start`: launch Electron normally
- `npm run dev`: launch Electron with the `--dev` flag
- `npm run lint`: run ESLint across the repo
- `npm run build`: package the app with `electron-builder`

## Runtime Entry Point

The app boots from:

```text
App.js
```

That file is responsible for:

- creating background engines
- registering IPC handlers
- creating the main window
- attaching the browser preview service
- handing the window reference to the channel engine
- starting MCP auto-connect

If you need to understand why a feature exists at runtime even when its page is closed, `App.js` is the first place to look.

## Package Layout

### `Packages/Main/`

Main-process services, IPC handlers, paths, and Electron integration.

Use this area for:

- filesystem access
- Electron APIs
- persistence
- OS integration
- browser preview service
- chat persistence
- project persistence

### `Packages/Renderer/`

The SPA shell and browser-side app logic.

Use this area for:

- page rendering
- shared UI state
- settings panels
- chat orchestration
- feature-specific UI modules

### `Packages/Automation/`

The deterministic scheduler and action executors.

### `Packages/Agents/`

The scheduled AI job system.

### `Packages/Channels/`

External message polling and reply routing.

### `Packages/Connectors/`

Connector state management for Gmail, GitHub, and free APIs.

### `Packages/MCP/`

MCP client, registry, and built-in browser server support.

### `Packages/System/`

System prompt assembly and app property helpers.

## HTML Shells

The current app has two shells:

- `Public/Setup.html` for first-run onboarding
- `Public/index.html` for the main app

Do not design new primary product features as isolated full HTML pages unless there is a strong reason. The normal pattern now is:

- add or update a renderer page module
- mount it inside the SPA shell

## Adding A New Sidebar Page

To add a new main page:

1. create a page module under `Packages/Renderer/Pages/<Feature>/`
2. expose the page in the renderer routing/bootstrap logic
3. add or update sidebar navigation
4. wire whatever IPC or state dependencies the page needs
5. document the new page in `Docs/README.md` and the relevant subsystem docs

Current canonical pages are:

- chat
- automations
- agents
- events
- skills
- personas
- usage

## Adding A Settings Panel

Settings-driven features such as Connectors, Channels, and MCP follow a different pattern from sidebar pages.

Typical flow:

1. create a feature panel module under `Packages/Renderer/Features/`
2. load it from the Settings modal tab switcher
3. expose necessary IPC methods through preload
4. persist the backing state in a main-process service or engine

This is the right pattern when the feature is configuration-heavy but not a primary navigation destination.

## Adding New IPC

A full IPC addition usually requires four edits:

1. add the handler in `Packages/Main/IPC/<Domain>.js`
2. expose a matching preload method
3. call that method from renderer code
4. implement or reuse the service/engine logic behind it

Keep the boundary clean:

- renderer handles UI and orchestration
- main process handles Node/Electron/OS concerns

## Adding Chat Capabilities

Interactive tool support flows through the chat capability system in the renderer.

When adding a new chat capability, expect to touch:

- the capability/tool registry
- tool definition metadata
- the executor implementation
- any IPC or connector dependencies
- possibly model/tool normalization logic if the tool shape is unusual

Questions to ask before adding a new capability:

- should this be a built-in tool or an MCP tool
- does it need connector credentials
- does it require workspace scope
- should it be available when no project is active
- does it have side effects that need confirmation or risk assessment

## Adding A Connector

For a new service or free data connector, update:

- the connector engine default state
- any validation/save/remove logic
- the relevant settings UI
- tool/automation/agent integrations that consume it
- docs

If the integration is an AI provider instead, update:

- `Data/Models.json`
- provider settings logic in `UserService`
- any provider-specific transport code in the renderer or agent engine

Do not mix those two systems conceptually. Provider config and connector config live in different places.

## Adding An Automation Action

To add a new automation action end-to-end:

1. implement the action in the automation engine/action layer
2. surface editable config in the automations UI
3. update the action renderer/editor
4. document the new action in `Docs/Automations.md`

Remember the current execution rule:

- a thrown error stops the remaining action chain

So new actions should fail clearly and intentionally.

## Adding An Agent Source Or Output

To add a new agent data source:

1. implement it in the `collectOneSource()` switch
2. expose it in the renderer constants and config UI
3. add guidance/templates if needed
4. document it in `Docs/Agents.md`

To add a new output type:

1. implement it in the output execution switch
2. expose it in the output-type UI/constants
3. document required fields and behavior

Keep UI constants and engine support synchronized. The current repo already has a few source labels ahead of engine implementation, and that mismatch is exactly the sort of drift to avoid.

## Adding Or Changing Channel Support

Channels involve both main and renderer work.

Main-process responsibilities:

- polling external services
- storing credentials/cursors
- sending and receiving IPC bridge messages

Renderer responsibilities:

- settings UI
- channel gateway reply generation
- interaction with model selection and prompt state

When changing channels, verify:

- saved config fields still match the engine
- validation paths are wired through IPC where intended
- per-channel settings are not accidentally documented as global if they are not persisted

## Adding MCP Functionality

Use built-in MCP when:

- the tool is deeply tied to app internals, such as the browser preview

Use custom MCP server support when:

- you want runtime-extensible external tool capability

When extending MCP support, consider:

- server persistence
- connection lifecycle
- tool registry merging
- settings UI
- chat-side handling for risky or confirmation-worthy actions

## Prompt-Related Development

Prompt behavior is assembled from multiple sources:

- base assistant identity
- active persona
- enabled skills
- user name
- memory
- custom instructions
- system context and connector-derived context

If you change any of those sources, remember that `SystemPromptService` caches the built prompt. Prompt-affecting changes should invalidate cache at the right time.

## Data And Persistence Guidelines

The app is local-first. Most important state lives in `Data/`.

Before adding new persistent state:

- decide whether it belongs in a new file or an existing domain file
- centralize the path in `Packages/Main/Core/Paths.js`
- make sure read/write behavior is resilient to missing or corrupt files
- keep derived fields out of persisted source data when possible

Examples already following this pattern:

- project `folderExists` is derived, not persisted
- running jobs are transient, not persisted
- browser preview state is live state, not general app config

## Testing And Verification

The current repo does not expose a large automated test suite from `package.json`.

The main built-in verification step is:

```bash
npm run lint
```

For behavior-heavy changes, manual verification is still important. Typical checks include:

- app launch and first-run routing
- sidebar page mounting
- settings panel loading
- chat tool execution
- project-scoped chat save/load
- automation save/toggle/run behavior
- agent run-now behavior
- channel configuration and polling
- MCP tool visibility and browser preview sync

## Documentation Discipline

This codebase changes quickly across several shared subsystems. To keep docs accurate:

- update subsystem docs when a feature's runtime behavior changes
- note intentional UI/runtime mismatches explicitly
- avoid copying older architecture descriptions forward
- prefer documenting persisted state and engine behavior over visual assumptions

The highest-value docs in this repo are the ones that explain shared behavior boundaries clearly, because one subsystem change often affects several others.

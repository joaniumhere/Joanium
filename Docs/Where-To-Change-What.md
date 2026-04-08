# 📍 Where To Change What

The practical maintenance guide. You already know what you want to change — this tells you the right file to start with.

## 1. ⚡ App Boot, Windowing, and Process Wiring

| What you want to change | File to edit |
|---|---|
| Startup flow, first-run behavior, runtime directory creation, MCP auto-connect | `App.js` |
| Boot-time discovery, engine instantiation, lifecycle execution, IPC assembly | `Packages/Main/Boot.js` |
| Path resolution, state root behavior, bundled resource paths | `Packages/Main/Core/Paths.js` |
| BrowserWindow config, preload path, window chrome | `Packages/Main/Core/Window.js` |
| What the renderer can access from preload | `Core/Electron/Bridge/Preload.js` |

## 2. 🗂️ Sidebar, Routing, and Page Discovery

| What you want to change | File to edit |
|---|---|
| App-wide navigation and page mounting | `Packages/Renderer/Application/Main.js` |
| How built-in pages and feature pages are merged | `Packages/Renderer/Application/PagesManifest.js` |
| Page discovery rules | `Packages/Main/Core/PageDiscovery.js` |
| Sidebar layout and navigation rendering | `Packages/Pages/Shared/Navigation/Sidebar.js` |
| A specific page's position, icon, or label | That page's `Page.js` under `Packages/Pages/<Page>/` |

## 3. ⚙️ Setup and Provider Configuration

| What you want to change | File to edit |
|---|---|
| First-run setup UI | `Packages/Pages/Setup` |
| Provider labels, colors, icons, and fields | `Packages/Pages/Setup/UI/Render/Providers/SetupProviders.js` |
| Bundled provider/model catalogs | `Config/Models/index.json` + matching `Config/Models/<Provider>.json` |
| Provider request formatting, streaming, retries, tool-call translation | `Packages/Features/AI/index.js` |
| User profile persistence or first-run checks | `Packages/Main/Services/UserService.js` + `Packages/Main/IPC/UserIPC.js` |

## 4. 💬 Chat Experience

| What you want to change | File to edit |
|---|---|
| Chat page mounting, welcome state, project bar, top-level interactions | `Packages/Pages/Chat/UI/Render/index.js` |
| Message orchestration, planning, tool-call loops, fallback models, sub-agent flow | `Packages/Pages/Chat/Features/Core/Agent.js` |
| Chat persistence | `Packages/Pages/Chat/Features/Data/ChatPersistence.js` + `ChatService.js` |
| Attachment handling and composer behavior | `Packages/Pages/Chat/Features/Composer` |
| Built-in chat tool definitions and executors | `Packages/Pages/Chat/Features/Capabilities` |
| Model dropdown behavior | `Packages/Pages/Chat/Features/ModelSelector` |
| Chat bubble rendering, timeline, terminal embedding, sub-agent panels | `Packages/Pages/Chat/Features/UI` |

## 5. 🗂️ Workspace and Terminal Tools

| What you want to change | File to edit |
|---|---|
| Workspace inspection, directory tree, file read/write, shell execution, command risk | `Packages/Main/IPC/TerminalIPC.js` |
| Document extraction (PDF, DOCX, XLSX, PPTX) | `Packages/Main/Services/DocumentExtractionService.js` |
| Project open/close and project metadata | `Packages/Main/Services/ProjectService.js` + `ProjectIPC.js` |

> 💡 If a chat tool uses local workspace actions, check **both** `Packages/Pages/Chat/Features/Capabilities/Terminal` and `Packages/Main/IPC/TerminalIPC.js`.

## 6. 🧠 Prompting, Personas, Skills, and Memory

| What you want to change | File to edit |
|---|---|
| Base assistant system instructions | `SystemInstructions/SystemPrompt.json` |
| Runtime prompt assembly | `Packages/System/Prompting/SystemPrompt.js` + `Packages/Main/Services/SystemPromptService.js` |
| Skill library reading, enablement persistence, first-run seeding | `Packages/Main/Services/ContentLibraryService.js` |
| Skills page UI | `Packages/Pages/Skills` |
| Persona activation and persona library parsing | `ContentLibraryService.js` + `Packages/Pages/Personas` |
| Personal memory file initialization | `Packages/Main/Services/MemoryService.js` |
| Custom instruction persistence | `Instructions/CustomInstructions.md` + relevant services and IPC |

## 7. 🤖 Automations

| What you want to change | File to edit |
|---|---|
| Automation engine, scheduling loop, usage tracking, job execution | `Packages/Features/Automation/Core/AutomationEngine.js` |
| Schedule evaluation rules | `Packages/Features/Automation/Scheduling/Scheduling.js` |
| Built-in automation data sources | `Packages/Features/Automation/DataSources` |
| Built-in automation actions | `Packages/Features/Automation/Actions` |
| Automation IPC | `Packages/Features/Automation/IPC/AutomationIPC.js` |
| Automations page UI | `Packages/Pages/Automations` |

> 💡 If an automation uses a connector-specific input or output, also check the relevant capability's `Feature.js`.

## 8. 🕵️ Agents

| What you want to change | File to edit |
|---|---|
| Scheduling, queueing, concurrency, run history, renderer dispatch | `Packages/Features/Agents/Core/AgentsEngine.js` |
| Agent IPC | `Packages/Features/Agents/IPC/AgentsIPC.js` |
| Renderer-side scheduled agent gateway | `Packages/Pages/Agents/Features/Gateway.js` |
| Agents page UI | `Packages/Pages/Agents` |

> 💡 If agent execution results look wrong, check both the engine **and** the shared agent loop in `Agent.js`.

## 9. 📋 Events and Usage

| What you want to change | File to edit |
|---|---|
| Background history UI | `Packages/Pages/Events` |
| Usage analytics UI | `Packages/Pages/Usage` |
| Usage write behavior | `Packages/Main/IPC/UsageIPC.js` + automation engine |

## 10. 🔌 Connectors, MCP, Browser Preview, and Channels

| What you want to change | File to edit |
|---|---|
| Connector credential state, enabled defaults, validation | `Packages/Features/Connectors/Core/ConnectorEngine.js` + `ConnectorIPC.js` |
| MCP session handling, stdio/HTTP behavior | `Packages/Features/MCP/Core/MCPClient.js` + `MCPIPC.js` |
| Builtin browser MCP server | `Packages/Features/MCP/Builtin/BrowserMCPServer.js` |
| Browser preview attachment and state | `Packages/Main/Services/BrowserPreviewService.js` + `Packages/Features/BrowserPreview` |
| Channel polling, reply behavior, messaging platforms | `Packages/Features/Channels/Core/ChannelEngine.js` |
| Renderer-side handling for incoming channel messages | `Packages/Pages/Channels/Features/Gateway.js` |

## 11. 🛍️ Marketplace

| What you want to change | File to edit |
|---|---|
| API fetch behavior, item normalisation, install flow | `Packages/Main/Services/MarketplaceService.js` |
| Marketplace IPC | `Packages/Main/IPC/MarketplaceIPC.js` |
| Marketplace browsing UI | `Packages/Pages/Marketplace` |

> 💡 If marketplace-installed content behaves strangely after install, also check `ContentLibraryService.js`.

## 12. 🔌 Capability Packages and Integrations

| What you want to change | File to edit |
|---|---|
| GitHub integration | `Packages/Capabilities/Github` |
| GitLab integration | `Packages/Capabilities/Gitlab` |
| Google root connector | `Packages/Capabilities/Google/Feature.js` |
| Google service-specific behavior (e.g. Calendar, Gmail) | Relevant folder under `Packages/Capabilities/Google/` |
| Free connector definitions | `Packages/Capabilities/FreeConnectors/Feature.js` |

> 💡 If an integration needs connector UI + prompt context + chat tools + automations, the coordination point is its `Feature.js`.

## 13. 🔍 Feature Registry and Discovery

| What you want to change | File to edit |
|---|---|
| How features are defined | `Packages/Capabilities/Core/defineFeature.js` |
| How features are loaded, sorted, indexed, invoked | `Packages/Capabilities/Core/FeatureRegistry.js` |
| Workspace package scanning and discovery root resolution | `Packages/Main/Core/WorkspacePackages.js` + `DiscoveryManifest.js` |
| Engine discovery rules | `Packages/Main/Core/EngineDiscovery.js` |
| Auto-discovered IPC wiring | `Packages/Main/Core/DiscoverIPC.js` |
| Feature/engine storage creation | `Packages/Features/Core/FeatureStorage.js` |

## 14. 🎨 Styling and Shared UI

| What you want to change | File to edit |
|---|---|
| Shared renderer DOM helpers | `Packages/Pages/Shared/Core/DOM.js` |
| Sidebar and navigation visuals | `Packages/Pages/Shared/Navigation` |
| Modal behavior | `Packages/Modals` |
| Global utility helpers | `Packages/System/Utils` |

## 15. 📦 Packaging, Assets, and Release

| What you want to change | File to edit |
|---|---|
| Packaged file inclusion and extra resources | `electron-builder.json` |
| App icons | `Assets/Logo` |
| Auto-update behavior | `Packages/Main/Services/AutoUpdateService.js` |
| Build-time version stamping | `Scripts/SetVersionByDate.mjs` |
| Workspace package audit output | `Scripts/AuditWorkspacePackages.mjs` |

---

## 🎯 Common Scenarios (Quick Reference)

### "I want to add a new AI provider"
```
Config/Models/index.json
Config/Models/<Provider>.json
Packages/Pages/Setup/.../SetupProviders.js
Packages/Features/AI/index.js
```

### "I want to add a new top-level page"
```
Packages/Pages/<NewPage>/Page.js
Packages/Pages/<NewPage>/UI/Render/index.js
+ optional styles, components, features
```

### "I want to add a new integration (GitHub, Notion, Linear, etc.)"
```
Packages/Capabilities/<Integration>/package.json    ← discovery roots
Packages/Capabilities/<Integration>/**/Feature.js  ← connectors, tools, prompts, automations
+ optional API helpers, IPC, services
```

### "I want to change how the assistant thinks or responds"
```
SystemInstructions/SystemPrompt.json        ← base instructions
Packages/System/Prompting/SystemPrompt.js   ← assembly logic
Packages/Main/Services/SystemPromptService.js
+ personas / custom instructions / feature prompt hooks
```

### "I want to change scheduled execution"
```
Agents:       Packages/Features/Agents/Core/AgentsEngine.js
Automations:  Packages/Features/Automation/Core/AutomationEngine.js
Schedules:    Packages/Features/Automation/Scheduling/Scheduling.js
```

---

## 💡 Rule of Thumb

| Your change feels... | Start in... |
|---|---|
| Integration-specific | `Packages/Capabilities` |
| Long-lived and runtime-oriented | `Packages/Features` |
| UI-first | `Packages/Pages` |
| App-shell-wide | `Packages/Renderer` or `Packages/Main` |
| Prompt/persona/skill-related | The prompt and content library services |

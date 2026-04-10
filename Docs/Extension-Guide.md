# 🔧 Extension Guide

How to add new capabilities to Joanium without fighting the architecture.

## 1. 🧠 The Mental Model

> Joanium is extended through **discovery**, not by editing one giant central file.

In practice, you add one of:

- a workspace package
- a feature manifest
- an engine
- an IPC module
- a service
- a page manifest

The boot layer discovers and assembles them automatically.

## 2. 🔍 Starting Point: `joanium.discovery`

Every extension starts with a workspace package `package.json`. Declare what your package contributes under `joanium.discovery`:

```jsonc
{
  "name": "@joanium/my-package",
  "private": true,
  "type": "module",
  "joanium": {
    "discovery": {
      "features": ["./Core"], // Feature.js — connectors, chat tools, prompt context
      "engines": ["./Core"], // *Engine.js — long-lived background systems
      "ipc": ["./IPC"], // *IPC.js — main-process APIs for the renderer
      "pages": ["."], // Page.js — new sidebar pages
      "services": ["./Services"], // *Service.js — reusable main-process helpers
    },
  },
}
```

Only include the kinds your package actually uses.

## 3. 🧩 Adding a New Feature Package

Use a feature package when you want to contribute **any combination of:**

- service connectors (appear in setup UI)
- free connectors (no auth)
- chat tools (callable mid-conversation)
- automation data sources
- automation outputs
- prompt context sections
- feature pages
- lifecycle hooks
- storage

### Minimal example

```js
// Packages/Capabilities/Acme/Core/Feature.js
import { defineFeature } from '../../Core/defineFeature.js';

export default defineFeature({
  id: 'acme',
  name: 'Acme',

  storage: {
    key: 'Acme',
    featureKey: 'Acme',
    fileName: 'Acme.json',
  },

  renderer: {
    chatTools: [
      {
        name: 'acme_lookup',
        description: 'Search Acme for data',
        parameters: {
          query: { type: 'string', description: 'What to search for', required: true },
        },
      },
    ],
  },

  main: {
    methods: {
      async executeChatTool(ctx, { toolName, params }) {
        if (toolName !== 'acme_lookup') return null;
        return `Acme result for: ${params.query}`;
      },
    },
  },

  prompt: {
    async getContext() {
      return {
        connectedServices: ['Acme'],
        sections: ['Acme is connected. You can use the acme_lookup tool to search it.'],
      };
    },
  },
});
```

### What this gives you

- ✅ A chat tool the assistant can call: `acme_lookup`
- ✅ Prompt context injected into every system prompt: "Acme is connected"
- ✅ A storage file at `Data/Features/Acme/Acme.json`

### Things to keep in mind

- Feature `id` values must be **unique** across the whole app
- Use `dependsOn` if your feature extends another feature family (e.g. a Google sub-service depends on the Google root)
- Storage keys must be unique across both features and engines

## 4. ⚙️ Adding a New Engine

Use an engine when you need **long-lived runtime behavior** — scheduling, polling, background queues, persisted runtime state, or a service that should start with the app.

### Minimal example

```js
// Packages/Features/Acme/Core/AcmeEngine.js
import defineEngine from '../../../System/Contracts/DefineEngine.js';

export const engineMeta = defineEngine({
  id: 'acme-engine',
  provides: 'acmeEngine', // injected into boot context under this key
  needs: ['paths'], // wait for 'paths' before creating this engine

  storage: {
    key: 'Acme',
    featureKey: 'Acme',
    fileName: 'Acme.json',
  },

  create(context) {
    let interval;

    return {
      start() {
        // Start a background polling loop
        interval = setInterval(() => {
          console.log('Acme engine polling...');
        }, 60_000);
      },

      stop() {
        clearInterval(interval);
      },

      getAll() {
        return context.featureStorage.get('Acme')?.load(() => ({ items: [] }));
      },
    };
  },
});
```

### When to use an engine vs a feature

| Use an engine when...                   | Use a feature when...                        |
| --------------------------------------- | -------------------------------------------- |
| You need background timers or polling   | You're contributing chat tools or connectors |
| You need to persist runtime state       | You're adding prompt context                 |
| You need lifecycle (`start`/`stop`)     | You're adding automation building blocks     |
| You're building a platform-level system | You're integrating a third-party service     |

## 5. 🌉 Adding a New IPC Module

Use an IPC module when the renderer needs to call something in the main process.

### Minimal example

```js
// Packages/Features/Acme/IPC/AcmeIPC.js
import { ipcMain } from 'electron';

export const ipcMeta = { needs: ['acmeEngine'] };

export function register(acmeEngine) {
  ipcMain.handle('acme:list', () => acmeEngine.getAll());

  ipcMain.handle('acme:create', (_, data) => acmeEngine.create(data));

  ipcMain.handle('acme:delete', (_, id) => acmeEngine.delete(id));
}
```

### Auto-injection rules

`DiscoverIPC.js` injects dependencies into `register()` based on `ipcMeta.needs`:

- Service names like `'chatService'` → injected from discovered services
- Engine names like `'acmeEngine'` → injected from boot context
- `'paths'` → injected path helpers

## 6. 🛠️ Adding a New Service

Use a service when you want a **reusable main-process helper** that may also be auto-injected into IPC modules.

```js
// Packages/Main/Services/AcmeService.js
export class AcmeService {
  constructor(paths) {
    this.paths = paths;
  }

  async getData() {
    // ... read from disk, call an API, etc.
  }
}
```

Service files ending in `Service.js` are discovered and exposed in camelCase: `AcmeService.js` → `acmeService` in IPC injection context.

## 7. 📄 Adding a New Page

Use a page when the user needs a **dedicated surface in the app shell**.

### Page manifest

```js
// Packages/Pages/Acme/Page.js
import definePage from '../../System/Contracts/DefinePage.js';

export default definePage({
  id: 'acme',
  label: 'Acme',
  icon: 'sparkles', // Lucide icon name
  order: 80, // position in sidebar
  section: 'top', // 'top' or 'bottom'
  moduleUrl: './UI/Render/index.js',
  css: './UI/Styles/AcmePage.css',
});
```

### Typical page folder structure

```text
Packages/Pages/Acme/
  Page.js                  ← manifest
  UI/
    Render/
      index.js             ← page mounting logic
    Styles/
      AcmePage.css
  Components/              ← reusable UI components
  Features/                ← page-specific logic
  State/                   ← local state management
```

### Built-in vs feature-contributed pages

- **Built-in page** (above) — discovered from page roots, always present
- **Feature-contributed page** — returned through the feature boot payload, only present when the feature is loaded

Use a built-in page for core app surfaces. Use a feature-contributed page when it belongs tightly to a specific integration.

## 8. 🔌 Adding a New Integration (Capability Package)

This is the most common extension type. The typical path:

```
1. Create Packages/Capabilities/<Name>/
2. Add package.json with joanium.discovery
3. Write Feature.js with connector, tools, prompt context, automation hooks
4. Optionally add API helpers, IPC, services
```

### A full example: "Notion" integration

```
Packages/Capabilities/Notion/
  package.json             ← declares discovery roots
  Core/
    Feature.js             ← connector, chat tools, prompt context, automation
    NotionAPI.js           ← API wrapper
  IPC/
    NotionIPC.js           ← main-process handlers (if needed)
```

```js
// Feature.js for Notion
export default defineFeature({
  id: 'notion',
  name: 'Notion',

  connectors: [{
    id: 'notion',
    name: 'Notion',
    description: 'Connect your Notion workspace',
    fields: [{ key: 'apiKey', label: 'Integration Token', type: 'password' }],
  }],

  renderer: {
    chatTools: [
      { name: 'notion_search', description: 'Search Notion pages', parameters: { query: { type: 'string' } } },
      { name: 'notion_create_page', description: 'Create a Notion page', parameters: { title: { type: 'string' }, content: { type: 'string' } } },
    ],
  },

  main: {
    methods: {
      async executeChatTool(ctx, { toolName, params }) {
        if (toolName === 'notion_search') return searchNotion(params.query);
        if (toolName === 'notion_create_page') return createPage(params);
        return null;
      },
    },
  },

  prompt: {
    async getContext() {
      return {
        connectedServices: ['Notion'],
        sections: ['Notion is connected. You can search pages and create new ones.'],
      };
    },
  },

  automation: {
    dataSources: [{ id: 'notion_pages', label: 'Notion Pages', ... }],
    outputTypes: [{ id: 'notion_create', label: 'Create Notion Page', ... }],
  },
});
```

## 9. 🤖 Adding a New AI Provider

Provider support touches multiple files:

| File                                         | What to change                           |
| -------------------------------------------- | ---------------------------------------- |
| `Config/Models/index.json`                   | Register the new provider                |
| `Config/Models/<Provider>.json`              | Model catalog for this provider          |
| `Packages/Pages/Setup/.../SetupProviders.js` | Setup UI — label, color, icon, fields    |
| `Packages/Features/AI/index.js`              | Request formatting and streaming adapter |

## 10. 🏗️ Adding Automation Building Blocks

### Built-in automation building blocks

Live under `Packages/Features/Automation/DataSources` and `Packages/Features/Automation/Actions`. Use for generic platform behavior.

### Feature-contributed automation building blocks

Contribute via `Feature.js`:

```js
automation: {
  dataSources: [
    { id: 'my_source', label: 'My Source', collect: async () => ({ data: '...' }) },
  ],
  dataSourceCollectors: [...],
  outputTypes: [
    { id: 'my_output', label: 'My Output' },
  ],
  outputHandlers: [
    { id: 'my_output', handle: async (data) => { /* do something */ } },
  ],
  instructionTemplates: [
    { id: 'my_template', label: 'My Template', template: 'Summarise: {{data}}' },
  ],
},
```

Use capability features for integration-specific behavior (e.g. "post to Notion", "create a GitHub issue").

## 11. ✅ Validation Checklist

After adding a new package or discovery root:

```
□ npm run packages:audit  — confirm discovery hooks are visible
□ Start the app           — confirm no duplicate IDs in boot logs
□ Verify engine/feature   — confirm instantiation succeeds at boot
□ Verify packaged assets  — if your feature needs bundled files, check electron-builder.json
```

> 💡 On Windows PowerShell, use `cmd /c npm run packages:audit` if script execution is restricted.

## 12. 🪤 Common Pitfalls

| Pitfall                                | Fix                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Discovery doesn't fire                 | Check `joanium.discovery` is in `package.json` and the root workspace glob covers your package |
| Duplicate feature/page ID              | Each `id` must be unique across the whole app — search the codebase before picking one         |
| Page doesn't render                    | Verify `moduleUrl` in `Page.js` points to a real file                                          |
| Dev state path ≠ prod state path       | Use `Paths.js` helpers, don't hardcode paths                                                   |
| Integration logic in the renderer      | Move it to a feature or main-process layer                                                     |
| Provider setup works but requests fail | Check `AI/index.js` for the request adapter                                                    |

## 13. 🗺️ Which Extension Point to Use?

| You want to add...                      | Best extension point                                         |
| --------------------------------------- | ------------------------------------------------------------ |
| A new external integration              | `Packages/Capabilities/<Name>`                               |
| A new background runtime system         | `Packages/Features/<Name>/Core/*Engine.js`                   |
| A new main-process API for the renderer | `*IPC.js` in an IPC discovery root                           |
| A reusable main-process helper          | `*Service.js` in a services discovery root                   |
| A new core app surface                  | `Packages/Pages/<Name>`                                      |
| A feature-owned page                    | Feature page contribution through `Feature.js`               |
| A new AI model provider                 | `Config/Models` + setup provider UI + `Packages/Features/AI` |

## 14. 💡 Final Advice

Follow the architecture and Joanium is a pleasant codebase to extend. Fight it and you'll spend your time on wiring instead of building.

The safe pattern:

- 🏠 Keep integration logic inside capability packages
- ⚙️ Keep long-lived runtime behavior inside engines
- 🖼️ Keep renderer pages focused on UI and interaction
- 🔍 Use discovery instead of manual central registration

Unsure where something goes? → [Where-To-Change-What.md](Where-To-Change-What.md) is your guide.

# 📚 Joanium Docs

Welcome to the Joanium documentation. Here's where to start depending on what you're trying to do.

## 🗺️ Recommended Reading Order

If you're new to the codebase, read in this order:

1. **[Architecture.md](Architecture.md)** — understand the mental model and how the app is assembled
2. **[Features.md](Features.md)** — see the full product surface and what's already built
3. **[Data-And-Persistence.md](Data-And-Persistence.md)** — understand where state lives and why
4. **[Extension-Guide.md](Extension-Guide.md)** — learn how to add new features, engines, pages, and services
5. **[Where-To-Change-What.md](Where-To-Change-What.md)** — day-to-day maintenance map
6. **[Development-Workflow.md](Development-Workflow.md)** — scripts, packaging, and contributor workflow

## ⚡ Quick Lookup

| I want to...                        | Read this                                          |
| ----------------------------------- | -------------------------------------------------- |
| Understand how the app boots        | [Architecture.md](Architecture.md)                 |
| See what features already exist     | [Features.md](Features.md)                         |
| Find where user data is stored      | [Data-And-Persistence.md](Data-And-Persistence.md) |
| Add a new integration or feature    | [Extension-Guide.md](Extension-Guide.md)           |
| Change a specific page or subsystem | [Where-To-Change-What.md](Where-To-Change-What.md) |
| Build, audit, or package the app    | [Development-Workflow.md](Development-Workflow.md) |

## 🧠 The Mental Model in 30 Seconds

Think of Joanium as **5 layers stacked on top of each other:**

```
┌─────────────────────────────────────────────┐
│  5. Local data, markdown libraries, prompts  │  ← Skills, Personas, Memories, Config
├─────────────────────────────────────────────┤
│  4. Renderer pages + shared UI               │  ← Chat, Agents, Automations, etc.
├─────────────────────────────────────────────┤
│  3. Long-lived engines + services            │  ← Agents engine, Automation engine, etc.
├─────────────────────────────────────────────┤
│  2. Discovery + composition                  │  ← Feature Registry, Boot.js
├─────────────────────────────────────────────┤
│  1. Electron boot + process plumbing         │  ← App.js, Main process, Preload
└─────────────────────────────────────────────┘
```

Once that clicks, the rest of the repo becomes much easier to navigate.

> 💡 **Key insight:** Joanium is not organised around one monolithic app file. It's **assembled** through workspace package discovery. Add a package → it just shows up at boot.

## 📁 Where the important folders live

```text
Packages/Main/          ← Boot, discovery, services, IPC registration
Packages/Features/      ← Long-lived background runtimes (engines)
Packages/Capabilities/  ← Integration packages (GitHub, Google, etc.)
Packages/Pages/         ← User-facing pages
Packages/Renderer/      ← SPA shell that mounts pages + sidebar
Packages/System/        ← Shared contracts and low-level helpers
```

# 💾 Data and Persistence

Joanium is strongly local-first. This doc explains where state lives, how that changes between dev and packaged builds, and which files matter for backup, migration, and debugging.

## 1. 🏠 State Roots

`Packages/Main/Core/Paths.js` defines two runtime roots.

### Bundled root
Where read-only bundled assets (model catalogs, seeded content) live.
- **In development:** the repo root
- **In packaged builds:** `process.resourcesPath`

### State root
Where mutable runtime state (chats, config, feature state) is stored.
- **In development:** the repo root
- **In packaged builds:** `app.getPath('userData')`

## 2. ⚠️ Why This Matters (Dev Warning)

> In development mode, **the repo itself is the app's state directory.**

That means:
- Local chats, usage records, feature state, and memory files show up in `git status`
- You can accidentally commit personal API keys or chat history
- **Always check before pushing**

In packaged builds, all mutable state moves cleanly outside the installed application into Electron's `userData` folder. Users never have to worry about this.

## 3. 🗺️ Full Storage Map

| Path | What's stored |
|---|---|
| `Config/User.json` | User profile, provider keys, app preferences |
| `Config/WindowState.json` | Window size and position |
| `Config/Models/*.json` | Bundled provider and model catalogs |
| `Data/Chats/*.json` | Global chat history (outside any project) |
| `Data/Projects/<id>/Project.json` | Project metadata and state |
| `Data/Projects/<id>/Chats/*.json` | Project-scoped chat history |
| `Data/Skills.json` | Which skills are enabled/disabled |
| `Data/ActivePersona.json` | Currently active persona |
| `Data/Usage.json` | Token and model usage records |
| `Data/MCPServers.json` | User-configured MCP server definitions |
| `Data/Features/<featureKey>/<file>.json` | Engine/feature-specific state |
| `Instructions/CustomInstructions.md` | Your custom instruction file |
| `Memories/*.md` | Personal memory markdown files |
| `Skills/**/*.md` | Installed skill markdown files |
| `Personas/**/*.md` | Installed persona markdown files |

## 4. 🌱 Seeded Libraries vs User Libraries

Joanium ships with **seed libraries** for skills and personas. On first run, `ContentLibraryService.js` copies them into the user library if it's empty.

```
Seed source (bundled, read-only)  →  User library (editable, yours)
     Skills/                      →       Skills/
     Personas/                    →       Personas/
```

- **In development:** the repo folders ARE the active library roots (seed = user library)
- **In packaged builds:** user copies live separately under the state root

This lets the app ship useful defaults while giving users fully editable local copies.

## 5. 🧠 Personal Memory Files

`Packages/Main/Services/MemoryService.js` manages the `Memories/` folder.

These are **plain markdown files** — not an opaque database. That means:
- ✅ Easy to read and inspect
- ✅ Easy to back up (just copy the folder)
- ✅ Easy to edit manually
- ✅ Easy to version in your own git repo

Treat them as user content, not code assets. Don't commit them.

## 6. 💬 Chat Persistence

`Packages/Main/Services/ChatService.js` handles chat storage.

Two buckets:

| Type | Location | When it's used |
|---|---|---|
| Global chats | `Data/Chats/` | Conversations outside any project |
| Project chats | `Data/Projects/<id>/Chats/` | Conversations inside a project |

Other things that happen during save:
- Internal tool-only messages are stripped (clean history)
- Chats can be flagged for personal memory synchronisation

## 7. 📁 Project Persistence

Each project gets its own folder:

```
Data/Projects/<projectId>/
  Project.json        ← project metadata and state
  Chats/              ← project-specific chat history
    <chatId>.json
```

Clean per-project boundaries, no database server needed.

## 8. ⚙️ Feature and Engine Storage

Feature and engine state lives in `Data/Features/`.

How it works:
1. Engines declare storage in `engineMeta.storage`
2. Features declare storage in `feature.storage`
3. Boot collects all descriptors and creates typed storage handles
4. Each handle persists JSON to `Data/Features/<featureKey>/<fileName>`

### Current examples

```
Data/Features/agenticAgents/AgenticAgents.json
Data/Features/Agents/Agents.json
Data/Features/Automations/Automations.json
Data/Features/Channels/Channels.json
Data/Features/Connectors/Connectors.json
```

> 💡 Feature storage keys are descriptor-driven. Don't assume every folder maps 1:1 to a package name.

## 9. 📊 Usage Data

All usage is written to `Data/Usage.json`.

- Chat usage → written by the chat side after each model call
- Automation usage → written by the automation engine after each run

This powers the Usage page and is a great local debugging source. Can grow large over time — trim it manually if needed.

## 10. 🔌 MCP Server Persistence

Custom MCP server entries live in `Data/MCPServers.json`.

The builtin browser MCP server is merged in at runtime — so the user file represents your *additions*, not the full effective set.

## 11. 📝 Prompt and Instruction Data

Prompt assembly draws from both bundled and user-owned data:

| Source | Type |
|---|---|
| `SystemInstructions/SystemPrompt.json` | Bundled (read-only) |
| `Config/User.json` | User-owned |
| `Instructions/CustomInstructions.md` | User-owned |
| `Data/ActivePersona.json` | Runtime-owned |
| `Memories/*.md` | User-owned |
| `Data/Features/` | Runtime-owned (connector state) |

> 💡 If a prompt-related bug appears, you may need to check more than one of these files.

## 12. 🗃️ Packaged Resources

`electron-builder.json` bundles these for packaged builds:

- `Config/Models/` — provider and model catalogs
- `Config/WindowState.json` — default window dimensions
- `Skills/*.md` — seed skill library
- `Personas/*.md` — seed persona library

Packaged builds always have everything they need to bootstrap libraries and catalogs — even on first install with no internet connection.

## 13. 🗄️ What to Back Up

If you want to preserve your full Joanium setup, copy these:

```
Config/User.json          ← your API keys and profile
Data/                     ← all chats, projects, usage, feature state
Instructions/             ← your custom instructions
Memories/                 ← your personal memory files
Skills/                   ← your installed and custom skills
Personas/                 ← your installed and custom personas
```

> 💡 For a minimal backup (just your content and preferences), those folders are all you need.

## 14. ✏️ Safe Manual Editing

If you need to edit runtime state files directly:

- ✅ Edit the smallest relevant file, not whole folders
- ✅ Keep JSON valid and preserve expected top-level keys
- ⚠️ Be careful with `Data/Usage.json` — it can get large
- ⚠️ Be careful with `Data/Features/*` — engines expect specific shapes
- ⚠️ The app may rewrite some files after the next run

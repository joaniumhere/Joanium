# 🛠️ Development Workflow

Day-to-day contributor workflow — how to install, run, build, and stay sane while working on Joanium.

## 1. ⚡ Install and Run

```bash
# Install dependencies
npm install

# Run normally
npm start

# Run in development mode (--dev flag, extra logging)
npm run dev

# Build packaged artifacts
npm run build

# Lint the repo
npm run lint

# Audit workspace discovery
npm run packages:audit

# On Windows PowerShell (if scripts are blocked)
cmd /c npm run packages:audit
```

## 2. 📋 What Each Script Does

| Script                   | What it does                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `npm start`              | Launches Electron normally                                                              |
| `npm run dev`            | Launches Electron with `--dev` flag (development mode)                                  |
| `npm run lint`           | Runs ESLint across the whole repo                                                       |
| `npm run build`          | Date-stamps the version, then runs `electron-builder`                                   |
| `npm run packages:audit` | Prints discovery and workspace relationship info — very useful after structural changes |
| `npm run version:date`   | Updates the app version using the date-based versioning script                          |

## 3. 🔄 Recommended Contributor Flow

```
1. Read the relevant doc in Docs/ before making a broad architectural change
2. Run the app and reproduce the current behavior first
3. Identify which package your change belongs in:
     Main          → boot, services, IPC
     Features      → engines, platform systems
     Capabilities  → integrations
     Pages         → UI surfaces
     Renderer      → shell and navigation
4. Make the smallest coherent change that fits the architecture
5. Run `npm run packages:audit` if you touched workspace structure
6. Run `npm run lint` if you touched JS files
7. Manually verify the affected flow in the running Electron app
```

## 4. 🔍 Workspace and Discovery Hygiene

Joanium uses npm workspaces and discovery metadata heavily. If you add a package or move files:

- ✅ Make sure the package is covered by the root workspace glob patterns
- ✅ Make sure its `package.json` has the correct `joanium.discovery` entries
- ✅ Make sure discovered files follow naming conventions:
  - Features → `Feature.js`
  - Engines → `*Engine.js`
  - IPC modules → `*IPC.js`
  - Pages → `Page.js`
  - Services → `*Service.js`

The packages audit script is your friend after structural changes.

## 5. ⚠️ Development State Warning

Because dev mode writes state into the repo root, these things can appear in `git status`:

```
Data/Chats/           ← your local chat history
Data/Features/        ← connector state, engine state
Data/Usage.json       ← token usage
Config/WindowState.json ← window position
Config/User.json      ← your API keys ⚠️
```

**Before committing:** `git diff --staged` and make sure none of that is staged.

A `.gitignore` entry for `Data/`, `Memories/`, and `Config/User.json` is strongly recommended in personal forks.

## 6. 📦 Packaging Notes

`electron-builder.json` controls:

- Which files are packaged
- Bundled extra resources (seed skills, personas, model catalogs)
- Output directory
- Platform targets
- GitHub release publishing

### What it currently builds:

- 🪟 Windows — NSIS installer
- 🍎 macOS — DMG artifact
- 🐧 Linux — AppImage artifact

### What gets bundled:

- Seed `Skills/*.md`
- Seed `Personas/*.md`
- `Config/Models/` catalogs
- `Config/WindowState.json` defaults

## 7. 🔢 Versioning

Joanium uses a **date-based versioning** helper via `Scripts/SetVersionByDate.mjs`.

`npm run build` automatically updates the version as part of the build process — no manual version bumping needed.

## 8. 🐛 Useful Files for Debugging

| What's broken                        | Where to look                                   |
| ------------------------------------ | ----------------------------------------------- |
| App won't start / crashes on launch  | `App.js`                                        |
| Feature/engine not loading           | `Packages/Main/Boot.js`                         |
| Renderer can't call main process     | `Core/Electron/Bridge/Preload.js`               |
| Pages not mounting or sidebar broken | `Packages/Renderer/Application/Main.js`         |
| Chat behavior or tool calling        | `Packages/Pages/Chat/Features/Core/Agent.js`    |
| Local file/shell tools broken        | `Packages/Main/IPC/TerminalIPC.js`              |
| Feature not contributing to chat     | `Packages/Capabilities/Core/FeatureRegistry.js` |
| Feature state not persisting         | `Packages/Features/Core/FeatureStorage.js`      |

## 9. ✅ When to Run Which Check

| When you...                             | Run                      |
| --------------------------------------- | ------------------------ |
| Add or move workspace packages          | `npm run packages:audit` |
| Change discovery roots                  | `npm run packages:audit` |
| Add a new engine, page, feature, or IPC | `npm run packages:audit` |
| Change any `.js` module                 | `npm run lint`           |
| Change renderer behavior                | Manual app verification  |
| Change provider setup                   | Manual app verification  |
| Change automations or agents            | Manual app verification  |
| Change discovery and feature boot       | Manual app verification  |
| Change persistence or prompt assembly   | Manual app verification  |

## 10. 🌟 Good Habits for This Repo

- **Follow the discovery architecture** rather than adding one-off central wiring
- **Keep integration logic** close to its capability package
- **Keep UI concerns** in pages and renderer code, not in services
- **Be cautious with broad changes** in chat orchestration — they ripple into chat, agents, channels, and tool execution simultaneously
- **Treat `Data/`, `Memories/`, `Skills/`, `Personas/`** as mixed code-and-runtime territory in dev mode

## 11. 📖 Companion Docs

Use these together for a full picture:

| Doc                                                | Use it for                                |
| -------------------------------------------------- | ----------------------------------------- |
| [Architecture.md](Architecture.md)                 | Mental model + boot flow + runtime layers |
| [Features.md](Features.md)                         | What's already built                      |
| [Data-And-Persistence.md](Data-And-Persistence.md) | Storage layout + backup                   |
| [Extension-Guide.md](Extension-Guide.md)           | Adding new things                         |
| [Where-To-Change-What.md](Where-To-Change-What.md) | Finding the right file                    |

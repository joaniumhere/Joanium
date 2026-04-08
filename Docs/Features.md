# 🧩 Joanium Features

A tour of everything already built into Joanium — the product surfaces, the background systems, the integrations, and how they all compose together.

## 1. 🖥️ Product Surfaces

Joanium ships multiple user-facing surfaces that together form a full desktop AI workspace:

| Surface | Location | What users get |
|---|---|---|
| 💬 **Chat** | `Packages/Pages/Chat` | The primary AI workspace — tool use, attachments, project context, model switching |
| ⚙️ **Setup** | `Packages/Pages/Setup` | First-run onboarding, profile capture, and provider configuration |
| 🤖 **Automations** | `Packages/Pages/Automations` | Scheduled jobs that gather data, run AI, and trigger outputs |
| 🕵️ **Agents** | `Packages/Pages/Agents` | Reusable autonomous prompts with schedules and workspace context |
| 🧠 **Skills** | `Packages/Pages/Skills` | Skill library management — enable, disable, bulk controls |
| 🎭 **Personas** | `Packages/Pages/Personas` | Persona activation and chat-start flows |
| 🛍️ **Marketplace** | `Packages/Pages/Marketplace` | Browse and install remote skills and personas |
| 📋 **Events** | `Packages/Pages/Events` | Background run history including failures |
| 📊 **Usage** | `Packages/Pages/Usage` | Local token and model usage analytics |

## 2. 💬 Chat Is the Product Center

The chat page is Joanium's primary surface — but it's also an **orchestration layer** reused by automations, agents, and channels.

### What chat already supports

- ✅ Model and provider selection (switch mid-conversation)
- ✅ Workspace-aware prompting (loads your active project automatically)
- ✅ Active project context (files, directory tree, project metadata)
- ✅ Text and file attachments
- ✅ Document extraction for office and code formats
- ✅ Browser preview integration
- ✅ Planner-driven tool selection (pre-plans tool calls before model runs)
- ✅ Iterative tool calling (multi-step tool loops)
- ✅ MCP tool usage
- ✅ Feature-contributed chat tools (e.g. GitHub tools from the GitHub capability)
- ✅ Sub-agent orchestration support
- ✅ Failover model selection
- ✅ Chat persistence
- ✅ Personal memory sync markers

### Key code areas
```
Packages/Pages/Chat/UI/Render           ← Page mounting + top-level interactions
Packages/Pages/Chat/Features/Core       ← Orchestration loop (Agent.js)
Packages/Pages/Chat/Features/Composer   ← Attachment and composer logic
Packages/Pages/Chat/Features/ModelSelector
Packages/Pages/Chat/Features/Capabilities ← Built-in chat tools
Packages/Features/AI                    ← Provider adapters
```

## 3. ⏰ Background Work: Automations and Agents

Joanium has two distinct but related background systems.

### 🤖 Automations

Automations are **job-like workflows** — they run on a schedule, collect data, call AI, and trigger outputs.

**Built-in data sources:**

| Source | Example use |
|---|---|
| RSS feed | "New article published on my favourite blog" |
| Reddit | "Hot posts in r/programming this morning" |
| Hacker News | "Top stories right now" |
| Weather | "Current conditions in my city" |
| Crypto price | "BTC price crossed $X" |
| URL fetch | "Scrape this page for changes" |
| File read | "Read my notes file before running" |
| System stats | "CPU/memory usage right now" |
| Custom context | "Use this text as input" |

**Built-in outputs:**

| Output | Example use |
|---|---|
| Desktop notification | "Notify me when done" |
| File creation | "Save the AI summary to a markdown file" |
| File move | "Move processed files to archive/" |
| Run command/script | "Run a post-processing script" |
| HTTP request / webhook | "POST the result to my API" |
| Clipboard | "Copy the output to clipboard" |
| Open app or URL | "Open the result in the browser" |

Capability packages can contribute **additional** data sources and output handlers on top of these.

### 🕵️ Agents

Agents are **scheduled prompts** — simpler than automations, but powerful for repeat tasks.

Each agent has:
- A name and description
- A prompt
- An enabled/disabled toggle
- A primary model
- A schedule (cron-style)
- Optional workspace/project context binding
- Full run history

**Good uses for agents:**
- Daily code review of recent commits
- Morning Slack message with open PR summary
- Weekly changelog monitoring
- Nightly dependency vulnerability check

## 4. 🔌 Connectors and Integrations

Joanium cleanly separates **platform behavior** from **integration behavior**.

### Platform-level systems (always running)

| System | Location | What it does |
|---|---|---|
| Connector engine | `Packages/Features/Connectors` | Manages connector state and credentials |
| MCP engine | `Packages/Features/MCP` | Manages MCP sessions (builtin, stdio, HTTP) |
| Channel engine | `Packages/Features/Channels` | Polls channels, routes replies |
| Browser preview | `Packages/Features/BrowserPreview` | In-app browser events and state |

### Capability packages (integration contributors)

| Package | What it adds |
|---|---|
| `Packages/Capabilities/FreeConnectors` | Lightweight data/utility integrations |
| `Packages/Capabilities/Github` | Full GitHub integration |
| `Packages/Capabilities/Gitlab` | Full GitLab integration |
| `Packages/Capabilities/Google` | Google Workspace family |

## 5. 🆓 Free Connectors

These need no auth and are available out of the box:

`Weather & geolocation` · `Finance & exchange rates` · `NASA` · `FRED` · `CoinGecko` · `Wikipedia` · `Countries` · `Jokes` · `Quotes` · `Fun facts` · `Hacker News` · `Unsplash`

## 6. 🐙 GitHub & GitLab

Both packages contribute:

- 🔑 Connector definition (setup + auth)
- 🛠️ Chat tools (e.g. "list open PRs", "create an issue", "review this file")
- 💬 Prompt context (active repos, recent activity injected into every message)
- 📊 Automation data sources (new issues, PR events, pipeline status)
- 📤 Automation outputs (create PRs, post comments, trigger workflows)

GitHub also contributes code review behavior through feature outputs.

## 7. 🌐 Google Workspace Family

The Google capability is a **feature family** — a shared root connector that sub-capabilities extend with service-specific behavior.

Each of these is its own sub-capability package under `Packages/Capabilities/Google/`:

| Service | What the assistant can do |
|---|---|
| 📅 Calendar | Read/create events, check availability |
| 👤 Contacts | Look up contact details |
| 📝 Docs | Read and edit documents |
| 📁 Drive | Search, upload, read files |
| 📋 Forms | Read responses |
| 📧 Gmail | Read, send, search emails |
| 🖼️ Photos | Browse albums |
| 📊 Sheets | Read and update spreadsheet data |
| 🖥️ Slides | Read presentations |
| ✅ Tasks | Manage task lists |
| 📺 YouTube | Search videos, read channel data |

This is the feature registry pattern in action — a shared connector extended incrementally by multiple related capability modules.

## 8. 🤖 MCP and Browser

MCP (Model Context Protocol) is a major differentiator. Joanium supports:

- **Builtin MCP sessions** — browser tooling, local workspace tools
- **stdio MCP sessions** — local CLI-based MCP servers
- **HTTP MCP sessions** — remote MCP servers
- **Persisted custom server config** — add your own MCP servers in settings
- **Builtin browser MCP server** — browser preview integration as a tool

The assistant's tool surface becomes a hybrid of: local workspace tools + feature-defined tools + MCP tools + browser tools.

## 9. 📡 Channel Support

The channels engine polls messaging platforms and routes conversations through the same core orchestration as regular chat.

Supported channels: **Telegram · WhatsApp · Discord · Slack**

Flow: message received → forwarded to renderer orchestration → AI responds → sent back through the channel. Same agent loop. Same tools available.

## 10. 🧠 Skills, Personas & Marketplace

### Skills

Skills are markdown files with YAML frontmatter and instructions. They teach the assistant domain-specific behaviors — think of them as reusable prompt modules.

```markdown
---
name: Code Reviewer
description: Reviews code for bugs, style, and security
triggers: [review, check, audit]
---

When reviewing code, always check for:
1. Security vulnerabilities (SQL injection, XSS, etc.)
2. Error handling completeness
...
```

Users can: browse · enable · disable · enable all · disable all

### Personas

Personas are markdown files that reshape the assistant's personality and communication style. Drop in "senior engineer" and it gets terse and precise. Drop in "product manager" and it starts thinking in user stories.

Users can: browse · activate · deactivate · start a fresh chat in-persona

### Marketplace

The marketplace fetches remote skills and personas from the Joanium marketplace API. Users can inspect details and install with one click. It's the same local markdown system under the hood — marketplace items just get copied into your local library.

## 11. 📊 Usage & Observability

Joanium tracks what's happening — locally, privately.

- **Usage analytics** — token counts and costs by provider and model
- **Events page** — unified history of all background agent and automation runs (including failures)
- **Per-agent history** — individual run logs for every scheduled agent
- **Per-automation history** — individual run logs for every automation

Most agent products go dark once background execution starts. Joanium keeps it visible.

## 12. 🔀 How Features Compose Across Surfaces

One of Joanium's strongest ideas: **one package, multiple surfaces**.

A single capability package can simultaneously add:

```
My new "Linear" capability package contributes →

  ✅ Connector in setup UI         (users connect their Linear account)
  ✅ Prompt context in chat        ("You have 5 open Linear issues")
  ✅ Chat tools                    ("create issue", "list sprints")
  ✅ Automation data source        (poll new issues as trigger)
  ✅ Automation output handler     (create issues from automations)
  ✅ Feature page in the sidebar   (a dedicated Linear page)
```

This is much more powerful than "plugin adds one button." The feature registry makes it possible.

# IPC Reference

This document lists the current main-process IPC surface registered from `Packages/Main/IPC/`. It reflects the handlers present in this repository today.

## IPC Architecture

The current app uses Electron IPC as the bridge between:

- renderer-only UI and orchestration code
- main-process services, engines, filesystem access, and Electron APIs

The renderer should not call `ipcRenderer` directly. It goes through the preload bridge and the exported `window.electronAPI` methods.

## Handler Style

Two patterns are used:

- `ipcMain.handle(...)` for request/response operations
- `ipcMain.on(...)` for fire-and-forget window actions

Most of the app uses `handle`.

## Main IPC Domains

### Setup IPC

Registered handlers:

- `save-user`
- `save-api-keys`
- `save-provider-configs`
- `launch-main`
- `launch-skills`
- `launch-personas`

Purpose:

- first-run setup flow
- initial persistence of user profile and provider configuration
- moving from setup shell into the main app or library views

### User IPC

Registered handlers:

- `get-user`
- `get-models`
- `get-api-key`
- `save-user-profile`
- `get-custom-instructions`
- `save-custom-instructions`
- `get-memory`
- `save-memory`

Purpose:

- read and write user profile data
- read the static model catalog
- manage long-lived text files like `CustomInstructions.md` and `Memory.md`

Important current detail:

- custom instructions and memory are stored as local text files under `Data/`

### System IPC

Registered handlers:

- `get-system-prompt`

Purpose:

- retrieve the fully assembled current system prompt

This is useful for debugging prompt assembly or verifying the effects of personas, skills, memory, and connector state.

### Chat IPC

Registered handlers:

- `save-chat`
- `get-chats`
- `load-chat`
- `delete-chat`

Purpose:

- persist global or project-scoped chats
- list saved chats
- reload a transcript
- delete a chat file

Important current behavior:

- project scope is resolved from provided project metadata and changes the target directory on disk

### Project IPC

Registered handlers:

- `get-projects`
- `get-project`
- `create-project`
- `update-project`
- `delete-project`
- `validate-project`

Purpose:

- project CRUD
- workspace path validation
- loading recent project list for the UI

### Automation IPC

Registered handlers:

- `launch-automations`
- `get-automations`
- `save-automation`
- `delete-automation`
- `toggle-automation`

Purpose:

- open the automations experience
- read persisted automation definitions
- save, delete, or enable/disable automations

### Agents IPC

Registered handlers:

- `launch-agents`
- `launch-events`
- `get-agents`
- `get-running-jobs`
- `clear-events-history`
- `save-agent`
- `delete-agent`
- `toggle-agent`
- `run-agent-now`

Purpose:

- manage agents and jobs
- show currently running jobs
- manually trigger agent execution
- clear aggregated event history

Important current detail:

- `clear-events-history` also clears automation history, not just agents

### Connector IPC

Registered handlers:

- `get-connectors`
- `save-connector`
- `remove-connector`
- `validate-connector`
- `get-free-connector-config`
- `toggle-free-connector`
- `save-free-connector-key`

Purpose:

- manage Gmail/GitHub service connectors
- manage free connector enablement and keys
- validate credentials before save when supported

### Gmail IPC

Registered handlers:

- `gmail-oauth-start`
- `gmail-get-brief`
- `gmail-get-unread`
- `gmail-search`
- `gmail-inbox-stats`
- `gmail-send`
- `gmail-reply`
- `gmail-forward`
- `gmail-create-draft`
- `gmail-mark-all-read`
- `gmail-archive-read`
- `gmail-trash-by-query`
- `gmail-mark-as-read`
- `gmail-mark-as-unread`
- `gmail-archive-message`
- `gmail-trash-message`
- `gmail-list-labels`
- `gmail-create-label`
- `gmail-get-label-id`
- `gmail-modify-message`

Purpose:

- launch OAuth
- perform mailbox queries
- send or draft mail
- mutate message state and labels

### GitHub IPC

Registered handlers cover repo, issue, PR, review, notification, workflow, and gist operations.

Current handler groups include operations for:

- listing repos
- fetching repo file contents
- fetching repo trees
- reading issues
- reading pull requests
- reading notifications
- searching code
- reading commits
- reading releases
- reading branches
- starring or unstarring repos
- repo stats
- PR creation/merge/close
- issue creation/close/reopen/comment
- label and assignee mutation
- PR diff/details/checks/comments
- PR reviews
- workflow trigger and workflow-run inspection
- gist creation
- marking notifications read

Purpose:

- power chat tools
- support automations
- support agent outputs like PR review comments

Representative handler names in the current file include:

- `github-get-repos`
- `github-get-file`
- `github-get-tree`
- `github-get-issues`
- `github-get-prs`
- `github-get-notifications`
- `github-search-code`
- `github-get-commits`
- `github-get-pr-diff`
- `github-create-pr-review`
- `github-get-pr-details`
- `github-get-pr-checks`
- `github-get-pr-comments`
- `github-get-workflow-runs`
- `github-get-repo-stats`
- `github-create-issue`
- `github-close-issue`
- `github-reopen-issue`
- `github-comment-issue`
- `github-add-labels`
- `github-add-assignees`
- `github-create-pr`
- `github-merge-pr`
- `github-close-pr`
- `github-star-repo`
- `github-unstar-repo`
- `github-get-releases`
- `github-get-latest-release`
- `github-trigger-workflow`
- `github-get-latest-workflow-run`
- `github-create-gist`
- `github-get-branches`
- `github-mark-notifs-read`

### Skills IPC

Registered handlers:

- `get-skills`
- `toggle-skill`
- `enable-all-skills`
- `disable-all-skills`

Purpose:

- enumerate installed skill files
- manage the enablement map in `Data/Skills.json`

### Personas IPC

Registered handlers:

- `get-personas`
- `get-active-persona`
- `set-active-persona`
- `reset-active-persona`

Purpose:

- enumerate persona files
- manage the active persona selection

### Usage IPC

Registered handlers:

- `launch-usage`
- `track-usage`
- `get-usage`
- `clear-usage`

Purpose:

- open the usage page
- read aggregated token/cost records
- append manual usage entries when needed
- clear history

### Channels IPC

Registered handlers:

- `get-channels`
- `get-channel-config`
- `save-channel`
- `remove-channel`
- `toggle-channel`
- `validate-channel`
- `channel-reply`

Purpose:

- manage external channel credentials and enabled state
- provide safe partial config back to the UI
- return renderer-generated replies to the channel engine

Important current detail:

- `validate-channel` currently exposes Telegram and WhatsApp validation paths, but not Discord or Slack

### MCP IPC

Registered handlers:

- `mcp-list-servers`
- `mcp-save-server`
- `mcp-remove-server`
- `mcp-connect-server`
- `mcp-disconnect-server`
- `mcp-get-tools`
- `mcp-call-tool`

Purpose:

- manage MCP server definitions
- establish live MCP connections
- surface tool metadata
- execute MCP tools

### Browser Preview IPC

Registered handlers:

- `browser-preview-get-state`
- `browser-preview-set-visible`
- `browser-preview-set-bounds`

Purpose:

- synchronize the renderer-side preview layout with the main-process `BrowserView`

### Terminal IPC

Registered handlers:

- `find-file-by-name`
- `select-directory`
- `pty-spawn`
- `pty-write`
- `pty-resize`
- `pty-kill`
- `assess-command-risk`
- `run-shell-command`
- `read-local-file`
- `extract-document-text`
- `read-file-chunk`
- `read-multiple-local-files`
- `list-directory`
- `list-directory-tree`
- `search-workspace`
- `write-ai-file`
- `apply-file-patch`
- `replace-lines-in-file`
- `insert-into-file`
- `create-directory`
- `copy-item`
- `move-item`
- `inspect-workspace`
- `git-status`
- `git-diff`
- `git-create-branch`
- `run-project-checks`
- `open-folder-os`
- `open-terminal-os`
- `delete-item`

Purpose:

- PTY-backed terminal sessions
- direct shell execution
- file reads/writes
- directory inspection
- git helpers
- workspace inspection and file mutation

Important current detail:

- this IPC surface is the backbone for workspace-aware chat tooling

### Window IPC

These are registered with `ipcMain.on(...)` rather than `handle(...)`:

- `window-minimize`
- `window-maximize`
- `window-close`

Purpose:

- frameless custom titlebar controls

## Event-Like Renderer Messages

Some messages are not classic renderer-invoked request/response APIs. One key example is the channel handoff:

- main process sends `channel-incoming` to the renderer
- renderer later responds through the `channel-reply` handler

This is effectively part of the IPC contract even though one side begins with `webContents.send(...)`.

## Persistence Mapping

Many IPC handlers are thin wrappers over files under `Data/`.

Common mappings:

- chats -> `Data/Chats/` or `Data/Projects/<id>/Chats/`
- projects -> `Data/Projects/`
- automations -> `Data/Automations.json`
- agents -> `Data/Agents.json`
- channels -> `Data/Channels.json`
- skills enablement -> `Data/Skills.json`
- active persona -> `Data/ActivePersona.json`
- usage -> `Data/Usage.json`
- user/profile/instructions/memory -> `Data/User.json`, `CustomInstructions.md`, `Memory.md`

## Practical Guidance For Extending IPC

When adding a new capability, keep the boundary clean:

- renderer concerns stay in the renderer
- filesystem, Electron, OS, and background runtime concerns stay in the main process
- preload exports only the specific methods the renderer needs

Usually an end-to-end IPC feature requires updates in three places:

1. the main IPC registration file
2. the preload bridge
3. the renderer caller

And often a fourth:

4. a service or engine implementation in the main process

## Common Documentation Mistakes To Avoid

- Do not describe the app as if only chat/setup IPC exist; the current surface is much broader.
- Do not omit project, agent, channel, MCP, or browser preview IPC; they are core runtime features now.
- Do not imply the renderer has direct filesystem access; it does not.

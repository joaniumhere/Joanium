# Projects

Projects give Evelina a durable workspace concept. A project is more than a shortcut to a folder: it controls chat scope, workspace-aware tooling, and how the UI remembers context between sessions.

## Why Projects Exist

Without a project, chats are global and the app has no single workspace root to treat as the current codebase or document set.

With a project active, Evelina gains:

- a named workspace rooted at an absolute folder path
- optional project-specific context text
- project-scoped chat persistence
- clearer boundaries for file, search, and terminal tools
- a recent/opened ordering signal through `lastOpenedAt`

## Storage Layout

Projects live under `Data/Projects/`.

Each project gets its own folder:

```text
Data/Projects/<project-id>/
  Project.json
  Chats/
```

`Project.json` stores the project metadata. `Chats/` stores only chats that belong to that project.

Global chats still live under:

```text
Data/Chats/
```

So the app now has two chat scopes:

- global scope
- per-project scope

## `Project.json` Shape

The project metadata written by `ProjectService` contains:

- `id`
- `name`
- `rootPath`
- `context`
- `createdAt`
- `updatedAt`
- `lastOpenedAt`

When a project is read back, the service also adds a derived field:

- `folderExists`

`folderExists` is not the persisted source of truth. It is computed at read time by checking whether `rootPath` still exists and is a directory.

## Project IDs

Project ids are generated from the project name using a slugified form:

- lowercase
- non-alphanumeric runs replaced with `-`
- leading and trailing dashes removed
- truncated to 48 characters

If the slug already exists, a numeric suffix is added:

- `my-app`
- `my-app-2`
- `my-app-3`

That means project ids are stable folder names and are safe to use for storage under `Data/Projects/`.

## Create, Update, Delete

### Create

Creating a project requires:

- `name`
- `rootPath`

`context` is optional.

On creation, Evelina:

- validates that name and folder path are present
- resolves `rootPath` to an absolute path
- allocates a unique id
- creates the project storage folder
- creates the project `Chats/` folder
- sets timestamps
- sets `lastOpenedAt` immediately

### Update

Updating a project preserves the same `id` and refreshes `updatedAt`.

The updated record is normalized again, which means:

- `rootPath` is resolved again to an absolute path
- blank name or root path is rejected

### Delete

Deleting a project removes the entire `Data/Projects/<project-id>/` folder recursively.

Important current behavior:

- only app-managed project storage is deleted
- the actual external workspace folder at `rootPath` is not deleted
- there is an explicit safety check that refuses deletion outside the `Data/Projects/` root

## Active Project Behavior

The renderer keeps the active project in shared state:

- `state.activeProject`
- `state.workspacePath`

When a project is opened:

- the active project record becomes available to the UI
- the workspace path becomes available to chat tooling
- subsequent project chat saves include project metadata

When no project is active:

- workspace-aware tools lose their project context
- chat persistence falls back to the global `Data/Chats/` location

## Project Chat Persistence

`ChatService` resolves the chat directory from the project id.

If a chat has no project id:

- it is saved to `Data/Chats/<chat-id>.json`

If a chat has a project id:

- it is saved to `Data/Projects/<project-id>/Chats/<chat-id>.json`

This is not just a display-level grouping. The file location itself changes.

### Persisted chat metadata

Project-linked chats can include:

- `projectId`
- `projectName`
- `workspacePath`
- `projectContext`

That makes stored chats self-describing even after they are reloaded later.

### Hidden internal messages are removed

Before chat data is written, `ChatService` sanitizes the message list and removes internal tool-execution text patterns. This prevents saved transcripts from being cluttered with assistant-only execution traces.

## Folder Validation And Status

The project system deliberately separates two ideas:

- whether a project record exists
- whether the underlying folder still exists

That is why `folderExists` is derived at read time. A project can still exist in the app even if:

- the directory was renamed outside the app
- the drive is unavailable
- the folder was deleted manually

The docs and UI should treat that as a recoverable state, not silent data loss.

## Ordering And Recency

Project lists are sorted by:

- `lastOpenedAt` if present
- otherwise `updatedAt`

in descending order.

This makes recently used projects float to the top without having to change their names or recreate them.

## Relationship To Workspace Tools

Projects are the cleanest way to enable workspace and terminal features because they provide a stable root path. In practice, that means the chat loop can more safely:

- inspect the workspace
- search the workspace
- read local files
- list directories
- run project checks
- open the folder externally

The project itself does not execute those actions. It supplies the state that makes them meaningful.

## Relationship To System Prompt And Context

Projects do not directly rewrite the global system prompt file, but they do affect the runtime context available during a session:

- active workspace path informs tool usage
- project context can be attached to saved chat data
- project-specific chat history remains isolated from unrelated global chats

This makes projects the app's primary context boundary for coding and workspace-heavy usage.

## Practical Implications

Use a project when:

- you want a dedicated chat history for one repo or folder
- you need workspace tools to operate against a known root
- you want to preserve notes/context for a specific codebase or job

Stay in global chat when:

- the conversation is general
- you are not working inside a folder
- you do not want the transcript tied to a specific workspace

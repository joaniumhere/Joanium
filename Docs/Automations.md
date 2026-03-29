# Automations

Automations are scheduled, deterministic action chains that run in the main process. They are for "do these steps at these times" workflows, not for open-ended AI reasoning.

## What An Automation Is

Each automation record combines:

- metadata such as name, description, and enabled state
- one trigger
- an ordered list of actions
- run history
- `lastRun`

Automations are persisted to `Data/Automations.json` and executed by `Packages/Automation/Core/AutomationEngine.js`.

## Execution Model

The automation engine starts with the app and does two kinds of execution:

- immediate startup runs for automations whose trigger type is `on_startup`
- scheduled checks every 60 seconds for other trigger types

When an automation is due:

1. the engine evaluates `shouldRunNow()`
2. actions run in order
3. the run result is recorded in automation history
4. `lastRun` is updated

## Important Current Semantics

These details matter because they are easy to document incorrectly:

- Actions run sequentially.
- If an action throws, the automation run stops at that action.
- The engine does not continue to later actions after a failure.
- History is capped to the most recent 30 entries per automation.
- `lastRun` is updated after the attempt, even if the run ended in an error.

So an automation is effectively a serial transaction-like chain with best-effort persistence, not an independent fire-and-forget batch of actions.

## Trigger Types

The current scheduler supports these trigger types:

- `on_startup`
- `interval`
- `hourly`
- `daily`
- `weekly`

The shared scheduler implementation is also reused by agents, which keeps the mental model consistent across both systems.

### `on_startup`

Runs once when the engine starts and the automation is enabled.

Use it for:

- opening your work environment
- warming up dashboards
- running local maintenance scripts

### `interval`

Runs every N minutes according to the scheduler config stored on the automation.

Use it for:

- periodic reminders
- simple polling
- repeated cleanup jobs

### `hourly`

Runs on an hourly cadence, typically at a specific minute.

### `daily`

Runs once per day at the configured time.

### `weekly`

Runs on specific weekday/time combinations.

## Storage Shape

The exact JSON can evolve, but an automation record conceptually contains:

```json
{
  "id": "morning-startup",
  "name": "Morning Startup",
  "enabled": true,
  "trigger": {
    "type": "on_startup"
  },
  "actions": [
    { "type": "open_site", "url": "https://mail.google.com" },
    { "type": "open_folder", "path": "D:\\Projects\\OpenWorld" }
  ],
  "lastRun": "2026-03-29T09:00:00.000Z",
  "history": []
}
```

The top-level file stores an array of automation objects.

## Current Action Catalog

The current engine supports three broad action families:

- local/system actions
- Gmail actions
- GitHub actions

### Local and system actions

#### `open_site`

Opens one URL.

Key fields:

- `url`

#### `open_multiple_sites`

Opens several URLs in one action.

Key fields:

- `urls`

#### `open_folder`

Opens a local folder in the OS shell.

Key fields:

- `path`

#### `run_command`

Runs a shell command.

Key fields:

- `command`
- optional shell/runtime flags depending on UI configuration

Use when the action is a one-liner and you do not need a dedicated script file.

#### `run_script`

Runs a local script file.

Key fields:

- `scriptPath`
- optional arguments depending on configuration

#### `open_app`

Launches a local application.

Key fields:

- `app`
- optional arguments

#### `send_notification`

Shows a desktop notification.

Key fields:

- `title`
- `body`
- optional `clickUrl`

#### `copy_to_clipboard`

Copies text to the clipboard.

Key fields:

- `text`

#### `write_file`

Writes text content to a file path.

Key fields:

- `filePath`
- `content`
- optional overwrite/append behavior depending on the UI payload

#### `move_file`

Moves a file or folder.

Key fields:

- `from`
- `to`

#### `copy_file`

Copies a file or folder.

Key fields:

- `from`
- `to`

#### `delete_file`

Deletes a file or folder.

Key fields:

- `path`

Because this is destructive, docs and UI changes around this action should be reviewed carefully.

#### `create_folder`

Creates a directory.

Key fields:

- `path`

#### `lock_screen`

Locks the current machine session.

This action generally needs no additional payload.

#### `http_request`

Makes an HTTP request from the main process.

Key fields:

- `method`
- `url`
- optional `headers`
- optional `body`
- optional `notify`

This is the current generic webhook/integration escape hatch for automation flows.

### Gmail actions

All Gmail actions require the Gmail connector to be configured and enabled.

Current supported Gmail actions:

- `gmail_send_email`
- `gmail_get_brief`
- `gmail_get_unread_count`
- `gmail_search_notify`
- `gmail_reply`
- `gmail_forward`
- `gmail_create_draft`
- `gmail_mark_all_read`
- `gmail_archive_read`
- `gmail_trash_by_query`
- `gmail_inbox_stats`
- `gmail_label_emails`

Typical fields used across these actions include:

- `to`
- `subject`
- `body`
- `query`
- `maxResults`
- `labelName`
- message or thread ids depending on the action

Practical examples:

- send a morning digest email
- archive already-read mail at night
- create a draft from a saved template
- label matched mail after a query

### GitHub actions

All GitHub actions require the GitHub connector to be configured and enabled.

Current supported GitHub actions:

- `github_open_repo`
- `github_check_prs`
- `github_check_issues`
- `github_check_commits`
- `github_check_releases`
- `github_check_notifs`
- `github_create_issue`
- `github_repo_stats`
- `github_star_repo`
- `github_create_pr`
- `github_merge_pr`
- `github_close_issue`
- `github_comment_issue`
- `github_add_labels`
- `github_assign`
- `github_mark_notifs_read`
- `github_trigger_workflow`
- `github_workflow_status`
- `github_create_gist`

Typical fields used across GitHub actions include:

- `owner`
- `repo`
- `title`
- `body`
- `head`
- `base`
- `issueNumber`
- `prNumber`
- `labels`
- `assignees`
- workflow identifiers

Practical examples:

- check whether open PRs need attention
- create a draft PR on a schedule
- mark notifications as read after a reporting pass
- trigger a workflow against a repo

## Run History

Each automation stores a recent history array. The exact UI wording can vary, but history is meant to answer:

- when did this run
- did it succeed or fail
- what summary or error should be shown

History length is capped at 30 entries to keep the JSON bounded.

## Enabling, Disabling, And Editing

The automation IPC layer supports:

- reading all automations
- saving an automation
- deleting an automation
- toggling enabled state

This means the persisted automation object is meant to be edited in place. Histories are preserved across normal edits unless the automation is removed or history is explicitly cleared.

## Relationship To Events

The Events page does not duplicate automation data into a separate store. It reads automation history from the automation engine and combines it with agent history.

Clearing events history therefore clears automation histories at the source.

## Choosing Automations Vs Agents

Choose an automation when:

- the task is deterministic
- you already know the exact steps
- you do not need interpretation or summarization
- you want strong predictability

Choose an agent when:

- you need the app to read data first
- you want the model to decide whether anything is worth acting on
- the output should be generated from interpretation, not a hard-coded action chain

## Extension Notes

To add a new automation action end-to-end, you usually need to update:

- the action executor in the automation engine
- the automation page UI/editor
- the action renderer used to display or edit config fields
- docs in this file and related feature docs

Because the engine halts on the first thrown error, new action implementations should return clear errors and avoid partial ambiguous side effects when possible.

## Common Pitfalls

- Documenting an action as "best effort continue-on-error" is wrong for the current engine.
- Assuming automations use AI is wrong; they do not plan or summarize.
- Treating the Events page as a separate automation store is wrong; it is an aggregated view.
- Forgetting connector prerequisites leads to confusing runtime failures for Gmail and GitHub actions.

# Agents

Agents are scheduled AI workers that gather data, send one synthesized prompt to a model, and then execute an output if the model found something worth acting on.

They are implemented in `Packages/Agents/Core/AgentsEngine.js` and persisted in `Data/Agents.json`.

## Mental Model

An agent is the AI counterpart to an automation:

- automations run a fixed list of actions
- agents collect data, think once, and then emit one output

Each agent can contain multiple jobs. Each job has:

- its own trigger
- its own instruction
- one or more data sources
- one output target
- its own history
- its own `lastRun`

## Runtime Lifecycle

The agents engine starts with the app and behaves similarly to the automation engine:

- startup jobs run immediately if their trigger type is `on_startup`
- scheduled jobs are checked every 60 seconds

When a job runs, the engine:

1. marks the job as currently running
2. collects data from all configured sources
3. builds a focused system prompt and user message
4. calls the configured primary model, then fallbacks if needed
5. interprets `[NOTHING]` as "nothing actionable"
6. executes the configured output only when there is a real response to act on
7. stores history and updates `lastRun`

## Agent-Level Model Selection

Each agent stores:

- `primaryModel`
- `fallbackModels`

The engine resolves those against the provider/model catalog returned by `readModelsWithKeys()`.

Current behavior:

- the primary model is tried first
- configured fallback models are tried in order
- the first successful model response wins
- if every candidate fails, the job records an error

This makes agents more resilient to provider outages than a single fixed model call.

## Prompt Shape

Agent prompts are intentionally simpler than the interactive chat system. The engine constructs:

- a system prompt describing the agent identity and output expectations
- a user message containing collected data plus the job instruction

The current system prompt includes rules such as:

- the model is acting as the named agent
- it should analyze provided data and follow the instruction
- if everything is empty or there is nothing actionable, it must return exactly `[NOTHING]`
- output should be plain text rather than Markdown-heavy formatting

This is a single-shot prompt, not the multi-turn tool-calling loop used by normal chat.

## Trigger Model

Agent jobs use the same trigger family as automations:

- `on_startup`
- `interval`
- `hourly`
- `daily`
- `weekly`

Because the scheduling logic is shared, fixes to trigger semantics affect both systems.

## Data Sources

The current engine supports these actual source types in `collectOneSource()`:

- `gmail_inbox`
- `gmail_search`
- `github_notifications`
- `github_prs`
- `github_issues`
- `github_commits`
- `github_repos`
- `hacker_news`
- `rss_feed`
- `reddit_posts`
- `read_file`
- `system_stats`
- `weather`
- `crypto_price`
- `fetch_url`
- `custom_context`

### Important UI vs engine note

The renderer constants currently expose a few additional source labels such as:

- `gmail_inbox_stats`
- `github_releases`
- `github_workflow_runs`
- `github_repo_stats`

Those labels appear in the UI configuration constants, but they are not currently implemented in the engine's `collectOneSource()` switch. The engine-supported list above is the authoritative runtime list.

## Source Behavior Details

### Gmail sources

`gmail_inbox`

- requires Gmail credentials
- reads unread inbox mail
- can limit result count
- returns an "empty" marker when there is nothing unread

`gmail_search`

- requires Gmail credentials
- requires a query string
- returns matched mail summaries

### GitHub sources

`github_notifications`

- requires GitHub credentials
- returns unread notifications

`github_prs`

- requires `owner` and `repo`
- supports repo PR inspection by state

`github_issues`

- requires `owner` and `repo`
- supports repo issue inspection by state

`github_commits`

- requires `owner` and `repo`
- returns recent commits

`github_repos`

- returns the connected account's repos

### Web and feed sources

`hacker_news`

- fetches current top/new/best/ask story ids
- returns story title and score summaries

`rss_feed`

- fetches an RSS or Atom feed URL
- extracts titles from feed items

`reddit_posts`

- reads subreddit listings from Reddit JSON endpoints

`fetch_url`

- fetches a webpage
- strips scripts/styles and reduces it to text
- truncates long content

### Local/system sources

`read_file`

- reads a local text file
- refuses files over 500 KB
- truncates very long content

`system_stats`

- collects current platform, CPU, memory, and uptime information

`weather`

- geocodes the configured location through Open-Meteo
- returns current conditions

`crypto_price`

- reads price data from CoinGecko

`custom_context`

- uses literal context text provided in the job config

## Output Types

The current engine implements these output types:

- `send_email`
- `send_notification`
- `write_file`
- `append_to_memory`
- `http_webhook`
- `github_pr_review`

### `send_email`

- requires Gmail credentials
- sends the AI response as the email body
- supports templated subject pieces like `{{date}}` and `{{agent}}`

### `send_notification`

- creates a desktop notification
- uses the AI response as the body preview

### `write_file`

- writes the AI response to a file
- can either overwrite or append depending on config
- append mode includes a timestamped header block

### `append_to_memory`

- appends the AI response to `Data/Memory.md`
- invalidates the cached system prompt afterward so future prompts see the new memory

### `http_webhook`

- sends the AI response to a remote URL
- default method is `POST`
- request body includes agent name, job name, timestamp, and result

### `github_pr_review`

- requires GitHub credentials
- requires `owner`, `repo`, and `prNumber`
- posts the AI response as a PR review/comment

## `[NOTHING]` Handling

One of the most important behaviors in the current system is the explicit nothing-to-report path.

If the model returns exactly `[NOTHING]`:

- the job is marked `skipped`
- `nothingToReport` becomes `true`
- no output action runs
- history still records the run

This is how agents avoid generating empty email summaries or meaningless notifications when every source was empty.

## Job History

Each job keeps its own recent history with entries shaped around:

- `timestamp`
- `acted`
- `skipped`
- `nothingToReport`
- `error`
- `skipReason`
- `summary`
- `fullResponse`

Current rules:

- newest history entry is inserted at the front
- history is capped at 30 entries
- `lastRun` is updated on every completed attempt

## Running Jobs View

The engine tracks currently running jobs in memory. The Events page uses this to show active work in progress.

Running entries include:

- `agentId`
- `agentName`
- `jobId`
- `jobName`
- `startedAt`
- `trigger`

This state is transient and is not persisted to disk.

## Usage Tracking

Agent model calls are recorded in `Data/Usage.json`.

Important detail:

- agent records use `chatId: null`

That lets the Usage page show both interactive and scheduled AI usage in one place without pretending every agent run belongs to a chat thread.

## Relationship To Events

The Events page uses agent job history as one of its two main data sources. Clearing Events history clears:

- every agent job history array
- every agent job `lastRun`

This is a persistent reset, not just a UI filter.

## Choosing Good Agent Jobs

Agents work best when:

- the data source is narrow and high-signal
- the instruction tells the model what "actionable" means
- the output type matches the downstream destination
- `[NOTHING]` is genuinely acceptable

Examples that fit well:

- "Review unread GitHub notifications and email me only what needs action."
- "Read this RSS feed each morning and write a short internal summary file."
- "Watch system stats every hour and notify me only if resource usage is concerning."

Examples that fit poorly:

- long multi-step workflows with guaranteed side effects
- tasks that need multiple tool calls during reasoning
- anything better expressed as a fixed command chain

## Common Pitfalls

- Assuming UI-listed data sources are all engine-supported is wrong right now.
- Expecting agent jobs to run the same tool-calling loop as chat is wrong.
- Forgetting fallback models can make jobs brittle when one provider is down.
- Forgetting connector prerequisites produces noisy failures for Gmail and GitHub sources or outputs.

## Extension Notes

To add a new agent capability end-to-end, you typically need to touch:

- the data-source or output switch in `AgentsEngine`
- the renderer constants and forms for agent configuration
- history/event rendering if the new behavior needs special display
- docs in this file

If you add a UI option without adding engine support, the configuration surface will drift out of sync again.

# Connectors

Connectors are the app's integration layer. They provide the external accounts, APIs, and service credentials that power chat tools, automations, agents, and prompt enrichment.

There are two different connector concepts in the current codebase:

- AI providers configured through `User.json` and `Models.json`
- service/data connectors persisted through `Data/Connectors.json`

Both matter, but they solve different problems.

## 1. AI Providers

AI providers define where model completions come from. They are not stored in `Connectors.json`; they are resolved from:

- `Data/Models.json`
- `Data/User.json`

### Current provider ids

- `anthropic`
- `openai`
- `google`
- `openrouter`
- `mistral`
- `nvidia`
- `deepseek`
- `minimax`
- `ollama`
- `lmstudio`

### How provider configuration works

For hosted providers, the current setup is:

- endpoint comes from `Models.json`
- API key comes from `User.json`
- available models come from `Models.json`

For local providers:

- the provider does not require a cloud API key
- the endpoint is normalized to an OpenAI-compatible `/v1/chat/completions` URL
- a concrete `modelId` must be saved in provider settings
- the model catalog is synthesized at runtime from that chosen `modelId`

### Local provider normalization

Current defaults:

- `ollama` defaults to `http://127.0.0.1:11434/v1/chat/completions`
- `lmstudio` defaults to `http://127.0.0.1:1234/v1/chat/completions`

If the saved endpoint ends with:

- `/v1/chat/completions`, it is used directly
- `/v1`, `/chat/completions` is appended
- anything else, `/v1/chat/completions` is appended

### Where providers are used

Provider configuration affects:

- interactive chat
- channel replies
- agent model calls
- model selection UI
- usage accounting labels

## 2. Service And Data Connectors

The connector engine persists integration state in `Data/Connectors.json`.

Current categories:

- service connectors with credentials
- free API/data connectors

The connector engine exposes summary information such as:

- enabled state
- connection timestamp
- whether a connector is free
- whether it needs an API key

## Service Connectors

The current service connectors are:

- `gmail`
- `github`

### Gmail

Gmail is used by:

- chat tools
- automations
- agent data sources
- system prompt enrichment

Current Gmail OAuth scopes include:

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/userinfo.email`

The OAuth callback flow is started from the `gmail-oauth-start` IPC handler.

#### Current Gmail capabilities exposed through IPC/tooling

- get unread brief
- unread count
- search messages
- send email
- reply
- forward
- create draft
- mark all read
- archive read
- trash by query
- mark one message read or unread
- archive one message
- trash one message
- list labels
- create label
- look up a label id
- modify message labels
- compute inbox stats

That means Gmail is no longer just a read-only inbox connector. It now supports substantial mailbox mutation.

### GitHub

GitHub is also used by:

- chat tools
- automations
- agent data sources
- system prompt enrichment

#### Current GitHub capabilities exposed through IPC/tooling

- list repos
- fetch repo files
- fetch repo trees
- get issues
- get pull requests
- get notifications
- search code
- get commits
- get repo stats
- get releases / latest release
- star or unstar repos
- create issues
- close or reopen issues
- comment on issues
- add labels
- assign users
- create PRs
- merge PRs
- close PRs
- get PR diff/details/checks/comments
- create PR reviews
- trigger workflows
- inspect workflow runs
- create gists
- list branches
- mark notifications read

In other words, GitHub is a broad operational connector, not just a repo browser.

## Free Connectors

The connector engine currently initializes these free connectors:

- `open_meteo`
- `coingecko`
- `exchange_rate`
- `treasury`
- `wikipedia`
- `ipgeo`
- `funfacts`
- `jokeapi`
- `quotes`
- `restcountries`
- `hackernews`
- `cleanuri`
- `nasa`
- `fred`
- `openweathermap`
- `unsplash`

### Default enablement

Enabled by default:

- `open_meteo`
- `coingecko`
- `exchange_rate`
- `treasury`
- `wikipedia`
- `ipgeo`
- `funfacts`
- `jokeapi`
- `quotes`
- `restcountries`
- `hackernews`
- `cleanuri`
- `nasa`
- `fred`

Disabled by default until configured:

- `openweathermap`
- `unsplash`

### Free connectors and API keys

Some free connectors truly require no key:

- `open_meteo`
- `coingecko`
- `exchange_rate`
- `treasury`
- `wikipedia`
- `ipgeo`
- `funfacts`
- `jokeapi`
- `quotes`
- `restcountries`
- `hackernews`
- `cleanuri`

Some support or require an API key:

- `nasa`
- `fred`
- `openweathermap`
- `unsplash`

For free connectors with keys:

- the key is stored in the connector credentials object
- saving a non-empty key enables the connector if it is not a no-key connector

## How Connector State Is Stored

The connector engine stores state per connector with concepts like:

- `enabled`
- `isFree`
- `noKey`
- `credentials`
- `connectedAt`

Service connectors keep their credentials inside `credentials`.

Free connectors may also keep an API key in `credentials.apiKey` when needed.

## Where Connector State Is Used

### Chat

Chat capability modules check whether relevant connectors are available before executing Gmail, GitHub, or free-API-backed tools.

### Automations

Automation actions call Gmail and GitHub integrations directly, but rely on connector credentials to do so.

### Agents

Agent data sources and outputs read Gmail or GitHub credentials from the connector engine.

### System prompt

The system prompt builder uses connector state to enrich the assistant context with connected account identity and repository awareness.

## Validation And Editing

The connector IPC surface supports:

- get all connectors
- save connector
- remove connector
- validate connector
- get free connector config
- toggle free connector
- save free connector key

That separation is important:

- service connectors are "connected" and "removed"
- free connectors are mostly toggled and optionally given an API key

## Important Current Caveats

- `local_system` may exist in some older conceptual docs, but it is not a persisted connector in the current connector engine.
- AI providers and service connectors are related from a product perspective, but they are configured and persisted through different subsystems.
- Connector availability affects multiple parts of the app at once, so stale connector docs tend to break chat, automations, and agents mentally at the same time.

## Practical Guidance

Configure at least one AI provider first. After that:

- connect Gmail if you want email workflows or inbox-aware prompts
- connect GitHub if you want repo, PR, notification, or review tooling
- leave no-key free connectors enabled unless you have a reason to reduce surface area
- add `openweathermap` or `unsplash` keys only if you need those specific capabilities

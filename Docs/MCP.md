# MCP

Evelina includes live Model Context Protocol support and merges connected MCP tools into the same tool surface used by chat.

The MCP subsystem lives primarily in:

- `Packages/MCP/Core/MCPClient.js`
- `Packages/Main/IPC/MCPIPC.js`
- the chat capability registry that merges MCP tools with built-in tools

## What The Current MCP Layer Does

The current app supports:

- saving custom MCP server definitions
- connecting and disconnecting servers at runtime
- listing connected tools
- calling MCP tools through IPC
- auto-connecting enabled servers on startup
- shipping a built-in browser MCP server that is always present

## Transport Types

The current MCP layer supports three server types:

- `builtin`
- `stdio`
- `http`

### `builtin`

Used for servers implemented inside the app itself.

The most important builtin server is:

- `builtin_browser`

### `stdio`

Used for local MCP servers launched as child processes.

### `http`

Used for MCP servers reachable over HTTP.

## Built-In Browser Server

The built-in browser server is special enough to understand separately.

### Identity and persistence

- its server id is `builtin_browser`
- it is merged into the server list automatically
- it is not treated like a normal removable user-defined server
- `Data/MCPServers.json` stores only custom servers, not this built-in one

### Why it exists

It gives the assistant browser tools that can act against a visible in-app browser preview rather than a hidden remote tab.

### Typical tool names

The browser server currently exposes tools such as:

- `browser_navigate`
- `browser_snapshot`
- `browser_click`
- `browser_type`
- `browser_screenshot`
- `browser_get_state`
- `browser_back`
- `browser_forward`

The exact set can evolve, but the important point is that the built-in browser server is not a passive metadata source. It is an active browser-control surface.

## Browser Preview Relationship

The browser MCP server is tightly connected to `BrowserPreviewService`.

Main-process responsibilities:

- create and manage a `BrowserView`
- track URL/title/loading state
- handle visibility and bounds updates

Renderer responsibilities:

- reserve layout space for the preview panel
- sync bounds back to the main process
- react to preview state updates

Because of that connection, browser MCP usage is a first-class UI capability, not just a hidden background tool.

## Auto-Connect Behavior

After the window is visible, the app kicks off MCP auto-connect in the background.

This means:

- the main UI can appear without waiting for every MCP connection
- enabled servers become available shortly after startup
- tool availability can expand after initial renderer load

## Tool Surfacing

MCP tools are merged into the same registry used by the chat capability system.

Current behavior:

- built-in chat tools are registered locally
- connected MCP tools are queried from the MCP subsystem
- the combined list is deduplicated by tool name

This means an MCP server can extend what the assistant can do without changing the core chat loop architecture.

## IPC Surface

Current MCP IPC handlers are:

- `mcp-list-servers`
- `mcp-save-server`
- `mcp-remove-server`
- `mcp-connect-server`
- `mcp-disconnect-server`
- `mcp-get-tools`
- `mcp-call-tool`

These handlers are enough to build:

- a settings UI for server management
- a runtime tool picker/registry
- chat-time MCP tool execution

## Resources vs Tools

At the low-level client layer, MCP may support more than just tools, including resources. However, the current app experience is centered around tools.

That means:

- the codebase has lower-level MCP capability concepts
- the primary user-facing integration right now is tool execution
- docs should not oversell resource browsing as a first-class visible product feature unless the UI grows around it

## Server Persistence

Custom server definitions are saved in `Data/MCPServers.json`.

Those definitions typically include:

- id/name
- transport type
- enabled state
- transport-specific launch or connection settings

The exact schema depends on the MCP settings UI and helpers, but the custom file is the authoritative store for user-defined servers.

## Error Handling And Availability

MCP servers are inherently more dynamic than built-in tools. A tool can disappear from the registry if:

- a server is disconnected
- a startup auto-connect fails
- a server process exits
- an HTTP server is unavailable

That is why the tool registry is composed dynamically instead of hard-coding all MCP tool names.

## Relationship To Chat Safety

Browser MCP tools are more operationally sensitive than many read-only tools. The chat layer therefore treats some browser actions with more care, especially when an action looks like it could cause an irreversible real-world side effect.

Examples of operations that deserve special caution:

- checkout flows
- purchases
- submissions
- form confirmations

This safety behavior belongs partly to the chat loop, not just the MCP server itself.

## Practical Guidance

Use MCP when:

- you want to add external tool capabilities without changing built-in chat tool modules
- you want browser interaction inside the app
- you want runtime-extensible tooling

Prefer built-in tools when:

- the capability already exists locally
- the behavior needs tight integration with current app services or persistence
- you need app-specific UX around the feature rather than generic tool invocation

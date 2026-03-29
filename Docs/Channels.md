# Channels

Channels lets you message Evelina from external platforms and receive replies generated through the same chat pipeline used inside the app.

The current supported channel types are:

- Telegram
- WhatsApp
- Discord
- Slack

Channel state is persisted in `Data/Channels.json` and handled by `Packages/Channels/Core/ChannelEngine.js`.

## Architectural Role

The channel system is a gateway, not a separate AI engine.

It does **not** generate replies directly in the main process. Instead it:

1. polls the external service for incoming messages
2. forwards each message to the renderer through `channel-incoming`
3. waits for the renderer to run the full chat loop
4. receives the final text through `channel-reply`
5. sends that text back to the external service

This means channel replies inherit the current chat stack:

- selected provider and model
- current system prompt
- skills and persona effects
- normal tool access
- usage tracking

## Storage Shape

The default persisted state contains one record per platform:

- `telegram`
- `whatsapp`
- `discord`
- `slack`

Current fields vary by channel, but typical stored data includes:

- `enabled`
- credentials such as tokens or SID/auth token pairs
- channel-specific cursors like last seen message ids
- `connectedAt`

### Current platform-specific fields

Telegram:

- `botToken`
- `lastUpdateId`

WhatsApp:

- `accountSid`
- `authToken`
- `fromNumber`

Discord:

- `botToken`
- `channelId`
- `lastMessageId`

Slack:

- `botToken`
- `channelId`
- `lastMessageTs`

The WhatsApp engine also tracks an in-memory `_seenSids` set while polling, but that temporary set is deliberately removed before persistence.

## Polling Model

The channel engine polls every 5 seconds.

Each platform has its own polling implementation:

- Telegram uses `getUpdates`
- WhatsApp uses Twilio message listing
- Discord uses channel message history
- Slack uses conversation history

Messages are processed concurrently per poll cycle once retrieved.

## Reply Timeout

When the engine dispatches a message to the renderer, it waits up to 240 seconds for a reply.

If the renderer does not answer in time:

- the pending request is rejected
- the engine logs a timeout error
- no reply is sent for that incoming message

This timeout matters because channel replies depend on the renderer being healthy and able to complete the full AI loop.

## Typing Indicators

Current behavior by platform:

- Telegram sends typing indicators while waiting for the renderer reply
- Discord sends typing indicators while waiting
- WhatsApp does not implement a typing indicator loop
- Slack does not implement a typing indicator loop

## Platform Details

### Telegram

Required config:

- `botToken`

Validation:

- Telegram credentials are actively validated through `getMe`

Polling behavior:

- only text messages are handled
- `lastUpdateId` advances after messages are seen

Outgoing behavior:

- replies are sent with `sendMessage`

### WhatsApp

WhatsApp support currently uses Twilio rather than direct WhatsApp Cloud API credentials.

Required config:

- `accountSid`
- `authToken`
- `fromNumber`

Validation:

- WhatsApp credentials are actively validated against the Twilio account endpoint

Polling behavior:

- reads recent Twilio inbound messages
- ignores already-seen SIDs
- ignores old inbound messages beyond a short age threshold

Outgoing behavior:

- replies are sent through Twilio `Messages.json`

### Discord

Required config:

- `botToken`
- `channelId`

Validation:

- the engine has a Discord validation method
- the current IPC validation handler does not expose Discord validation through `validate-channel`

In practice, the Settings UI currently saves Discord credentials without a separate validation round-trip.

Polling behavior:

- fetches recent channel messages
- ignores bot-authored messages
- updates `lastMessageId`

Outgoing behavior:

- posts messages to the configured channel

### Slack

Required config:

- `botToken`
- `channelId`

Validation:

- the engine has a Slack validation method
- the current IPC validation handler does not expose Slack validation through `validate-channel`

So, like Discord, Slack is currently saved without a dedicated validation IPC branch in the settings flow.

Polling behavior:

- fetches channel history
- ignores bot/system messages
- updates `lastMessageTs`

Outgoing behavior:

- posts messages through `chat.postMessage`

## Settings UI

The canonical current configuration UI is the Channels panel inside the Settings modal.

That panel supports all four current channel types:

- Telegram
- WhatsApp
- Discord
- Slack

It also supports:

- connect/save
- disconnect/remove
- toggle enabled/disabled after configuration
- prefilled placeholders for already-saved secrets

## Important Current Prompt Behavior

Channel configuration is global with respect to AI behavior.

The channel engine explicitly strips any accidental `systemPrompt` property from saved channel config. That means:

- per-channel prompts are not persisted
- per-channel model selection is not persisted
- channel replies use the current global app state instead

So the effective reply context comes from:

- the renderer's selected provider/model
- the global system prompt state
- the active persona
- enabled skills

If no usable provider/model is configured in renderer state, channel replies cannot be generated meaningfully.

## Safe Config Exposure

The IPC `get-channel-config` handler returns safe partial config for UI prefilling.

Examples:

- whether a bot token is already set
- saved channel id or WhatsApp from-number
- whether the channel is enabled
- `connectedAt`

It intentionally does not dump full secrets back into the renderer for editing.

## IPC Surface

Current channel IPC handlers are:

- `get-channels`
- `get-channel-config`
- `save-channel`
- `remove-channel`
- `toggle-channel`
- `validate-channel`
- `channel-reply`

Important nuance:

- `validate-channel` currently supports Telegram and WhatsApp only at the IPC layer
- Discord and Slack are still handled by direct save flow in the settings panel

## Relationship To Chat And Usage

Channel replies pass through the renderer's full agent loop. That means they share behavior with normal chat such as:

- system prompt application
- tools and connectors
- provider transport logic
- usage tracking

This is one reason channel support feels powerful: external users are not talking to a reduced bot implementation.

## Common Pitfalls

- Treating channels as a separate bot framework is misleading; they are a gateway into the main chat system.
- Assuming per-channel prompts exist is wrong in the current engine.
- Assuming all channel validations are exposed through IPC is wrong right now; only Telegram and WhatsApp are wired there.
- Forgetting that replies depend on renderer availability can make production issues hard to diagnose if you only inspect the main process.

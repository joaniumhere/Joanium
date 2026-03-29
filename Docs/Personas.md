# Personas

Personas let you swap the assistant's identity, voice, worldview, and framing style without changing the rest of the app architecture.

In the current codebase, personas are local Markdown files and exactly one persona can be active at a time.

## Where Personas Live

Persona files live in:

```text
Personas/
```

The active persona is persisted in:

```text
Data/ActivePersona.json
```

## File Format

Personas are Markdown files with YAML frontmatter followed by the persona body.

Typical frontmatter in the repository looks like:

```md
---
name: Altair
personality: cold precision evolving to wisdom
description: Master Assassin of Masyaf
---

You are Altair Ibn-La'Ahad...
```

Common fields include:

- `name`
- `personality`
- `description`

The body that follows is the actual persona prompt text used to shape assistant identity and style.

## Active Persona Model

Only one persona is active at a time.

That makes personas fundamentally different from skills:

- multiple skills can be enabled together
- only one persona can define the assistant identity at once

When a persona is selected, the active persona object is saved into `Data/ActivePersona.json`.

When no persona is active, the app falls back to the default assistant identity.

## Prompt Integration

The active persona is folded into system prompt assembly.

In practice, that means it influences:

- tone
- voice
- framing
- how the assistant approaches questions
- the baseline personality the rest of the prompt builds on top of

Because personas are prompt-level state, they affect:

- chat replies
- channel replies
- any other flow that uses the assembled system prompt

## Missing Persona Recovery

The current code handles missing persona files defensively.

If the app tries to use an active persona whose source file no longer exists:

- the active persona state is cleared

This prevents the system from holding onto a broken persona reference forever.

## Personas Page

The Personas page is the management UI for local persona files.

Its current responsibilities are:

- list available personas
- show their metadata/preview information
- activate a selected persona
- reset back to the default assistant identity

The page controls selection state. The actual behavioral effect happens later during prompt construction.

## Relationship To Skills

Use a persona when you want to change:

- character
- voice
- philosophy
- conversational posture

Use a skill when you want to add:

- domain expertise
- workflow rules
- specialized instructions
- task-specific heuristics

They compose together:

- persona defines the assistant's "who"
- skills define extra "how"

## Operational Consequences

Because the active persona is global prompt state, switching personas affects the entire assistant experience until reset or changed again.

That includes:

- normal chat
- channel responses
- any system-prompt-driven reasoning

So persona selection should be treated as an app-wide mode change, not a per-message style preference.

## Good Persona Design

Strong personas tend to:

- have a clear point of view
- produce a recognizable style shift
- still remain useful for real tasks
- avoid contradicting the core safety or operational expectations of the assistant

Weak personas tend to:

- be only decorative
- repeat generic "helpful assistant" text
- overfit to roleplay without improving actual output quality

## IPC Surface

Current persona IPC handlers are:

- `get-personas`
- `get-active-persona`
- `set-active-persona`
- `reset-active-persona`

These handlers manage discovery and activation. They do not themselves render the final system prompt.

## Practical Workflow

If the assistant's tone feels wrong, check:

1. whether a persona is currently active
2. whether the persona file still exists and is valid
3. whether enabled skills are pulling the style in another direction

Personas are best treated as durable operating modes for the assistant rather than novelty presets.

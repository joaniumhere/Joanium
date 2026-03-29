# Skills

Skills are local Markdown prompt modules that can be turned on or off. When enabled, their full contents are injected into the system prompt builder.

This is the most important fact about the current skill system:

- enabled skills are active prompt content
- disabled skills are ignored

They are not just tags, labels, or examples stored for later manual reading.

## Where Skills Live

Skill files live in:

```text
Skills/
```

Each skill is a Markdown file, typically with YAML frontmatter followed by free-form guidance text.

The enablement state lives separately in:

```text
Data/Skills.json
```

## File Format

The current skill files are plain Markdown with frontmatter like:

```md
---
name: AccessibilityA11y
trigger: accessibility, a11y, WCAG, keyboard navigation
description: Build and audit accessible interfaces.
---

# ROLE
...
```

Common frontmatter fields in the repository today include:

- `name`
- `trigger`
- `description`

After the frontmatter, the remainder of the file is the instruction body that becomes part of the system prompt when enabled.

## Enablement Model

`Data/Skills.json` stores which skills are enabled.

Current behavior:

- skill files can exist without being enabled
- toggling a skill updates the enablement map
- "Enable all" and "Disable all" update the map in bulk
- only enabled skill bodies are loaded into the prompt

This is why docs should not claim that all files in `Skills/` are always active.

## Prompt Integration

The system prompt builder reads skill files from disk and includes the full text of enabled skills.

That means an enabled skill can influence:

- planning behavior
- response structure
- domain-specific advice
- code review emphasis
- writing style in a specialized task

Disabled skills have no prompt-time effect.

## Important Current Details

### Enabled skills are loaded by body, not by metadata only

Older descriptions of the project sometimes framed skills as lightweight descriptors. That is not accurate anymore. The instruction body itself is the feature.

### Skills affect the global system prompt

Because they are injected into prompt assembly, enabled skills affect the assistant globally rather than only one page or one button.

### Prompt changes are cache-sensitive

The built system prompt is cached by `SystemPromptService`, so prompt-affecting changes need cache invalidation to take effect quickly. The current codebase already invalidates prompt cache when appropriate system configuration changes happen.

### `Debug.md` is skipped

The current skills loading logic skips `Debug.md` if it is present. That file should not be documented as a normal user-facing skill.

## Skills Page

The Skills page is the management UI for installed skill files.

Its current responsibilities are:

- list discovered skills
- show their metadata
- toggle an individual skill
- enable all skills
- disable all skills

The page is a management surface only. The actual runtime effect happens later during system prompt construction.

## How Skills Differ From Personas

Skills:

- are additive
- are usually domain- or workflow-specific
- multiple can be enabled at once

Personas:

- define the assistant identity and tone
- only one is active at a time

In practice:

- a persona changes who the assistant is
- a skill changes what extra guidance the assistant has

## Good Skill Design

Skills work best when they are:

- focused on one domain or workflow
- instruction-heavy rather than marketing-heavy
- written as reusable guidance
- specific enough to change behavior in useful ways

Strong examples:

- accessibility review guidance
- API design heuristics
- CI/CD debugging playbooks
- copywriting frameworks

Weak examples:

- vague motivational text
- duplicate generic assistant behavior
- one-off notes that belong in memory instead

## Operational Consequences

Because enabled skill bodies are inserted into the prompt, large or overlapping skills can:

- increase prompt size
- create contradictory guidance
- muddy the assistant's priorities

That does not make the feature bad. It just means skill curation matters.

## IPC Surface

Current skill-related IPC handlers are:

- `get-skills`
- `toggle-skill`
- `enable-all-skills`
- `disable-all-skills`

These handlers manage the library and enablement state. They do not themselves assemble the system prompt.

## Practical Workflow

If a skill exists but the assistant is not behaving as expected, check:

1. whether the skill is enabled in the Skills page
2. whether the prompt cache has been invalidated after relevant changes
3. whether another enabled skill conflicts with it
4. whether the active persona is pushing behavior in a different direction

Skills are powerful precisely because they operate at prompt level, but that also means they should be treated as live behavioral configuration.

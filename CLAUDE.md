# CLAUDE.md

This file is loaded at the start of every Claude session in this repository. It tells Claude what this project is, how to work with it, and what patterns to follow.

## Project purpose

**vibe-coding-engineering** is a structured documentation framework for AI-assisted product development. It's a meta-framework — a set of patterns, schemas, and a Claude skill (`/product-docs`) that keep product documentation in sync, queryable, and discoverable.

This repo is **not** an app. It's the definition of a system. The consumers are other repos (like `studygram-app`) that adopt the framework.

## Core documents

| Document | Purpose | When to update |
|---|---|---|---|
| **VISION.md** | Why the framework exists, north-star direction, success criteria | Rarely — only when the framing changes |
| **ARCHITECTURE.md** | How the framework works — schemas, assembly rules, sync flows | When you add a new doc type or change a schema |
| **ROADMAP.md** | Directional roadmap — quarters, themes, priorities (generated) | Via `/product-docs reconcile` (don't edit directly) |
| **TASKS.md** | WBS of roadmap — tasks, status, owners, dependencies (generated) | Via `/product-docs reconcile` (don't edit directly) |
| **BUGS** | Bug tracker (GitHub Issues — no markdown file) | Create/edit Issues directly |
| **AGENTS.md** | Agent profiles, tool/skill catalogs, context-gating rules | When agent tooling changes |
| **CLAUDE.md** | This file — repo-level instructions for Claude | When the workflow changes |

## Key patterns

### Markdown is source of truth for prose, frontmatter for structure

- Prose sections (VISION, ARCHITECTURE) are edited directly as markdown.
- Structured sections (ROADMAP items, tasks) are **fragment files** with YAML frontmatter (`roadmap/ROADMAP-0042.md`, `tasks/TASK-0142.md`).
- The rendered docs (`ROADMAP.md`, `TASKS.md`) are **generated** from fragments — never edit them directly.

### Frontmatter schema

Roadmap item (`roadmap/ROADMAP-XXXX.md`):
```yaml
---
id: ROADMAP-XXXX
title: Short title
status: proposed | approved | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
quarter: Q1 | Q2 | Q3 | Q4
depends_on:
  - ROADMAP-YYYY
owners:
  - drmoy
related_issues:
  - 42
related_decisions:
  - ARCH-XXXX
last_updated: 2026-08-12
---

Full prose description of the item, including:
- What problem it solves
- What the implementation looks like
- Open decisions or blockers
```

Task (`tasks/TASK-XXXX.md`):
```yaml
---
id: TASK-XXXX
title: Short title
status: pending | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
roadmap_item: ROADMAP-XXXX
assignee: drmoy
depends_on:
  - TASK-YYYY
related_bugs:
  - 123
estimated_hours: 8
last_updated: 2026-08-12
---

Task description, acceptance criteria, implementation notes.
```

### The `/product-docs` skill

When you complete direction-changing work (features, refactorings, decisions), run:

```
/product-docs reconcile
```

This:
1. Validates frontmatter schemas across all fragment files
2. Regenerates `ROADMAP.md` from `roadmap/*.md`
3. Regenerates `TASKS.md` from `tasks/*.md`
4. Syncs GitHub Issues → BUGS view (no file, but the skill can query)
5. Detects orphans (items that reference non-existent dependencies)
6. Commits the changes with a structured message

The skill is the **canonical definition** of the framework. If you want to change how ROADMAP items are structured, you edit the skill — not this file.

### External tool integrations

- **BUGS:** GitHub Issues (`https://github.com/drmoyassine/vibe-coding-engineering/issues`). Labels: `bug`, `feature`, `question`, `platform-health`.
- **ROADMAP proposals:** Fider (self-hosted) OR GitHub Discussions (zero infra). Decision pending.

Automations (GitHub Actions, n8n) watch these tools and push fragments into the repo. The skill then ingests and assembles them.

## How to work with this repo

### Adding a roadmap item

1. Create `roadmap/ROADMAP-XXXX.md` with the frontmatter schema above.
2. Run `/product-docs reconcile` to update `ROADMAP.md`.
3. Commit with a message like: `Add ROADMAP-XXXX: Context-gated tools/skills`.

### Adding a task

1. Create `tasks/TASK-XXXX.md` with the frontmatter schema above.
2. Link it to a roadmap item via `roadmap_item`.
3. Run `/product-docs reconcile` to update `TASKS.md`.
4. Commit with a message like: `Add TASK-XXXX: Implement activeWhen predicate`.

### Reporting a bug

1. Create a GitHub Issue with the `bug` label.
2. The skill surfaces it via BUGS view (no file).
3. If the bug spawns a task, link it via `related_bugs`.

### Changing the framework

1. Edit `ARCHITECTURE.md` to document the change.
2. Edit the `/product-docs` skill to implement it.
3. Run `/product-docs reconcile` to propagate.
4. Commit with a message like: `Update framework: add new frontmatter field for tasks`.

## Non-goals

This framework is **not**:
- A project management tool (no kanban, no burndown)
- A team collaboration platform (no chat, no real-time editing)
- A CI/CD system (no pipelines, no deployments)

It's a **documentation substrate** for AI-assisted engineering. One job: keep canonical product context in sync, queryable, and discoverable.

## When in doubt

Read `VISION.md` first. Then `ARCHITECTURE.md`. If you're still unsure, run:

```
/product-docs reconcile --dry-run
```

...to see what would change without actually changing it.

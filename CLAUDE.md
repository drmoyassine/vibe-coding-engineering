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
| **ROADMAP.md** | Directional roadmap — quarters, themes, priorities | Via `/roadmap reconcile` |
| **TASKS.md** | WBS of roadmap — tasks, status, owners, dependencies | Via `/tasks reconcile` |
| **DECISIONS.md** | Architectural/product/technical decisions | Via `/decisions reconcile` |
| **BUGS** | Bug tracker (GitHub Issues — no markdown file) | Create/edit Issues directly |
| **AGENTS.md** | Agent profiles, tool/skill catalogs, context-gating rules | When agent tooling changes |
| **CLAUDE.md** | This file — repo-level instructions for Claude | When the workflow changes |

## Key patterns

### Markdown is source of truth for prose, frontmatter for structure

- All docs use YAML frontmatter for machine-readable metadata (id, status, links, etc.)
- Prose lives in the markdown body below the frontmatter
- Items live directly in the doc (not separate fragment files) — one ROADMAP.md, one TASKS.md, one DECISIONS.md
- Cross-linking uses GitHub blob URLs: `https://github.com/user/repo/blob/main/FILE.md#ID`

### Frontmatter schemas

**Task (`TASKS.md`):**
```yaml
---
id: TASK-001
title: Short description
description: One-line summary
status: pending | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
roadmap_item: https://github.com/user/repo/blob/main/ROADMAP.md#ROADMAP-001
assignee:
depends_on:
  - https://github.com/user/repo/blob/main/TASKS.md#TASK-000
related_bugs:
  - https://github.com/user/repo/issues/42
related_decisions:
  - https://github.com/user/repo/blob/main/DECISIONS.md#DEC-001
last_updated: 2026-08-12
---

Full prose description, acceptance criteria, implementation notes.
```

**Roadmap item (`ROADMAP.md`):**
```yaml
---
id: ROADMAP-001
title: PowerPoint support
description: Support pptx uploads and text extraction
quarter: Q1
status: Deferred | In Progress | Completed
priority: P1
vision_theme: https://github.com/user/repo/blob/main/VISION.md#document-intelligence
related_tasks:
  - https://github.com/user/repo/blob/main/TASKS.md#TASK-006
related_decisions:
  - https://github.com/user/repo/blob/main/DECISIONS.md#DEC-002
last_updated: 2026-08-12
---

Problem, solution, dependencies.
```

**Decision (`DECISIONS.md`):**
```yaml
---
id: DEC-001
title: Short description
status: accepted | deprecated | superseded
context: What problem led to this decision
decision: What we decided
rationale: Why this option over alternatives
consequences: Impact (positive + negative)
superseded_by: https://github.com/user/repo/blob/main/DECISIONS.md#DEC-002
related_tasks:
  - https://github.com/user/repo/blob/main/TASKS.md#TASK-001
related_roadmap_items:
  - https://github.com/user/repo/blob/main/ROADMAP.md#ROADMAP-001
last_updated: 2026-08-12
---

Full prose expansion.
```

### The four skills

When you complete direction-changing work, invoke the appropriate skill:

- **`/tasks reconcile`** — Validate task schemas, detect orphans, regenerate if needed
- **`/roadmap reconcile`** — Validate roadmap schemas, detect orphans, regenerate if needed
- **`/decisions reconcile`** — Validate decision schemas, detect superseded items, regenerate if needed
- **`/bugs sync`** — Cross-reference GitHub Issues with product_failures table

Skills are the **canonical definition** of the framework. If you want to change how items are structured, you edit the skill — not this file.

### External tool integrations

- **BUGS:** GitHub Issues. Labels: `bug`, `feature`, `question`, `platform-health`.
- **ROADMAP intake:** (Future) Fider (self-hosted) OR GitHub Discussions (zero infra).

Automations (GitHub Actions, n8n) can watch these tools and trigger skills to update docs.

## How to work with this repo

### Adding a roadmap item

1. Edit `ROADMAP.md`, add a new section with frontmatter.
2. Run `/roadmap reconcile` to validate.
3. Commit with message: `Add ROADMAP-001: Context-gated tools/skills`.

### Adding a task

1. Edit `TASKS.md`, add a new section with frontmatter.
2. Link to roadmap item via `roadmap_item` (URL).
3. Run `/tasks reconcile` to validate.
4. Commit with message: `Add TASK-001: Implement activeWhen predicate`.

### Adding a decision

1. Edit `DECISIONS.md`, add a new section with frontmatter.
2. Run `/decisions reconcile` to validate.
3. Commit with message: `Add DEC-001: Use markdown as source of truth`.

### Reporting a bug

1. Create a GitHub Issue with the `bug` label.
2. Run `/bugs sync` to cross-reference with product_failures.
3. If the bug spawns a task, link it via `related_bugs` (URL).

### Changing the framework

1. Edit `ARCHITECTURE.md` to document the change.
2. Update the affected skills to implement new schema/logic.
3. Run reconcile on all affected docs.
4. Commit with message: `Update framework: add new frontmatter field`.

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

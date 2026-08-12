# CLAUDE.md

This file is loaded at the start of every Claude session in this repository. It tells Claude what this project is, how to work with it, and what patterns to follow.

## Project purpose

**vibe-engineering-framework** is a structured documentation framework for AI-assisted product development. It's a meta-framework — a set of patterns, schemas, and a Claude skill suite (the **product-docs skills**: `/tasks`, `/roadmap`, `/bugs`, `/decisions`, `/apply`) that keep product documentation in sync, queryable, and discoverable.

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

## How to use the skills

When working with docs in a repo that adopts this framework, invoke skills directly:

**`/tasks` — Manage TASKS.md**
```
/tasks list                              # Show all tasks
/tasks list status:pending               # Filter by status
/tasks list priority:P1                 # Filter by priority
/tasks add                               # Add a new task
/tasks update TASK-001                   # Update a task
/tasks complete TASK-001                # Mark task complete
/tasks reconcile                        # Validate schemas, detect orphans
```

**`/roadmap` — Manage ROADMAP.md**
```
/roadmap list                           # Show all roadmap items
/roadmap list quarter:Q1                 # Filter by quarter
/roadmap add                             # Add a roadmap item
/roadmap graduate "Q1 — PowerPoint"     # Graduate item → tasks
/roadmap reconcile                       # Validate schemas, detect orphans
```

**`/bugs` — Manage GitHub Issues + product_failures**
```
/bugs list                               # Show all bugs
/bugs list status:open                   # Filter by status
/bugs list label:platform-health         # Filter by label
/bugs create                             # Create a bug report
/bugs resolve 42                         # Resolve a bug
/bugs sync                                # Cross-reference Issues ↔ product_failures
```

**`/decisions` — Manage DECISIONS.md**
```
/decisions list                          # Show all decisions
/decisions list status:accepted          # Filter by status
/decisions add                            # Add a decision
/decisions update DEC-001                # Update a decision
/decisions supersede DEC-001             # Mark as superseded by new decision
/decisions reconcile                      # Validate schemas, detect orphans
```

**When to invoke:**
- After adding/updating items manually in the docs
- Before committing to validate schemas
- When you need to filter/list items

## Key patterns

### Markdown is source of truth for prose, frontmatter for structure

- All docs use YAML frontmatter for machine-readable metadata (id, status, links, etc.)
- Prose lives in the markdown body below the frontmatter
- Items live directly in the doc (not separate fragment files) — one ROADMAP.md, one TASKS.md, one DECISIONS.md
- Cross-linking uses the `id + name + url` pattern: **relative URLs for same-repo** (`/TASKS.md#TASK-001`), **absolute URLs for cross-repo / external** (e.g. GitHub Issues `https://github.com/user/repo/issues/42`)

### Frontmatter schemas

> **OKF v0.2 conformance (DEC-002).** Every item carries the core fields below. The optional OKF fields — `tags`, `resource`, `generated` (by/at), `verified` (by/at) — may appear on any item. The **actor convention** (§7) applies to `generated.by` / `verified.by`: `human:<id>` for people, `<producer>/<version>` for agents/tools, `process:<id>` for automated processes. Unknown keys are preserved (round-trip safe).

**Task (`TASKS.md`):**
```yaml
---
id: TASK-001
title: Short description
description: One-line summary
status: pending | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
roadmap_item:
  id: ROADMAP-001
  name: "PowerPoint support"
  url: /ROADMAP.md#ROADMAP-001
assignee:
depends_on:
  - id: TASK-000
    name: "Prerequisite task"
    url: /TASKS.md#TASK-000
related_bugs:
  - id: 42
    name: "Agent hallucination on tool errors"
    url: https://github.com/user/repo/issues/42
related_decisions:
  - id: DEC-001
    name: "Use markdown as source of truth"
    url: /DECISIONS.md#DEC-001
tags: [agent, rls, permissions]         # OPTIONAL (OKF) — cross-cutting labels
resource: https://github.com/user/repo/blob/main/migrations/001.sql  # OPTIONAL (OKF) — canonical URI to the artifact
generated:                              # OPTIONAL (OKF trust signal)
  by: "human:<id>"                      # actor convention: human:<id> | <producer>/<version> | process:<id>
  at: "2026-08-12T00:00:00Z"
verified:                               # OPTIONAL (OKF trust signal) — repeatable
  - by: "human:<id>"
    at: "2026-08-12T00:00:00Z"
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
vision_theme:
  id: document-intelligence
  name: "Support all document types"
  url: /VISION.md#document-intelligence
related_tasks:
  - id: TASK-006
    name: "Stub: sniff ppt/presentation.xml"
    url: /TASKS.md#TASK-006
related_decisions:
  - id: DEC-002
    name: "Markdown as source of truth"
    url: /DECISIONS.md#DEC-002
tags: [documents, extraction]           # OPTIONAL (OKF)
resource:                               # OPTIONAL (OKF) — canonical URI to the artifact
generated:                              # OPTIONAL (OKF trust signal)
  by: "human:<id>"
  at: "2026-08-12T00:00:00Z"
verified:                               # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-08-12T00:00:00Z"
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
superseded_by:
  id: DEC-002
  name: "Newer decision"
  url: /DECISIONS.md#DEC-002
related_tasks:
  - id: TASK-001
    name: "Implement activeWhen predicate"
    url: /TASKS.md#TASK-001
related_roadmap_items:
  - id: ROADMAP-001
    name: "PowerPoint support"
    url: /ROADMAP.md#ROADMAP-001
tags: [schema, docs]                    # OPTIONAL (OKF)
resource:                               # OPTIONAL (OKF)
generated:                              # OPTIONAL (OKF trust signal)
  by: "human:<id>"
  at: "2026-08-12T00:00:00Z"
verified:                               # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-08-12T00:00:00Z"
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

Read `VISION.md` first. Then `ARCHITECTURE.md`. If you're still unsure, run the relevant reconcile skill to see what would change:

```
/tasks reconcile --dry-run        # validate TASKS.md
/roadmap reconcile --dry-run      # validate ROADMAP.md
/decisions reconcile --dry-run    # validate DECISIONS.md
```

Each reports inconsistencies without changing anything (when `--dry-run` is supported).

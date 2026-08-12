# /tasks

Manage vibe-engineering-framework tasks in TASKS.md.

## Commands

- `list` — Show all tasks, optionally filtered by status/priority/assignee/roadmap_item
- `add` — Add a new task (prompts for required fields)
- `update` — Update an existing task (change status, assignee, priority)
- `complete` — Mark a task as completed
- `reconcile` — Validate TASKS.md schema and regenerate if needed

## Task schema

Every task in TASKS.md must follow this frontmatter schema. All related references use the **`id + name + url`** pattern — relative URLs for same-repo, absolute for cross-repo/external.

```yaml
---
id: TASK-XXX
title: Short description
description: One-line summary
status: pending | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
roadmap_item:                 # SINGULAR object — a task belongs to one roadmap item
  id: ROADMAP-001
  name: "Roadmap item title"
  url: /ROADMAP.md#ROADMAP-001
assignee:                     # name, or empty
depends_on:                   # array of task refs (empty: [])
  - id: TASK-001
    name: "Prerequisite task"
    url: /TASKS.md#TASK-001
related_bugs:                 # array of GitHub Issue refs (id = issue number, int)
  - id: 42
    name: "Bug title"
    url: https://github.com/drmoyassine/vibe-engineering-framework/issues/42
related_decisions:            # array of decision refs (empty: []) — link to DECISIONS, not LOG.md
  - id: DEC-001
    name: "Decision title"
    url: /DECISIONS.md#DEC-001
tags: []                      # OPTIONAL (OKF) — cross-cutting labels
resource:                     # OPTIONAL (OKF) — canonical URI to the artifact
log_ref:                      # OPTIONAL — ref to LOG.md section (narrative history)
  date: 2026-01-01
  section: "### ..."
generated:                    # OPTIONAL (OKF trust signal)
  by: "human:<id>"
  at: "2026-01-01T00:00:00Z"
verified:                     # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-01-01T00:00:00Z"
last_updated: 2026-01-01
---

Full description, acceptance criteria, implementation notes.
```

**Field rules:**
- `roadmap_item` is **singular** (one origin item). Use `roadmap_item:` with no value if unlinked.
- `depends_on`, `related_bugs`, `related_decisions` are **arrays**. Empty array = `[]`.
- `related_bugs.id` is the GitHub Issue **number** (integer, unquoted).
- `related_decisions` links to DECISIONS.md (the canonical decision record), NOT to LOG.md.
- `log_ref` points to LOG.md (narrative history) but is optional.
- Same-repo URLs are **relative** (`/ROADMAP.md#ROADMAP-001`); cross-repo/external are **absolute**.
- **OKF optional fields**: `tags`, `resource`, `log_ref`, `generated` {by, at}, `verified` [{by, at}]. Actor convention: `human:<id>` / `<producer>/<version>` / `process:<id>`. Omit when unused; unknown keys are preserved.

## Cross-linking philosophy

Tasks link to **ROADMAP** (via `roadmap_item`) and **DECISIONS** (via `related_decisions`), NOT to LOG.md. The decision is the canonical record for "what we decided"; LOG.md is the narrative history of "how we got there."

## How to use

### List tasks
```
/tasks list
/tasks list status:pending
/tasks list priority:P1
/tasks list assignee:drmoy
/tasks list roadmap_item:ROADMAP-003
```

### Add a task
```
/tasks add
```
You'll be prompted for:
- id (auto-suggests next number)
- title
- description (one-line summary)
- status (default: pending)
- priority (default: P2)
- roadmap_item (choose a ROADMAP-XXX from ROADMAP.md; recorded as `id + name + url`)
- assignee (optional)
- depends_on (optional, array of TASK-XXX → `id + name + url`)
- related_bugs (optional, array of issue numbers → `id + name + url`)
- related_decisions (optional, array of DEC-XXX → `id + name + url`)

### Update a task
```
/tasks update TASK-001
```
You'll be prompted for fields to update.

### Complete a task
```
/tasks complete TASK-001
```
Sets status to completed, updates last_updated to today.

### Reconcile
```
/tasks reconcile
```
1. Reads TASKS.md
2. Validates every frontmatter block against the schema above
3. Checks all `id + name + url` refs resolve (no orphans), bidirectionally with ROADMAP/DECISIONS
4. Reports inconsistencies; asks before regenerating

## Implementation notes

- Tasks are stored in `TASKS.md` at the repo root, each a markdown section with YAML frontmatter.
- The `id` field is the unique identifier (TASK-XXX format).
- When reconciling, preserve the order: Open tasks → Completed tasks → Deferred items.
- `roadmap_item` ↔ ROADMAP `related_tasks` must be bidirectional.

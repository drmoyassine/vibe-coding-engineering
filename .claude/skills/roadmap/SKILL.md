# /roadmap

Manage vibe-engineering-framework roadmap in ROADMAP.md.

## Commands

- `list` — Show all roadmap items, optionally filtered by quarter/status
- `add` — Add a new roadmap item (Q1/Q2/Q3/Q4, title, description)
- `graduate` — Graduate a roadmap item into one or more tasks
- `reconcile` — Validate ROADMAP.md schema and regenerate if needed

## Roadmap item schema

Every roadmap item in ROADMAP.md must follow this frontmatter schema. All related references use the **`id + name + url`** pattern — relative URLs for same-repo, absolute for cross-repo/external.

```yaml
---
id: ROADMAP-XXX
title: Short description
description: One-line summary
quarter: Q1 | Q2 | Q3 | Q4
status: Deferred | In Progress | Completed | Blocked
priority: P0 | P1 | P2 | P3
vision_theme:                 # SINGULAR object, OPTIONAL (until VISION.md themes exist)
  id: document-intelligence
  name: "Vision theme title"
  url: /VISION.md#document-intelligence
related_tasks:                # array of task refs (empty: [])
  - id: TASK-001
    name: "Task title"
    url: /TASKS.md#TASK-001
related_decisions:            # array of decision refs (empty: []) — link to DECISIONS, not log.md
  - id: DEC-001
    name: "Decision title"
    url: /DECISIONS.md#DEC-001
tags: []                      # OPTIONAL (OKF) — cross-cutting labels
resource:                     # OPTIONAL (OKF) — canonical URI to the artifact
log_ref:                      # OPTIONAL — ref to log.md section (narrative history)
  date: 2026-01-01
  section: "### Q2 planning"
generated:                    # OPTIONAL (OKF trust signal)
  by: "human:<id>"
  at: "2026-01-01T00:00:00Z"
verified:                     # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-01-01T00:00:00Z"
last_updated: 2026-01-01
---

Problem, solution, dependencies, open decisions.
```

**Field rules:**
- `vision_theme` is **singular** and **optional** (until VISION.md themes exist). Links to VISION.md when it exists.
- `related_tasks`, `related_decisions` are **arrays**. Empty array = `[]`.
- `related_decisions` links to DECISIONS.md (the canonical decision record), NOT to log.md.
- `log_ref` points to log.md (narrative history) but is optional.
- Same-repo URLs are **relative** (`/TASKS.md#TASK-001`); cross-repo/external are **absolute**.
- **OKF optional fields**: `tags`, `resource`, `log_ref`, `generated` {by, at}, `verified` [{by, at}]. Actor convention: `human:<id>` / `<producer>/<version>` / `process:<id>`. Omit when unused; unknown keys are preserved.

## Cross-linking philosophy

Roadmap items link to **VISION** (via `vision_theme`) and **DECISIONS** (via `related_decisions`), NOT to log.md. Tasks link back via `roadmap_item`. Vision/roadmap/tasks all link bidirectionally to decisions.

## How to use

### List roadmap items
```
/roadmap list
/roadmap list quarter:Q1
/roadmap list status:Deferred
/roadmap list status:In Progress
```

### Add a roadmap item
```
/roadmap add
```
You'll be prompted for:
- id (auto-suggests next number, ROADMAP-XXX)
- title
- description (one-line summary)
- quarter (Q1/Q2/Q3/Q4)
- status (default: Deferred)
- priority (default: P2)
- problem / solution / dependencies (prose body)
- related_tasks (optional, array of TASK-XXX → `id + name + url`)
- related_decisions (optional, array of DEC-XXX → `id + name + url`)
- vision_theme (optional, omitted until VISION.md themes exist)

### Graduate roadmap item → tasks
```
/roadmap graduate ROADMAP-001
```
You'll be prompted for:
- How many tasks to create
- Task titles (break down the roadmap item into concrete tasks)
- Priority for each task
- Assignee (optional)

This creates TASK-XXX entries in TASKS.md, each with `roadmap_item: { id: ROADMAP-001, name, url }` linking back, and adds the new task ids into this item's `related_tasks` (bidirectional).

### Reconcile
```
/roadmap reconcile
```
1. Reads ROADMAP.md
2. Validates every frontmatter block against the schema above
3. Checks all `id + name + url` refs resolve (no orphans), bidirectionally with TASKS/DECISIONS
4. Reports inconsistencies; asks before regenerating

## Implementation notes

- Roadmap items are stored in `ROADMAP.md` at the repo root, each a markdown section with YAML frontmatter.
- The `id` field is the unique identifier (ROADMAP-XXX format).
- Status is one of: Deferred, In Progress, Completed, Blocked.
- `related_tasks` ↔ TASK `roadmap_item` must be bidirectional.

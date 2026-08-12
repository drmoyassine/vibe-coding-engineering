# /decisions

Manage {{PROJECT_NAME}} architectural, product, and technical decisions in DECISIONS.md.

## Commands

- `list` — Show all decisions, optionally filtered by status/related_item
- `add` — Add a new decision (prompts for required fields)
- `update` — Update an existing decision (change status, add context)
- `supersede` — Mark a decision as superseded by a newer one
- `reconcile` — Validate DECISIONS.md schema and regenerate if needed

## Decision schema

Every decision in DECISIONS.md must follow this frontmatter schema. All related references use the **`id + name + url`** pattern — relative URLs for same-repo, absolute for cross-repo/external.

```yaml
---
id: DEC-XXX
title: Short description
status: accepted | deprecated | superseded
context: What problem or situation led to this decision
decision: What we decided
rationale: Why this option over alternatives
consequences: What this means for the system (positive + negative)
superseded_by:                   # SINGULAR object, only when status = superseded (else omit / empty)
  id: DEC-002
  name: "Newer decision"
  url: /DECISIONS.md#DEC-002
related_vision:                  # OPTIONAL array of vision refs (empty: [])
  - id: document-intelligence
    name: "Vision theme"
    url: /VISION.md#document-intelligence
related_roadmap_items:           # array of roadmap refs (empty: [])
  - id: ROADMAP-001
    name: "Roadmap item"
    url: /ROADMAP.md#ROADMAP-001
related_tasks:                   # array of task refs (empty: [])
  - id: TASK-001
    name: "Task title"
    url: /TASKS.md#TASK-001
related_decisions:              # array of decision refs (empty: [])
  - id: DEC-002
    name: "Related decision"
    url: /DECISIONS.md#DEC-002
tags: []                      # OPTIONAL (OKF) — cross-cutting labels
resource:                     # OPTIONAL (OKF) — canonical URI to the artifact
log_ref:                      # OPTIONAL — ref to LOG.md section (narrative history)
  date: 2026-01-01
  section: "### Decision discussion"
generated:                    # OPTIONAL (OKF trust signal)
  by: "human:<id>"
  at: "2026-01-01T00:00:00Z"
verified:                     # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-01-01T00:00:00Z"
last_updated: 2026-01-01
---

Full prose expansion of the decision, discussion, alternatives considered.
```

**Field rules:**
- `superseded_by` is **singular** (one newer decision). Omit it, or leave empty, unless `status: superseded`.
- `related_vision`, `related_roadmap_items`, `related_tasks`, `related_decisions` are **arrays**. Empty array = `[]`.
- Decisions are **bidirectionally linked** to/from vision/roadmap/tasks (e.g., if a decision results in a task, link both ways).
- `log_ref` points to LOG.md (narrative history) but LOG.md does NOT link back to decisions. The decision is the canonical record.
- Same-repo URLs are **relative** (`/TASKS.md#TASK-001`); cross-repo/external are **absolute**.
- There is no separate `description` field; `context` + `decision` carry the summary.
- **OKF optional fields**: `tags`, `resource`, `log_ref`, `generated` {by, at}, `verified` [{by, at}]. Actor convention: `human:<id>` / `<producer>/<version>` / `process:<id>`. Omit when unused; unknown keys are preserved.

## Cross-linking philosophy

Decisions are the **central ledger** — they link bidirectionally to all vision/roadmap/tasks, and LOG.md links to them (not the reverse). This ensures the decision is the single source of truth for "what we decided."

## How to use

### List decisions
```
/decisions list
/decisions list status:accepted
/decisions list related:TASK-001
```

### Add a decision
```
/decisions add
```
You'll be prompted for:
- id (auto-suggests next number, DEC-XXX)
- title
- status (default: accepted)
- context (the problem situation)
- decision (what was decided)
- rationale (why)
- consequences (impact)
- related_tasks (optional, array of TASK-XXX → `id + name + url`)
- related_roadmap_items (optional, array of ROADMAP-XXX → `id + name + url`)
- related_decisions (optional, array of DEC-XXX → `id + name + url`)

### Update a decision
```
/decisions update DEC-001
```
You'll be prompted for fields to update.

### Supersede a decision
```
/decisions supersede DEC-001
```
Creates a new decision (DEC-XXX), sets this decision's `status: superseded` and `superseded_by: { id, name, url }` pointing at the new one.

### Reconcile
```
/decisions reconcile
```
1. Reads DECISIONS.md
2. Validates every frontmatter block against the schema above
3. Checks all `id + name + url` refs resolve (no orphans), bidirectionally with TASKS/ROADMAP/DECISION (decision↔decision links included)
4. Flags any `status: superseded` decision missing a `superseded_by` (and vice versa)
5. Reports inconsistencies; asks before regenerating

## Implementation notes

- Decisions are stored in `DECISIONS.md` at the repo root, each a markdown section with YAML frontmatter.
- The `id` field is the unique identifier (DEC-XXX format).
- Same-repo refs use **relative** URLs (`/TASKS.md#TASK-001`), not full GitHub blob URLs.
- When superseding, the old decision's `superseded_by` points to the new decision (singular object).

## Legend

| Status | Meaning |
|---|---|
| accepted | Currently in force |
| deprecated | No longer recommended but not reversed |
| superseded | Replaced by a newer decision (link in `superseded_by`) |

# CLAUDE.md

This file is loaded at the start of every Claude session in this repository. It tells Claude what this project is, how to work with it, and what patterns to follow.

## Project purpose

**vibe-engineering-framework** is a structured documentation framework for AI-assisted product development. It's a meta-framework — a set of patterns, schemas, and a Claude skill suite (the **product-docs skills**: `/tasks`, `/roadmap`, `/bugs`, `/decisions`, `/apply`) that keep product documentation in sync, queryable, and discoverable.

This repo is **not** an app. It defines a reusable system adopted by independently governed product repositories.

## Core documents

| Document | Purpose | When to update |
|---|---|---|---|
| **VISION.md** | Why the framework exists, north-star direction, success criteria | Rarely — only when the framing changes |
| **ARCHITECTURE.md** | How the framework works — schemas, assembly rules, sync flows | When you add a new doc type or change a schema |
| **ROADMAP.md** | Directional roadmap — quarters, themes, priorities | Via `/roadmap reconcile` |
| **TASKS.md** | WBS of roadmap — tasks, status, owners, dependencies | Via `/tasks reconcile` |
| **DECISIONS.md** | Architectural/product/technical decisions | Via `/decisions reconcile` |
| **log.md** | Chronological project memory and material learnings | After material work or decisions |
| **index.md** | OKF navigation and project entry point | When canonical documents change |
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

## Deterministic CLI queries

Use the read-only CLI when the answer should come directly from canonical project state rather than agent interpretation:

```bash
vef list tasks --status pending
vef show TASK-009
vef refs TASK-009
vef why TASK-009
vef graph --json
vef search "query interface" --json
```

Text is the default; `--json` emits the versioned automation contract. Use `type:id` selectors only to disambiguate an invalid repository containing the same ID in multiple document types.

For automated structural writes, author proposal data and delegate canonical serialization to the CLI:

```bash
vef create task --from proposed-task.yml                    # preview
vef create task --from proposed-task.yml --write --actor agent/session
vef update TASK-009 --from task-update.yml                  # preview includes inverse links
vef update TASK-009 --from task-update.yml --write --actor agent/session
```

Never let a skill or agent maintain its own frontmatter, inverse-link, ledger, or rollback serializer. The engine owns
IDs when omitted, lifecycle dates, `modified` provenance, typed relationship closure, projection, validation, journal,
and lease. An unresolved transaction requires explicit `vef recover <id> --forward|--rollback` direction. If doctor
reports malformed writer leases, confirm no writer is active and use `vef recover leases`; do not delete lease files
manually.

## Key patterns

### Markdown is source of truth for prose, frontmatter for structure

- All docs use YAML frontmatter for machine-readable metadata (id, status, links, etc.)
- Prose lives in the markdown body below the frontmatter
- Canonical structured items live in `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/`; each directory's `_index.md` owns ledger-level prose.
- `VISION.md`, `ROADMAP.md`, `TASKS.md`, and `DECISIONS.md` are generated committed ledgers. Never edit their generated item blocks directly. Automated adapters use `vef create`/`vef update`; direct human item edits are an escape hatch followed by `vef setup` and `vef check`.
- `.vef/storage.json` versions the storage layout. `vef setup` initializes or upgrades, repairs, projects, validates, and enforces; `vef check` is the strict read-only gate; `vef doctor` explains blockers. Existing adapter files are never overwritten.
- Cross-linking uses the `id + name + url` pattern: **relative URLs for same-repo** (`/TASKS.md#TASK-001`), **absolute URLs for cross-repo / external** (e.g. GitHub Issues `https://github.com/user/repo/issues/42`)

### Frontmatter schemas

> **OKF v0.2 conformance (DEC-002).** Every item carries the core fields below. The optional OKF fields — `tags`, `resource`, `generated` (by/at), transaction-managed `modified` (by/at), and `verified` (by/at) — may appear on any item. The **actor convention** (§7) applies to provenance actors: `human:<id>` for people, `<producer>/<version>` for agents/tools, `process:<id>` for automated processes.

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
modified:                               # transaction-managed actor/time provenance
  by: "agent/session"
  at: "2026-08-14T00:00:00Z"
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
modified:                               # transaction-managed actor/time provenance
  by: "agent/session"
  at: "2026-08-14T00:00:00Z"
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
modified:                               # transaction-managed actor/time provenance
  by: "agent/session"
  at: "2026-08-14T00:00:00Z"
verified:                               # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-08-12T00:00:00Z"
last_updated: 2026-08-12
---

Full prose expansion.
```

### The four skills

When you complete direction-changing work, invoke the appropriate skill:

- **`/tasks reconcile`** — Validate canonical task files, detect orphans, and project the ledger
- **`/roadmap reconcile`** — Validate canonical roadmap files, detect orphans, and project the ledger
- **`/decisions reconcile`** — Validate canonical decision files, detect superseded items, and project the ledger
- **`/bugs sync`** — Cross-reference GitHub Issues with product_failures table

`src/lib/schemas.mjs` is the executable canonical schema and is exported as `vibe-engineering-framework/schema`.
Skills explain and invoke that contract; they must not maintain a competing writer or field definition.

### External tool integrations

- **BUGS:** GitHub Issues. Labels: `bug`, `feature`, `question`, `platform-health`.
- **ROADMAP intake:** (Future) Fider (self-hosted) OR GitHub Discussions (zero infra).

Automations (GitHub Actions, n8n) can watch these tools and trigger skills to update docs.

## How to work with this repo

### Adding a roadmap item

1. Author semantic fields, prose, and relationship target IDs in a proposal.
2. Preview and apply it through `vef create roadmap --from <proposal>` with explicit `--write`.
3. Run `vef check`, review the diff, then commit.

### Adding a task

1. Author a task proposal and the target roadmap ID.
2. Preview/apply with `vef create task`; the core allocates the ID and closes `roadmap_item ↔ related_tasks`.
3. Run `vef check`, review, then commit.

### Adding a decision

1. Author decision context, outcome, rationale, consequences, and relationship IDs.
2. Preview/apply with `vef create decision`; use one batch candidate for supersession.
3. Run `vef check`, review, then commit.

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
- A general CI/CD or application-deployment system (the only managed workflow enforces VEF project memory)

It's a **durable project-memory and integrity layer** for AI-assisted engineering. One job: keep canonical product context coherent, queryable, reviewable, and enforced.

## When in doubt

Read `VISION.md` first. Then `ARCHITECTURE.md`. Use `vef why <id>` or `vef refs <id>` to inspect canonical intent and relationships. If the repository may be inconsistent, run the relevant reconcile skill to see what would change:

```
/tasks reconcile --dry-run        # validate TASKS.md
/roadmap reconcile --dry-run      # validate ROADMAP.md
/decisions reconcile --dry-run    # validate DECISIONS.md
```

Each reports inconsistencies without changing anything (when `--dry-run` is supported).

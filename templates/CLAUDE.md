# CLAUDE.md

Loaded at the start of every Claude session in this repo. This file covers project identity, skills, and the doc framework. For detailed working conventions see `AGENTS.md`.

## What this is

<!-- PROJECT: Replace this section with a 2-3 sentence description of your project. -->
**{{PROJECT_NAME}}** — *Describe your product here.*

## Skills (invoke directly)

| Skill | What it does | When to use |
|---|---|---|
| **`/tasks`** | Manage TASKS.md (list, add, update, complete, reconcile) | After finishing work, when planning, when auditing |
| **`/roadmap`** | Manage ROADMAP.md (list, add, graduate → tasks, reconcile) | When direction changes, when breaking down themes |
| **`/bugs`** | Manage GitHub Issues (list, create, resolve, sync) | When triaging failures, when reporting bugs |
| **`/decisions`** | Manage DECISIONS.md (list, add, update, supersede, reconcile) | When making architectural/product decisions |
| **`/apply`** | Migrate docs into the framework standard (multi-agent: discover → extract → cross-link → validate) | One-shot — adopting the framework, or migrating bare-ID docs to `id+name+url` |

Skills are **manual invoke only**. No auto-trigger.

## Doc framework (single sources of truth)

| Doc | Purpose |
|---|---|
| **VISION.md** | Why we exist, north-star direction, problem/solution framing |
| **ARCHITECTURE.md** | How the system works — data model, key patterns, design decisions |
| **ROADMAP.md** | Directional roadmap — quarters, themes, priorities |
| **TASKS.md** | Work breakdown — tasks with status, owners, dependencies |
| **DECISIONS.md** | Architectural/product/technical decisions with context + rationale |
| **log.md** | Single-source memory — chronological log + session learnings (OKF) |
| **index.md** | Navigation hub / table of contents (OKF) |
| **BUGS** | Bug tracker — **GitHub Issues** (no markdown file — the Issues *are* the source) |

**Before making or reversing an architectural/product decision, check DECISIONS.md** (`/decisions list`) — don't re-litigate settled decisions; record new or reversed ones via `/decisions add` / `supersede`.

All structured items use `id + name + url` cross-linking:
```yaml
related_tasks:
  - id: TASK-002
    name: "Implement activeWhen filter"
    url: /TASKS.md#TASK-002
```

### Cross-linking topology

```
log.md (narrative memory)
    ↓ links to (via log_ref)
DECISIONS.md (central decision ledger)
    ↓ bidirectional links (via related_*)
VISION.md ← ROADMAP.md ← TASKS.md

BUGS (GitHub Issues)
    ↓ links to (via related_tasks)
TASKS.md
```

Tasks/Roadmap/Vision link to **DECISIONS.md**, not to log.md. The decision is the source of truth for *"what we decided"*; the log is the narrative history of *how we got there*.

## Critical constraints

<!-- PROJECT: Add your project-specific constraints here. Things that cause bugs if forgotten — infrastructure gotchas, RLS rules, agent runtime constraints, etc. -->

## Verification surfaces

<!-- PROJECT: Add your project-specific verification surfaces here. Where to check agent failures, MCP tools, permissions, logs, etc. -->

## When in doubt

Read `VISION.md` first. Then check `DECISIONS.md`. If still unsure, run the relevant skill:
```
/tasks list
/decisions list
/roadmap list
```

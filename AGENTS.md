# AGENTS.md

This document defines the agent profiles, tool catalogs, skill catalogs, and context-gating rules for the **vibe-engineering-framework** framework.

## Skills — How to invoke

When working with docs in a repo that adopts this framework, invoke these skills directly:

| Skill | What it does | Invocation examples |
|---|---|---|---|
| **`/tasks`** | Manage canonical task records and project TASKS.md | `/tasks list`<br>`/tasks list status:pending`<br>`/tasks add`<br>`/tasks complete TASK-001`<br>`/tasks reconcile` |
| **`/roadmap`** | Manage canonical roadmap records and project ROADMAP.md | `/roadmap list`<br>`/roadmap list quarter:Q1`<br>`/roadmap add`<br>`/roadmap graduate "Q1 — PowerPoint"`<br>`/roadmap reconcile` |
| **`/bugs`** | Manage canonical external bug references through GitHub Issues | `/bugs list`<br>`/bugs list status:open`<br>`/bugs create`<br>`/bugs resolve 42` |
| **`/decisions`** | Manage canonical decision records and project DECISIONS.md | `/decisions list`<br>`/decisions list status:accepted`<br>`/decisions add`<br>`/decisions supersede DEC-001`<br>`/decisions reconcile` |

**Skills are manual invoke only** — type `/skillname command` to run. No auto-trigger.

## Deterministic CLI queries

The skills are write/reconciliation adapters. For read-only project retrieval, prefer the VEF CLI:

| Command | Result |
|---|---|
| `vef list [type]` | Filtered task, roadmap, vision, or decision summaries |
| `vef show <id>` | Full frontmatter and prose for one item |
| `vef refs <id>` | Typed incoming and outgoing relationships |
| `vef why <id>` | Rule-based task → roadmap → vision and decision rationale paths |
| `vef graph` | Complete canonical typed graph |
| `vef search <query>` | Case-insensitive canonical frontmatter/body search |

All query commands support `--json`; they do not modify files or invoke an agent.

---

## Conceptual model

An **agent** is a Claude instance with a specific profile (system prompt, tools, skills, capabilities). Agents are the runtime workers that execute tasks — building features, reviewing code, researching questions, running workflows.

The framework defines:
1. **Agent profiles** — reusable agent configurations (system prompt, toolset, skillset)
2. **Tool catalog** — portable tools agents can invoke
3. **Skill catalog** — skills agents can invoke (`/tasks`, `/roadmap`, `/bugs`, `/decisions`)
4. **Context-gating rules** — which tools/skills activate in which contexts (routes, entities, channels)

## Agent profiles

### `product-docs-agent`

**Purpose:** Reconcile and regenerate product documentation. The primary worker for the **product-docs skill suite** (`/tasks`, `/roadmap`, `/bugs`, `/decisions`).

**System prompt:**
```markdown
You are the product-docs agent. Your job is to:
1. Validate frontmatter schemas across canonical roadmap and task item files
2. Reconcile canonical items and regenerate ROADMAP.md and TASKS.md without inventing records
3. Detect orphans and inconsistencies
4. Commit changes with structured messages

You write markdown. You don't execute code. You don't deploy. You only read and write docs.
```

**Tools:**
- `Glob` — find canonical item files, framework documents, and adapters
- `Read` — read canonical item files and singleton documents
- `Write` — write regenerated docs
- `Bash` — run `git add` and `git commit` (no force-pushes)

**Skills:**
- The **product-docs skill suite** — `/tasks`, `/roadmap`, `/bugs`, `/decisions` (each defines its own schema + reconcile logic), plus `/apply` for one-shot migration

**When invoked:**
- Manually via the per-doc skills (`/tasks reconcile`, `/roadmap reconcile`, `/decisions reconcile`, `/bugs sync`)
- Automatically by GitHub Actions when docs change (planned)

## Tool catalog

### File operations

- `Read` — read file contents
- `Write` — write new files (overwrites existing)
- `Edit` — string replacement in files
- `Glob` — pattern-based file discovery
- `Grep` — content search

**Context gating:**
- Always active for all agents (fundamental)

### Git operations

- `Bash` — shell access for git commands (`git log`, `git diff`, `git status`, `git add`, `git commit`)
- **NO force-pushes** — never use `git push --force`
- **NO rewrites** — never use `git rebase` or `git reset --hard` without explicit user confirmation

**Context gating:**
- Active for `product-docs-agent` when committing reconciled documentation
- Consumer repositories define their own application-development agents and tool permissions
- **Commit messages must end with** `Co-Authored-By: Claude <noreply@anthropic.com>`

### GitHub integration

- `Bash` + `gh` CLI — GitHub Issues, Discussions, PRs
- Future: direct GitHub MCP server (when available)

**Context gating:**
- Active for `product-docs-agent` when reconciling external issue references
- Consumer-specific GitHub workflows belong in the consumer repository

## Skill catalog

> **OKF v0.2 (DEC-002).** All schemas below additionally support optional OKF fields: `tags` (cross-cutting labels), `resource` (canonical URI to artifact), `generated` {by, at}, `verified` [{by, at}]. Actor convention: `human:<id>` / `<producer>/<version>` / `process:<id>`. See [`CLAUDE.md` Frontmatter schemas](CLAUDE.md#frontmatter-schemas) for full detail.

### `/tasks`

**Purpose:** Manage TASKS.md — list, add, update, complete, reconcile tasks.

**When invoked:**
- `/tasks list` — show all tasks (filter by status/priority/assignee/roadmap_item)
- `/tasks add` — add a new task with frontmatter
- `/tasks update TASK-XXX` — update existing task fields
- `/tasks complete TASK-XXX` — mark task as completed
- `/tasks reconcile` — validate schemas, detect orphans

**What it does:**
1. Reads canonical `docs/tasks/*.md` files
2. Validates frontmatter schemas
3. Reports inconsistencies
4. Runs `vef project` and strict validation after accepted changes
5. Commits with `Co-Authored-By: Claude <noreply@anthropic.com>`

**Schema rules:**
```yaml
id: TASK-XXX
title: Short description
description: One-line summary (in YAML)
status: pending | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
roadmap_item:
  id: ROADMAP-XXX
  name: "Item name"
  url: /ROADMAP.md#ROADMAP-XXX
assignee: name or empty
depends_on:
  - id: TASK-YYY
    name: "Prerequisite task"
    url: /TASKS.md#TASK-YYY
related_bugs:
  - id: 42
    name: "Bug title"
    url: https://github.com/user/repo/issues/42
related_decisions:
  - id: DEC-XXX
    name: "Decision title"
    url: /DECISIONS.md#DEC-XXX
last_updated: 2026-08-12
```

### `/roadmap`

**Purpose:** Manage ROADMAP.md — list, add, graduate, reconcile roadmap items.

**When invoked:**
- `/roadmap list` — show all items (filter by quarter/status)
- `/roadmap add` — add a new roadmap item with frontmatter
- `/roadmap graduate "Q1 — PowerPoint"` — graduate item → tasks
- `/roadmap reconcile` — validate schemas, detect orphans

**What it does:**
1. Reads canonical `docs/roadmap/*.md` files
2. Validates frontmatter schemas
3. Reports inconsistencies
4. Runs `vef project` and strict validation after accepted changes
5. Commits with `Co-Authored-By: Claude <noreply@anthropic.com>`

**Schema rules:**
```yaml
id: ROADMAP-XXX
title: Short description
description: Full description (in YAML)
quarter: Q1 | Q2 | Q3 | Q4
status: Deferred | In Progress | Completed | Blocked
priority: P0 | P1 | P2 | P3
vision_theme:
  id: theme-slug
  name: "Vision theme name"
  url: /VISION.md#theme-slug
related_tasks:
  - id: TASK-XXX
    name: "Task title"
    url: /TASKS.md#TASK-XXX
related_decisions:
  - id: DEC-XXX
    name: "Decision title"
    url: /DECISIONS.md#DEC-XXX
last_updated: 2026-08-12
```

### `/bugs`

**Purpose:** Manage bugs through GitHub Issues, the canonical external bug tracker.

**When invoked:**
- `/bugs list` — show bugs (filter by status/label)
- `/bugs create` — create a GitHub Issue
- `/bugs resolve 42` — close a GitHub Issue

**What it does:**
1. Queries GitHub Issues with the `bug` label
2. Creates, lists, or resolves issues through the repository's configured GitHub access
3. Preserves issue URLs in VEF relationship fields when a durable record needs the reference

### `/decisions`

**Purpose:** Manage DECISIONS.md — list, add, update, supersede, reconcile decisions.

**When invoked:**
- `/decisions list` — show all decisions (filter by status)
- `/decisions add` — add a new decision with frontmatter
- `/decisions update DEC-XXX` — update existing decision
- `/decisions supersede DEC-XXX` — mark as superseded by new decision
- `/decisions reconcile` — validate schemas, detect orphans

**What it does:**
1. Reads canonical `docs/decisions/*.md` files
2. Validates frontmatter schemas
3. Reports inconsistencies
4. Runs `vef project` and strict validation after accepted changes
5. Commits with `Co-Authored-By: Claude <noreply@anthropic.com>`

**Schema rules:**
```yaml
id: DEC-XXX
title: Short description
status: accepted | deprecated | superseded
context: Problem situation
decision: What was decided
rationale: Why this option
consequences: Impact (positive + negative)
superseded_by:
  id: DEC-YYY
  name: "Newer decision"
  url: /DECISIONS.md#DEC-YYY
related_tasks:
  - id: TASK-XXX
    name: "Task title"
    url: /TASKS.md#TASK-XXX
related_roadmap_items:
  - id: ROADMAP-XXX
    name: "Roadmap item"
    url: /ROADMAP.md#ROADMAP-XXX
last_updated: 2026-08-12
```

## Context-gating framework

### Problem

An adopter may need tools or skills to activate only for particular entities, routes, or channels. Those predicates are consumer configuration; VEF defines the portable shape without embedding a consumer's domain model.

### Solution: `activeWhen` predicate

Add an `activeWhen` predicate to each tool + skill:

```typescript
type ActiveWhen = {
  entityTypes?: string[]     // consumer-defined entity type names
  routes?: string[]          // glob patterns for route paths
  channels?: string[]        // ['agent', 'http', 'frontend']
}
```

Absence/empty = always active (backward compatible).

The predicate belongs to the per-profile tool/skill assignment so the same capability can be gated differently by different adopters. VEF does not prescribe a consumer database or runtime filter function.

## Framework implementation status

**Interfaces shipped:**
- ✅ `/tasks`, `/roadmap`, `/bugs`, `/decisions`, and `/apply` agent adapters
- ✅ `vef init`, `migrate`, `project`, `validate`, and `doctor`
- ✅ Deterministic read-only query commands

**Schema patterns proven:**
- ✅ URL-based cross-linking (tasks → roadmap, roadmap → vision, etc.)
- ✅ Canonical one-file-per-item storage with deterministic committed ledgers
- ✅ Bidirectional linking via URLs

> **Storage topology shipped (DEC-004 / DEC-007 / TASK-012 / TASK-028 / TASK-029).** Edit canonical records under `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/`; edit collection prose in each `_index.md`; then run `vef project`. Root structured ledgers are generated, and strict validation rejects drift. Plain `vef doctor` reports deterministic core enforcement separately from optional adapter compatibility; consumers may explicitly authorize supported core remediation with `vef doctor --fix`. Existing consumer-owned adapters are never overwritten.

**Schema status:**
- ✅ `description` present on Task + Roadmap schemas
- ✅ All related_ fields use the `id + name + url` pattern (relative same-repo, absolute cross-repo)
- ✅ `roadmap_item` / `vision_theme` / `superseded_by` are singular objects; `depends_on` / `related_*` are arrays
- ✅ Vision themes are supported by the canonical structured schema

## Next steps for the framework

1. Publish the verified package and public adoption materials.
2. Implement the lightweight human review workspace against the canonical loader.
3. Add transactional writes after the storage contract is stable in consumer use.
4. Add optional Obsidian and wiki review adapters after the shared review contract is proven.

This AGENTS.md is the **manual** for your agent workforce. When you add a new tool or skill, document it here. When you change a gating rule, update it here. When you debug an agent behavior, start here.

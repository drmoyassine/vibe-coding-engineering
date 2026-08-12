# AGENTS.md

This document defines the agent profiles, tool catalogs, skill catalogs, and context-gating rules for the **vibe-coding-engineering** framework.

## Skills — How to invoke

When working with docs in a repo that adopts this framework, invoke these skills directly:

| Skill | What it does | Invocation examples |
|---|---|---|---|
| **`/tasks`** | Manage TASKS.md | `/tasks list`<br>`/tasks list status:pending`<br>`/tasks add`<br>`/tasks complete TASK-001`<br>`/tasks reconcile` |
| **`/roadmap`** | Manage ROADMAP.md | `/roadmap list`<br>`/roadmap list quarter:Q1`<br>`/roadmap add`<br>`/roadmap graduate "Q1 — PowerPoint"`<br>`/roadmap reconcile` |
| **`/bugs`** | Manage GitHub Issues + product_failures | `/bugs list`<br>`/bugs list status:open`<br>`/bugs create`<br>`/bugs resolve 42`<br>`/bugs sync` |
| **`/decisions`** | Manage DECISIONS.md | `/decisions list`<br>`/decisions list status:accepted`<br>`/decisions add`<br>`/decisions supersede DEC-001`<br>`/decisions reconcile` |

**Skills are manual invoke only** — type `/skillname command` to run. No auto-trigger.

---

## Conceptual model

An **agent** is a Claude instance with a specific profile (system prompt, tools, skills, capabilities). Agents are the runtime workers that execute tasks — building features, reviewing code, researching questions, running workflows.

The framework defines:
1. **Agent profiles** — reusable agent configurations (system prompt, toolset, skillset)
2. **Tool catalog** — tools agents can invoke (Supabase MCP, file operations, etc.)
3. **Skill catalog** — skills agents can invoke (`/tasks`, `/roadmap`, `/bugs`, `/decisions`)
4. **Context-gating rules** — which tools/skills activate in which contexts (routes, entities, channels)

## Agent profiles

### `product-docs-agent`

**Purpose:** Reconcile and regenerate product documentation. The primary worker for the `/product-docs` skill.

**System prompt:**
```markdown
You are the product-docs agent. Your job is to:
1. Validate frontmatter schemas across roadmap and task fragments
2. Assemble ROADMAP.md and TASKS.md from their fragment files
3. Detect orphans and inconsistencies
4. Commit changes with structured messages

You write markdown. You don't execute code. You don't deploy. You only read and write docs.
```

**Tools:**
- `Glob` — find fragment files (`roadmap/*.md`, `tasks/*.md`)
- `Read` — read fragment files and existing docs
- `Write` — write regenerated docs
- `Bash` — run `git add` and `git commit` (no force-pushes)

**Skills:**
- `/product-docs` — the reconciliation logic (defines schemas, assembly rules)

**When invoked:**
- Manually via `/product-docs reconcile`
- Automatically by GitHub Actions when fragments change (planned)

### `studygram-agent`

**Purpose:** General-purpose agent for Studygram product development. The primary worker for `studygram-app`.

**See:** `studygram-app` repo's AGENTS.md (this framework is the substrate; that repo is the consumer).

## Tool catalog

### Supabase MCP tools

- `mcp__supabase__execute_sql` — execute SQL against the Studygram database
- `mcp__supabase__apply_migration` — apply schema migrations
- `mcp__supabase__deploy_edge_function` — deploy edge functions via Management API

**Context gating:**
- Always active for `studygram-agent` (DB ops are core to the product)
- Never active for `product-docs-agent` (docs only)

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
- Active for `studygram-agent` (ship features)
- Active for `product-docs-agent` (commit docs)
- **Commit messages must end with** `Co-Authored-By: Claude <noreply@anthropic.com>`

### GitHub integration

- `Bash` + `gh` CLI — GitHub Issues, Discussions, PRs
- Future: direct GitHub MCP server (when available)

**Context gating:**
- Active for `product-docs-agent` (sync Issues → BUGS view)
- Active for `studygram-agent` (comment on PRs, reference Issues)

## Skill catalog

### `/tasks`

**Purpose:** Manage TASKS.md — list, add, update, complete, reconcile tasks.

**When invoked:**
- `/tasks list` — show all tasks (filter by status/priority/assignee/roadmap_item)
- `/tasks add` — add a new task with frontmatter
- `/tasks update TASK-XXX` — update existing task fields
- `/tasks complete TASK-XXX` — mark task as completed
- `/tasks reconcile` — validate schemas, detect orphans

**What it does:**
1. Reads TASKS.md
2. Validates frontmatter schemas
3. Reports inconsistencies
4. Commits with `Co-Authored-By: Claude <noreply@anthropic.com>`

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
1. Reads ROADMAP.md
2. Validates frontmatter schemas
3. Reports inconsistencies
4. Commits with `Co-Authored-By: Claude <noreply@anthropic.com>`

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

**Purpose:** Manage bugs via GitHub Issues + product_failures table.

**When invoked:**
- `/bugs list` — show bugs (filter by status/label)
- `/bugs create` — create GitHub Issue + product_failures row
- `/bugs resolve 42` — close Issue + update product_failures
- `/bugs sync` — cross-reference Issues ↔ product_failures

**What it does:**
1. Queries GitHub Issues with `bug` label
2. Queries product_failures table (source = 'github')
3. Reports discrepancies
4. Creates/updates Issues and table rows

**product_failures schema:**
```sql
source TEXT -- 'github'
kind TEXT -- 'issue'
severity TEXT -- 'P0' | 'P1' | 'P2' | 'P3'
status TEXT -- 'open' | 'resolved' | 'ignored'
details JSONB -- issue_number, title, labels
```

### `/decisions`

**Purpose:** Manage DECISIONS.md — list, add, update, supersede, reconcile decisions.

**When invoked:**
- `/decisions list` — show all decisions (filter by status)
- `/decisions add` — add a new decision with frontmatter
- `/decisions update DEC-XXX` — update existing decision
- `/decisions supersede DEC-XXX` — mark as superseded by new decision
- `/decisions reconcile` — validate schemas, detect orphans

**What it does:**
1. Reads DECISIONS.md
2. Validates frontmatter schemas
3. Reports inconsistencies
4. Commits with `Co-Authored-By: Claude <noreply@anthropic.com>`

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

### `/studygram-check-failures`

**Purpose:** Triage the Studygram agent platform's failure log (`product_failures` table).

**See:** `studygram-app/.claude/skills/studygram-check-failures/`

**When invoked:**
- User runs `/studygram-check-failures`
- Scheduled cron job (planned)

**What it does:**
1. Pulls open failures from `product_failures`
2. Presents triage summary (escalations, hotspots, volume)
3. Offers follow-ups (show detail, resolve/ignore, prune)

**Context gating:**
- Active for `studygram-agent` only (product-specific)

## Context-gating framework

### Problem

Today, all tools and skills are **always active** for an agent. But some tools should only activate in specific contexts:
- `link_document` tool should only surface when viewing a contact/institution/provider (entity has a document scope)
- `/studygram-check-failures` should only run when the channel is `agent` (not `http` or `frontend`)

### Solution: `activeWhen` predicate

Add an `activeWhen` predicate to each tool + skill:

```typescript
type ActiveWhen = {
  entityTypes?: string[]     // ['contact', 'institution', 'provider']
  routes?: string[]          // glob patterns for route paths
  channels?: string[]        // ['agent', 'http', 'frontend']
}
```

Absence/empty = always active (backward compatible).

Lives on the `agent_profile_tools` / `agent_profile_skills` JOIN (per-profile gating) so the same tool can gate differently per agent.

**Filter location:** `buildToolset(toolCtx, profile, subjectContactId, onFailure)` in agent-runtime.

### Inaugural consumer: `link_document` tool

**Purpose:** Agent proposes a `documents` row (applicant_id/org_id/provider_id) via `resolveDocumentScope(userCtx, viewing)`.

**Activation:**
```typescript
activeWhen: {
  entityTypes: ['contact', 'institution', 'provider']
}
```

Only surfaces where a doc target exists; silent on list/dashboard routes.

**Rescope confirm:** When proposed target ≠ uploader's own context (non-lead on a lead), agent asks "file this under <lead>?" — confirmed rescope carries the target's org_id.

**Capability-gated:** Proposal only; RLS is the backstop. Client pre-check `canWriteDocumentFor(targetId)` via `contact_in_my_scope` RPC avoids proposing scopes RLS rejects.

## Implementation status (studygram-app)

**Skills shipped (2026-08-12):**
- ✅ /tasks — manages TASKS.md
- ✅ /roadmap — manages ROADMAP.md
- ✅ /bugs — manages GitHub Issues + product_failures
- ✅ /decisions — manages DECISIONS.md

**Docs created (2026-08-12):**
- ✅ ROADMAP.md — Q1 pptx, Q2 sandboxed dev, Q4 context-gated tools
- ✅ TASKS.md — 6 open tasks (TASK-001 to TASK-006)
- ✅ DECISIONS.md — template with frontmatter schema
- ✅ BUGS — GitHub Issues (existing)

**Schema patterns proven:**
- ✅ URL-based cross-linking (tasks → roadmap, roadmap → vision, etc.)
- ✅ Frontmatter per item (not separate fragment files)
- ✅ Bidirectional linking via URLs

**Schema status (2026-08-12):**
- ✅ `description` present on Task + Roadmap schemas
- ✅ All related_ fields use the `id + name + url` pattern (relative same-repo, absolute cross-repo)
- ✅ `roadmap_item` / `vision_theme` / `superseded_by` are singular objects; `depends_on` / `related_*` are arrays
- ⬜ VISION.md needs frontmatter per theme (TASK-006 — deferred)

## Next steps for the framework

1. **VISION.md frontmatter** — Add frontmatter per theme with cross-links to ROADMAP (TASK-006)
2. **External tool integrations** — Wire Fider or GitHub Discussions for ROADMAP proposals
3. **GitHub Actions** — Auto-reconcile on doc changes
4. **Generalize to other repos** — Package framework for reuse

This AGENTS.md is the **manual** for your agent workforce. When you add a new tool or skill, document it here. When you change a gating rule, update it here. When you debug an agent behavior, start here.

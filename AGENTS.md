# AGENTS.md

This document defines the agent profiles, tool catalogs, skill catalogs, and context-gating rules for the **vibe-coding-engineering** framework.

## Conceptual model

An **agent** is a Claude instance with a specific profile (system prompt, tools, skills, capabilities). Agents are the runtime workers that execute tasks — building features, reviewing code, researching questions, running workflows.

The framework defines:
1. **Agent profiles** — reusable agent configurations (system prompt, toolset, skillset)
2. **Tool catalog** — tools agents can invoke (Supabase MCP, file operations, etc.)
3. **Skill catalog** — skills agents can invoke (`/product-docs`, `/studygram-check-failures`, etc.)
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

### `/product-docs`

**Purpose:** Reconcile product documentation (VISION, ARCHITECTURE, ROADMAP, TASKS, BUGS).

**When invoked:**
- User runs `/product-docs reconcile`
- GitHub Action triggers after fragment changes (planned)

**What it does:**
1. Validates frontmatter schemas
2. Assembles ROADMAP.md from `roadmap/*.md`
3. Assembles TASKS.md from `tasks/*.md`
4. Queries GitHub Issues for BUGS view
5. Detects orphans and inconsistencies
6. Commits with structured message

**Schema rules:**
- ROADMAP item: `id, title, status, priority, quarter, depends_on, owners, related_issues, related_decisions, last_updated`
- Task: `id, title, status, priority, roadmap_item, assignee, depends_on, related_bugs, estimated_hours, last_updated`

**Implementation:** `vibe-coding-engineering/.claude/skills/product-docs/` (not yet built)

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

## Next steps

1. **Build the `/product-docs` skill** — implement schemas, assembly, reconciliation
2. **Add `activeWhen` to agent-runtime** — implement context-gated tool/skill activation
3. **Wire `link_document` tool** — first consumer of the gating framework
4. **Add GitHub Actions trigger** — auto-reconcile on fragment changes
5. **Extend to other tools/skills** — surface `link_document` in agent-chat, gate `/studygram-check-failures` to `agent` channel

This AGENTS.md is the **manual** for your agent workforce. When you add a new tool or skill, document it here. When you change a gating rule, update it here. When you debug an agent behavior, start here.

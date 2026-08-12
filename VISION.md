# VISION.md

## The problem

Documentation rot is the silent killer of velocity. The typical solo-founder or small-team pattern:

1. **Decisions live in ephemeral spaces** — Slack threads, Discord, ad-hoc calls, or Claude transcripts that vanish after context compaction.
2. **No canonical source of truth** — "What did we decide about X?" requires a memory search or a re-argument.
3. **No path from idea to executed work** — Roadmap discussions don't automatically become tasks; bug reports don't automatically surface in planning; decisions aren't discoverable by the AI that's doing half the work.
4. **No queryability without a DB** — "What's blocking Q2?", "Show all P1 tasks", "What decisions depended on ARCH-0042?" are manual grep exercises or impossible.

The cost isn't just inconvenience — it's **repeated work**. Re-litigating decisions. Re-discovering dependencies. Re-explaining context to your AI pair every session because there's no persistent, structured place for it to read.

## The solution

**vibe-coding-engineering** is a structured documentation framework for AI-assisted product development. Three layers:

### Layer 1 — Content (the artifacts)

Six core documents, each with a clear purpose and privacy boundary:

| Document | Purpose | Public? | Source of truth |
|---|---|---|---|
| **VISION.md** | Why we exist, north-star direction, problem/solution framing | ✅ Public | Markdown with frontmatter per theme |
| **ARCHITECTURE.md** | How the system works — data model, key patterns, design decisions | ❌ Private | Markdown + ADR-style records |
| **ROADMAP.md** | Directional roadmap — quarters, themes, priorities | ✅ Public | Markdown with frontmatter per item |
| **TASKS.md** | WBS of roadmap — tasks with status, owners, dependencies | ❌ Private | Markdown with frontmatter per task |
| **DECISIONS.md** | Architectural/product/technical decisions with context & rationale | ❌ Private | Markdown with frontmatter per decision |
| **BUGS** | Bug tracker, platform health | ✅ Public | **GitHub Issues** (no markdown file — the Issues *are* the source) |

Plus:
- **AGENTS.md** — Agent profiles, tool/skill catalogs, context-gating rules (private)
- **CLAUDE.md** — Repo-level instructions for Claude (public, checked-in)

**Key pattern:** interactive documents (ROADMAP, BUGS) have a **canonical markdown source** (read-only, version-controlled) AND a **paired intake tool**. Users never write the canonical doc; they interact with the intake tool (Fider, GitHub Discussions, GitHub Issues). Promotion into the curated doc is a privileged act enforced by the tool's permissions.

### Layer 2 — Discipline (the skills)

Four Claude skills that enforce structure, handle updates, and prevent drift:

- **`/tasks`** — Add, update, complete, list, and reconcile tasks in TASKS.md
- **`/roadmap`** — Add, update, graduate (→ tasks), list, and reconcile roadmap items in ROADMAP.md
- **`/bugs`** — Create, resolve, list, and sync bugs between GitHub Issues and product_failures table
- **`/decisions`** — Add, update, supersede, list, and reconcile decisions in DECISIONS.md

Each skill:
- Validates frontmatter schemas on add/update
- Handles list filtering (by status, priority, etc.)
- Provides reconciliation (detects orphans, validates cross-links)
- Commits with structured messages ending with `Co-Authored-By: Claude <noreply@anthropic.com>`

Skills are the carrier — not a system prompt (too expensive for 90% of sessions). Invoke when direction-changing work lands.

### Layer 3 — Trigger (the thin hook)

A one-line addition to `CLAUDE.md`:

```markdown
When you complete direction-changing work (features, refactorings, decisions),
run the relevant product-docs skill (`/tasks`, `/roadmap`, `/bugs`, `/decisions`)
to reconcile the affected doc, or `/apply` to migrate docs into the framework.
```

That's it. No always-on tax. The skills fire when *needed*, not every session.

## Target user

- **Solo founder + AI pair** — you ship with Claude as your co-engineer. You need decisions persisted across sessions, discoverable by the AI, and connected to the work queue.
- **Small teams with agent workflows** — you use agents for multi-step tasks (code reviews, research, sweeps). You need the agents to read your product context, write to it in a structured way, and trigger updates when they make decisions.

## What success looks like

Six months from now, a contributor joins your project. They ask: *"What's the architecture? What are we building? What's blocking the next release?"*

- They open `ARCHITECTURE.md` — key patterns, data model, design decisions are all there, with links to the specific items that motivated them.
- They open `ROADMAP.md` — quarters are clearly scoped, priorities are visible, and every item links back to VISION themes and forward to tasks.
- They open `TASKS.md` — tasks have owners, status, dependencies, and bidirectional links to roadmap items and decisions.
- They open `DECISIONS.md` — architectural decisions are captured with context, rationale, and consequences.
- They search GitHub Issues — bugs are public, commentable, and their status flows back into the planning view.

And when they ship a feature, they run `/product-docs reconcile` — and VISION/ARCHITECTURE/ROADMAP/TASKS all update to reflect the new reality. No rot. No drift. No "I swear we discussed this somewhere."

## Non-goals

- This is **not** a project management tool (no Gantt charts, no burndown charts, no time-tracking). Jira, Linear, Asana exist.
- This is **not** a team collaboration platform (no kanban boards, no real-time chat). Notion, Confluence exist.
- This is **not** a CI/CD system (no pipelines, no deployments). GitHub Actions, CircleCI exist.

It's a **documentation framework** optimized for AI-assisted engineering. One job: keep the canonical product context in sync, queryable, and discoverable — by humans and by AI.

## Implementation pattern (from studygram-app)

**Core docs (6):**
- ROADMAP.md, TASKS.md, DECISIONS.md — created with markdown frontmatter per item
- BUGS — GitHub Issues (no markdown file)
- VISION.md, ARCHITECTURE.md — planned

**Skills (4):**
- /tasks, /roadmap, /bugs, /decisions — each handles list/add/update/reconcile

**Schema patterns (URL-based cross-linking):**
- Tasks → Roadmap via `roadmap_item` (URL)
- Tasks → Bugs via `related_bugs` (URLs)
- Tasks → Decisions via `related_decisions` (URLs)
- Roadmap items → Vision via `vision_theme` (URL)
- Roadmap items → Tasks via `related_tasks` (URLs)
- Decisions → Tasks/Roadmap via `related_tasks`/`related_roadmap_items` (URLs)

**Key insight:** URLs in frontmatter enable bidirectional navigation and make cross-doc dependencies machine-readable. Cross-linking uses the **`id + name + url`** pattern: **relative URLs for same-repo** (`/TASKS.md#TASK-001`), **absolute URLs for cross-repo / external** (e.g. GitHub Issues `https://github.com/user/repo/issues/42`).

This framework is the substrate for everything you ship. Start simple, evolve when you feel pain.

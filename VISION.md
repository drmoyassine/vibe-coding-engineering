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

Five core documents, each with a clear purpose and privacy boundary:

| Document | Purpose | Public? | Source of truth |
|---|---|---|---|
| **VISION.md** | Why we exist, north-star direction, problem/solution framing | ✅ Public | This file — markdown |
| **ARCHITECTURE.md** | How the system works — data model, key patterns, design decisions | ❌ Private | Markdown + ADR-style records |
| **ROADMAP.md** | Directional roadmap — quarters, themes, priorities | ✅ Public | **Generated** from frontmatter items (e.g., `roadmap/ROADMAP-0042.md`) |
| **TASKS.md** | WBS of roadmap — tasks with status, owners, dependencies | ❌ Private | **Generated** from frontmatter items (e.g., `tasks/TASK-0142.md`) |
| **BUGS** | Bug tracker, platform health | ✅ Public | **GitHub Issues** (no markdown file — the Issues *are* the source) |

Plus:
- **AGENTS.md** — Agent profiles, tool/skill catalogs, context-gating rules (private)
- **CLAUDE.md** — Repo-level instructions for Claude (public, checked-in)

**Key pattern:** interactive documents (ROADMAP, BUGS) have a **canonical markdown source** (read-only, version-controlled) AND a **paired intake tool**. Users never write the canonical doc; they interact with the intake tool (Fider, GitHub Discussions, GitHub Issues). Promotion into the curated doc is a privileged act enforced by the tool's permissions.

### Layer 2 — Discipline (the `/product-docs` skill)

A Claude skill that enforces structure, handles assembly, and prevents drift:

- **Schema enforcement** — each doc type has a frontmatter contract (what fields a roadmap item needs, what a task needs). The skill validates on ingest.
- **Assembly** — `ROADMAP.md` and `TASKS.md` are *generated* from their fragment files (`roadmap/*.md`, `tasks/*.md`). Run `/product-docs reconcile` to regenerate.
- **Reconciliation** — graduating a roadmap proposal → task, syncing GitHub Issues → the BUGS view, detecting orphaned items.
- **Canonical definition** — the skill *is* the framework. If you want to change how ROADMAP items are structured, you edit the skill.

The skill is the carrier — not a system prompt (too expensive for 90% of sessions) and not "a framework" (that's the *future* generalization of this skill beyond your repos). For now, it's just a skill you invoke when direction-changing work lands.

### Layer 3 — Trigger (the thin hook)

A one-line addition to `CLAUDE.md`:

```markdown
When you complete direction-changing work (features, refactorings, decisions),
run `/product-docs reconcile` to update VISION, ARCHITECTURE, ROADMAP, and TASKS.
```

That's it. No always-on tax. The skill fires when *needed*, not every session.

## Target user

- **Solo founder + AI pair** — you ship with Claude as your co-engineer. You need decisions persisted across sessions, discoverable by the AI, and connected to the work queue.
- **Small teams with agent workflows** — you use agents for multi-step tasks (code reviews, research, sweeps). You need the agents to read your product context, write to it in a structured way, and trigger updates when they make decisions.

## What success looks like

Six months from now, a contributor joins your project. They ask: *"What's the architecture? What are we building? What's blocking the next release?"*

- They open `ARCHITECTURE.md` — key patterns, data model, design decisions are all there, with links to the specific items that motivated them.
- They open `ROADMAP.md` — quarters are clearly scoped, priorities are visible, and every item links back to the discussion or bug that spawned it.
- They open `TASKS.md` — tasks have owners, status, dependencies. They can filter by status, priority, or assignee.
- They search GitHub Issues — bugs are public, commentable, and their status flows back into the planning view.

And when they ship a feature, they run `/product-docs reconcile` — and VISION/ARCHITECTURE/ROADMAP/TASKS all update to reflect the new reality. No rot. No drift. No "I swear we discussed this somewhere."

## Non-goals

- This is **not** a project management tool (no Gantt charts, no burndown charts, no time-tracking). Jira, Linear, Asana exist.
- This is **not** a team collaboration platform (no kanban boards, no real-time chat). Notion, Confluence exist.
- This is **not** a CI/CD system (no pipelines, no deployments). GitHub Actions, CircleCI exist.

It's a **documentation framework** optimized for AI-assisted engineering. One job: keep the canonical product context in sync, queryable, and discoverable — by humans and by AI.

## Next steps

1. **Create the remaining core docs** — `ARCHITECTURE.md`, `ROADMAP.md` (seed with `studygram-platform-roadmap.md` content), `TASKS.md` (seed with existing task list).
2. **Build the `/product-docs` skill** — define schemas, assembly logic, reconciliation rules.
3. **Choose ROADMAP intake tool** — Fider (better UX, new infra) or GitHub Discussions (zero infra, clunkier).
4. **Wire GitHub Issues as BUGS source** — no `BUGS.md` file; the skill queries Issues directly.
5. **Add automation** — GitHub Actions or n8n workflows that watch the external tools and push fragments into the repo.

This framework is the substrate for everything you ship. Start simple, evolve when you feel pain.

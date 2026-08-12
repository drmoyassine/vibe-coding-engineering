# vibe-engineering-framework

**A structured documentation framework for AI-assisted product engineering.**

Decisions, tasks, roadmap, and bugs are scattered across Slack threads, Claude transcripts, code comments, and memory files that vanish after context compaction. This framework gives them a permanent, structured, queryable home — in version-controlled markdown that humans and AI agents can both read and maintain.

---

## Why this exists

**Documentation rot is the silent killer of velocity.** The pattern repeats in every solo-founder and small-team project:

1. **Decisions live in ephemeral spaces** — Slack, Discord, ad-hoc calls, AI chat transcripts that disappear when context is compacted.
2. **No canonical source of truth** — *"What did we decide about X?"* requires a memory search, a git archaeology session, or a re-argument.
3. **No path from idea to executed work** — Roadmap discussions never become tasks. Bug reports don't surface in planning. Decisions aren't discoverable by the AI doing half the work.
4. **No queryability without a database** — *"What's blocking Q2?"*, *"Show all P1 tasks"*, *"What depended on that decision?"* are manual grep exercises or impossible.

The cost isn't inconvenience — it's **repeated work**. Re-litigating decisions. Re-discovering dependencies. Re-explaining context to your AI pair every session because there's no persistent, structured place for it to read.

**vibe-engineering-framework solves this** by making product context a first-class, structured artifact — not a side effect of chat logs.

---

## What it is

A **meta-framework** — patterns, schemas, and a Claude Code skill suite that keep product documentation in sync, queryable, and discoverable. This repo is the **canonical definition**; consumer repos (like [`studygram-app`](https://github.com/drmoyassine/studygram-app)) adopt it.

### The three layers

| Layer | What | Examples |
|-------|------|----------|
| **1. Content** | Version-controlled markdown documents, each with a clear purpose, privacy boundary, and YAML frontmatter schema | `VISION.md`, `ROADMAP.md`, `TASKS.md`, `DECISIONS.md`, `LOG.md`, `INDEX.md` |
| **2. Discipline** | Claude Code skills that enforce structure, handle validated editing, and prevent drift | `/tasks`, `/roadmap`, `/decisions`, `/bugs`, `/apply` |
| **3. Trigger** | A thin hook in `CLAUDE.md` that fires the skills when direction-changing work lands | *"After completing a feature, run `/tasks reconcile`"* |

### The core documents

| Document | Purpose | Source of truth |
|----------|---------|-----------------|
| **VISION.md** | Why we exist, north-star direction, problem/solution framing | Markdown with frontmatter per theme |
| **ARCHITECTURE.md** | How the system works — data model, key patterns, design decisions | Markdown + ADR-style records |
| **ROADMAP.md** | Directional roadmap — quarters, themes, priorities | Markdown with frontmatter per item |
| **TASKS.md** | Work breakdown — tasks with status, owners, dependencies | Markdown with frontmatter per task |
| **DECISIONS.md** | Architectural/product/technical decisions with context & rationale | Markdown with frontmatter per decision |
| **LOG.md** | Chronological change log + session learnings (OKF reserved filename) | Date-grouped entries, newest first |
| **INDEX.md** | Navigation hub / table of contents (OKF reserved filename) | Doc index with links |
| **BUGS** | Bug tracker, platform health | **GitHub Issues** (no markdown file — the Issues *are* the source) |

**Key pattern:** interactive documents (ROADMAP, BUGS) have a **canonical markdown source** (read-only, version-controlled) AND a **paired intake tool**. Users never write the canonical doc directly; they interact with the intake tool (Fider, GitHub Discussions, GitHub Issues). Promotion into the curated doc is a privileged act enforced by the skill's permissions.

---

## How it works

### Cross-linking philosophy

Every document links to every other via the **`id + name + url`** pattern (relative URLs for same-repo, absolute for cross-repo/external). The links follow a deliberate topology:

```
LOG.md (narrative memory)
    ↓ links to (via log_ref)
DECISIONS.md (central decision ledger)
    ↓ bidirectional links (via related_*)
VISION.md ← ROADMAP.md ← TASKS.md

BUGS (GitHub Issues)
    ↓ links to (via related_tasks)
TASKS.md
```

**The workflow in practice:**

```
We talk, discuss, analyze, plan
        ↓
captured in LOG.md (single-source memory)
        ↓
we make a decision
        ↓
logged to DECISIONS.md (canonical record)
        ↓
tasks / roadmap items / vision items that result
        ↓
linked to the DECISION (not to the log)
```

Tasks/Roadmap/Vision link to **DECISIONS.md**, not to LOG.md. The decision is the source of truth for *"what we decided"*; the log is the narrative history of *how we got there*.

### Bidirectional relationships

All cross-links are traversable both ways:

- `TASK.roadmap_item` ↔ `ROADMAP.related_tasks`
- `ROADMAP.vision_theme` ↔ `VISION.related_roadmap_items`
- `TASK.related_decisions` ↔ `DECISION.related_tasks`
- `ROADMAP.related_decisions` ↔ `DECISION.related_roadmap_items`
- `TASK.related_bugs` ↔ `BUG.related_tasks`

The `/reconcile` commands validate that every link is bidirectional and that no references dangle.

### Frontmatter schemas

Every item uses YAML frontmatter with a canonical field set. Example (a decision):

```yaml
---
id: DEC-001
title: Use markdown as source of truth for docs
status: accepted
context: Decisions were scattered across memory files and chat logs
decision: All product docs live in version-controlled markdown with frontmatter
rationale: Queryable, diffable, AI-readable — no proprietary lock-in
consequences: Requires discipline; skills enforce structure
related_tasks:
  - id: TASK-006
    name: "Write VISION.md"
    url: /TASKS.md#TASK-006
related_roadmap_items:
  - id: ROADMAP-001
    name: "PowerPoint support"
    url: /ROADMAP.md#ROADMAP-001
tags: [schema, docs]
last_updated: 2026-08-12
---
```

**OKF v0.2 optional fields** (may appear on any item): `tags`, `resource`, `generated {by, at}`, `verified [{by, at}]`, `log_ref`. Actor convention: `human:<id>` / `<producer>/<version>` / `process:<id>`.

---

## How to use it

### Install

```bash
npm install -g vibe-engineering-framework
```

Or use directly with `npx` (no global install needed).

### Scaffold a new project (`vef init`)

```bash
vef init                                    # scaffold into the current directory
vef --new --dir ./my-project                # scaffold into a specific directory
vef init --name "My App" --github owner/repo   # with project name + GitHub URLs for bugs
```

Creates `VISION.md`, `ROADMAP.md`, `TASKS.md`, `DECISIONS.md`, `LOG.md`, `INDEX.md`, `CLAUDE.md`, `AGENTS.md`, and the five Claude Code skills (`.claude/skills/`). Non-destructive — existing files are skipped unless `--force`.

### Adopt an existing repo (`vef migrate`)

```bash
vef --migrate                               # dry-run: detect docs, report findings
vef migrate --apply                         # install skills + apply structural fixes
```

Detects existing docs, installs the skills, flags items missing canonical frontmatter, and recommends running Claude Code's `/apply` for AI-powered discovery.

### Validate your docs (`vef validate`)

```bash
vef --validate                              # schema + cross-link check
vef validate --strict                       # exit 1 on warnings too (for CI)
```

Schema validation, orphan/cross-link detection, bidirectionality checks. Exits non-zero on errors — add to CI:

```yaml
# .github/workflows/docs.yml
- run: npx vibe-engineering-framework validate
```

### Health check (`vef doctor`)

```bash
vef --doctor                                # are all docs + skills installed?
```

### AI-powered migration (`/apply`)

After scaffolding or migrating, run Claude Code's `/apply` skill for AI-powered discovery — extracting decisions, tasks, and roadmap items from scattered sources (git history, memory files, prose) into canonical frontmatter.

If your repo has docs that predate the framework (bare IDs, missing frontmatter, decisions in memory files), run:

```
/apply                          # Full migration — all doc types
/apply --decisions              # Only DECISIONS.md
/apply --dry-run                # Report what would change, write nothing
/apply --source memory --source git   # Also scan memory files + git history
```

`/apply` runs a **6-phase multi-agent workflow**:

| Phase | What happens |
|-------|-------------|
| **1. Discover** | One agent per artifact document (ROADMAP.md, TASKS.md, DECISIONS.md, memory files, git history, etc.) — exhaustively extracts every item |
| **2. Reconcile** | Orchestrator analyzes all discoveries — identifies duplicates, orphans, drift, and cross-link gaps; drafts a reconciliation plan (structured actions + narrative) |
| **3. Extract** | Re-invokes the discovery agents with the plan — transforms items into canonical frontmatter, executes merges and cross-links |
| **4. Validate** | Parallel validators per doc type — schema check, bidirectional cross-link verification, orphan detection |
| **5. Render** | Pure-JS rendering — assembles `entryMarkdown` for the caller to write into each doc |
| **6. Align** | Framework audit — proposes edits to `CLAUDE.md`, `AGENTS.md`, and skill definitions to keep them aligned with the doc reality |

### Manage docs day-to-day

**Tasks:**
```
/tasks list                     # Show all tasks
/tasks list status:pending      # Filter by status
/tasks add                      # Add a new task (prompts for fields)
/tasks complete TASK-001        # Mark complete
/tasks reconcile                # Validate schemas, detect orphans
```

**Roadmap:**
```
/roadmap list                   # Show all roadmap items
/roadmap list quarter:Q1        # Filter by quarter
/roadmap add                    # Add a roadmap item
/roadmap graduate ROADMAP-001   # Break down into tasks
/roadmap reconcile              # Validate schemas, detect orphans
```

**Decisions:**
```
/decisions list                 # Show all decisions
/decisions list status:accepted # Filter by status
/decisions add                  # Add a decision
/decisions supersede DEC-001    # Mark as superseded
/decisions reconcile            # Validate schemas, cross-links
```

**Bugs:**
```
/bugs list                      # Show all bugs (GitHub Issues)
/bugs create                    # Create a bug report
/bugs resolve 42                # Resolve a bug
/bugs sync                      # Cross-reference Issues ↔ product_failures
```

### Single-source-of-truth rules

| Rule | Detail |
|------|--------|
| **Decisions** | `DECISIONS.md` is the ONLY decision ledger — including decisions made by your AI agent. Never in memory files. |
| **Memory** | `LOG.md` is the single-source memory system. Durable session learnings live here — NOT in gitignored auto-memory (which drifts). |
| **Auto-memory** | Claude's internal memory (`~/.claude/projects/*/memory/*.md`) is for feedback, pointers, and user context ONLY — never product-structural content. |
| **Bugs** | GitHub Issues are the source. No markdown bug file. `/bugs sync` mirrors to `product_failures` for in-app querying. |
| **Each item type** | Lives in ONE canonical place. No duplicates across files. |

---

## Relationship to OKF

vibe-engineering-framework is an **implementation and extension** of the [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md), specialized for product documentation. See [DEC-002](DECISIONS.md#DEC-002) for the adoption decision.

| OKF concept | Our implementation |
|-------------|--------------------|
| Markdown + YAML frontmatter | ✅ All core docs |
| Reserved filenames (`index.md`, `log.md`) | ✅ `INDEX.md` (navigation) + `LOG.md` (changelog) |
| `okf_version` field | ✅ declared in root `INDEX.md` frontmatter |
| Actor convention (§7) | ✅ `human:<id>` / `<producer>/<version>` / `process:<id>` |
| Trust signals (`generated`, `verified`) | ✅ optional fields |
| `resource` + `tags` fields | ✅ optional fields |
| Producer/consumer independence | ✅ humans produce; skills consume; `/apply` migrates |
| Format, not platform | ✅ git-native, no proprietary lock-in |

**Extensions beyond OKF** (the differentiated value — "OKF for product docs"):
- **Structured cross-linking** — `id + name + url` with explicit relationship types (`depends_on`, `related_tasks`, `related_decisions`, `roadmap_item`, `vision_theme`)
- **Bidirectional relationships** — the VISION ↔ ROADMAP ↔ TASK ↔ DECISION topology is traversable both ways
- **Management skills** — `/tasks`, `/roadmap`, `/bugs`, `/decisions` for interactive, validated editing
- **Migration engine** — `/apply` with 6-phase multi-agent discovery + reconciliation
- **GitHub Issues integration** — `related_bugs` links to an external issue tracker (bugs have no markdown file)
- **Multi-repo support** — canonical definition (this repo) + consumer repos

**Comparison to [OpenKB](https://github.com/VectifyAI/OpenKB) / [LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):** those compile *raw documents* into a structured wiki using LLMs (LLM-authored links). vibe-engineering-framework inverts the model: **human-structured schemas** with skill-based management, where the LLM assists via the `/apply` migration skill rather than generating the graph. Different scope, complementary tools.

---

## Status

🚧 **Early framework.** Core docs + five management skills (`/tasks`, `/roadmap`, `/bugs`, `/decisions`, `/apply`) + the `vef` CLI (init, migrate, validate, doctor) built and proven in [`studygram-app`](https://github.com/drmoyassine/studygram-app). ROADMAP intake tool (Fider/GitHub Discussions) TBD.

> **npm publish pending.** Until the package is on the npm registry, use it locally:
> ```bash
> git clone https://github.com/drmoyassine/vibe-engineering-framework.git
> cd vibe-engineering-framework && npm install && npm link
> vef --help   # now available globally
> ```

## Roadmap

*Roadmap section to be added.*

## Consumers

- [`studygram-app`](https://github.com/drmoyassine/studygram-app) — Studygram CRM, the first product adopting this framework.

## License

MIT

# ROADMAP.md

**vibe-engineering-framework Roadmap** — Directional themes for the documentation framework.

Last updated: 2026-08-13

---

## Roadmap item schema

Each roadmap item uses YAML frontmatter. `src/lib/schemas.mjs` is the canonical machine-readable field contract delivered by FRAMEWORK-017. Related references follow the **`id + name + url`** pattern (relative URL for same-repo, absolute for cross-repo):

```yaml
---
id: FRAMEWORK-XXX
title: Short description
description: One-line summary
phase: Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4
status: Completed | In Progress | Deferred | Blocked
priority: P0 | P1 | P2 | P3
vision_theme:
  id: theme-slug
  name: "Vision theme name"
  url: /VISION.md#theme-slug
related_tasks:
  - id: TASK-XXX
    name: "Task title"
    url: https://github.com/drmoyassine/studygram-app/blob/main/TASKS.md#TASK-XXX
related_decisions:
  - id: DEC-XXX
    name: "Decision title"
    url: /DECISIONS.md#DEC-XXX
last_updated: 2026-08-12
---
```

---

## FRAMEWORK-001 — Define the core documents

---
id: FRAMEWORK-001
title: "Define the core documents"
description: "VISION.md, CLAUDE.md, AGENTS.md, README.md created"
phase: "Phase 0 — Foundation"
status: "Completed"
priority: "P0"
related_tasks:
  - id: TASK-002
    name: "Write framework ARCHITECTURE.md"
    url: /TASKS.md#TASK-002
related_decisions:
  - id: DEC-001
    name: "Use markdown as source of truth for docs"
    url: /DECISIONS.md#DEC-001
last_updated: 2026-08-12
---

*Phase 0 — Foundation (Completed 2026-08-12). What was built to establish the framework.*

Defined the framework's purpose, structure, and agent/skill model:
- VISION.md — the problem (doc rot), the 3-layer solution (content/discipline/trigger), target user, success criteria
- CLAUDE.md — repo-level instructions, schemas, skill invocation guide
- AGENTS.md — agent profiles, tool catalog, skill catalog, context-gating framework
- README.md — entry point

## FRAMEWORK-002 — Document the four management skills

---
id: FRAMEWORK-002
title: "Document the four management skills"
description: "/tasks, /roadmap, /bugs, /decisions schemas and invocation patterns"
phase: "Phase 0 — Foundation"
status: "Completed"
priority: "P0"
related_tasks:
  - id: TASK-003
    name: "Install the four management skills in the framework repo (dogfood)"
    url: /TASKS.md#TASK-003
last_updated: 2026-08-12
---

Documented the four skills that enforce structure and prevent drift:
- `/tasks` — Manage TASKS.md (list, add, update, complete, reconcile)
- `/roadmap` — Manage ROADMAP.md (list, add, graduate, reconcile)
- `/bugs` — Manage GitHub Issues + product_failures (list, create, resolve, sync)
- `/decisions` — Manage DECISIONS.md (list, add, update, supersede, reconcile)

## FRAMEWORK-003 — Standardize id+name+url related-item pattern

---
id: FRAMEWORK-003
title: "Standardize id+name+url related-item pattern"
description: "All cross-doc references use id + name + url (relative for same-repo, absolute for external)"
phase: "Phase 0 — Foundation"
status: "Completed"
priority: "P1"
last_updated: 2026-08-12
---

Established the canonical pattern for cross-referencing items between docs:
```yaml
related_tasks:
  - id: TASK-002
    name: "Implement activeWhen filter in buildToolset"
    url: /TASKS.md#TASK-002
```

## FRAMEWORK-004 — Build and test the four skills in studygram-app

---
id: FRAMEWORK-004
title: "Build and test the four skills in studygram-app"
description: "All four skills created as SKILL.md files in studygram-app/.claude/skills/"
phase: "Phase 1 — Proven in studygram-app"
status: "Completed"
priority: "P0"
last_updated: 2026-08-12
---

*Phase 1 — Proven in studygram-app (In Progress). The framework is being proven in a real product (studygram-app); this phase tracks the implementation.*

- ✅ `/tasks` skill — `.claude/skills/tasks/SKILL.md`
- ✅ `/roadmap` skill — `.claude/skills/roadmap/SKILL.md`
- ✅ `/bugs` skill — `.claude/skills/bugs/SKILL.md`
- ✅ `/decisions` skill — `.claude/skills/decisions/SKILL.md`
- ✅ Tested `/tasks list` — works correctly

## FRAMEWORK-005 — Create ROADMAP.md, TASKS.md, DECISIONS.md in studygram-app

---
id: FRAMEWORK-005
title: "Create ROADMAP.md, TASKS.md, DECISIONS.md in studygram-app"
description: "Migrated roadmap from memory, seeded tasks from task list, created DECISIONS.md template"
phase: "Phase 1 — Proven in studygram-app"
status: "Completed"
priority: "P0"
last_updated: 2026-08-12
---

- ✅ ROADMAP.md — Q1 pptx, Q2 sandboxed dev, Q4 context-gated tools
- ✅ TASKS.md — 6 open tasks (TASK-001 through TASK-006)
- ✅ DECISIONS.md — template with frontmatter schema
- ✅ BUGS — GitHub Issues (existing, no markdown file)

## FRAMEWORK-006 — Migrate studygram-app docs to id+name+url pattern

---
id: FRAMEWORK-006
title: "Migrate studygram-app docs to id+name+url pattern"
description: "The actual TASKS.md, ROADMAP.md, DECISIONS.md items still use old format (IDs only, no name/url). Migrate them."
phase: "Phase 1 — Proven in studygram-app"
status: "In Progress"
priority: "P1"
related_decisions:
  - id: DEC-002
    name: "Adopt the OKF v0.2 pattern with product-doc extensions"
    url: /DECISIONS.md#DEC-002
last_updated: 2026-08-12
---

**What needs migration:**
- TASKS.md: `roadmap_item: Q4 — Context-gated tools/skills` → `roadmap_item: { id, name, url }`
- TASKS.md: `depends_on: TASK-001` → `depends_on: [{ id, name, url }]`
- TASKS.md: Add `description` field to YAML (currently prose-only)
- ROADMAP.md: Add frontmatter (currently prose-only sections)
- ROADMAP.md: Add `related_tasks` with id+name+url
- DECISIONS.md: Add frontmatter to DEC-001 (currently markdown-body only)

## FRAMEWORK-007 — Add frontmatter to VISION.md themes

---
id: FRAMEWORK-007
title: "Add frontmatter to VISION.md themes"
description: "Studygram's VISION.md (not yet written) needs per-theme frontmatter with cross-links to ROADMAP items"
phase: "Phase 1 — Proven in studygram-app"
status: "Deferred"
priority: "P2"
last_updated: 2026-08-12
---

**Note:** studygram-app's VISION.md hasn't been written yet. When it is, each theme should have frontmatter with `related_roadmap_items` (id+name+url).

**Related:**
- studygram-app TASK-006

## FRAMEWORK-008 — Auto-run reconcile skills on doc changes

---
id: FRAMEWORK-008
title: "Auto-run reconcile skills on doc changes"
description: "GitHub Actions that watch doc files and auto-run the relevant /reconcile skill"
phase: "Phase 2 — Automation"
status: "Deferred"
priority: "P1"
last_updated: 2026-08-12
---

*Phase 2 — Automation (Deferred). When manual skill invocation becomes a pain, automate.*

**Triggers:**
- PR opens touching `TASKS.md` → run `/tasks reconcile` as a check
- PR opens touching `ROADMAP.md` → run `/roadmap reconcile`
- Commit touches `DECISIONS.md` → run `/decisions reconcile`

**Blocker:** Needs Claude in CI (GitHub Action that runs Claude Code headless).

## FRAMEWORK-009 — Wire Fider or GitHub Discussions for ROADMAP proposals

---
id: FRAMEWORK-009
title: "Wire Fider or GitHub Discussions for ROADMAP proposals"
description: "Public intake for roadmap proposals (vote, comment) that sync to the repo"
phase: "Phase 2 — Automation"
status: "Deferred"
priority: "P2"
last_updated: 2026-08-12
---

**Options:**
- **Fider** (self-hosted OSS) — purpose-built for roadmap voting, better UX, new infra to maintain
- **GitHub Discussions** — zero new infra, clunkier UX, native to the repo

**Open decision:** Which tool? (Lean: GitHub Discussions for zero infra initially)

## FRAMEWORK-010 — Adapter-specific external issue sync

---
id: FRAMEWORK-010
title: "Adapter-specific external issue sync"
description: "Optional integration that mirrors GitHub Issues into a consumer product's operational datastore; not part of the VEF Core."
phase: "Phase 2 — Automation"
status: "Deferred"
priority: "P3"
last_updated: 2026-08-13
---

GitHub Issues are VEF's canonical external bug reference. A consumer may mirror issues into its own operational datastore, but that adapter belongs to the consumer and must not be represented as a VEF requirement or a second canonical bug ledger.

## FRAMEWORK-011 — Make skills portable across repos

---
id: FRAMEWORK-011
title: "Make skills portable across repos"
description: "Extract the skill definitions into reusable templates that any repo can adopt"
phase: "Phase 3 — Generalization"
status: "Completed"
priority: "P2"
related_tasks:
  - id: TASK-001
    name: "Publish to npm + rename local repo dir (low priority)"
    url: /TASKS.md#TASK-001
last_updated: 2026-08-12
---

*Phase 3 — Generalization. Once the framework is proven in studygram-app, generalize it for other repos.*

**Approach (shipped):**
- ✅ NPM package — `npm install vibe-engineering-framework`, `vef init` scaffolds docs + skills
- Git submodule — `vibe-engineering-framework` as a submodule, skills symlinked
- GitHub template repo — fork/copy to start a new project

## FRAMEWORK-012 — CLI to scaffold docs in a new repo

---
id: FRAMEWORK-012
title: "CLI to scaffold docs in a new repo"
description: "npx vibe-engineering-framework init creates VISION/ARCHITECTURE/ROADMAP/TASKS/DECISIONS + skills"
phase: "Phase 3 — Generalization"
status: "Completed"
priority: "P3"
last_updated: 2026-08-12
---

`npx vibe-engineering-framework init` creates VISION/ARCHITECTURE/ROADMAP/TASKS/DECISIONS/LOG/INDEX/CLAUDE/AGENTS + the five Claude Code skills. Shipped as the `vef` CLI (`init`, `migrate`, `validate`, `doctor`).

## FRAMEWORK-013 — Auto-derive ARCHITECTURE.md from code

---
id: FRAMEWORK-013
title: "Auto-derive ARCHITECTURE.md from code"
description: "Skill that scans the codebase and proposes/suggests architecture updates"
phase: "Phase 4 — Advanced"
status: "Deferred"
priority: "P3"
last_updated: 2026-08-12
---

*Phase 4 — Advanced (Deferred). Features that go beyond basic doc management.*

## FRAMEWORK-014 — Link items across multiple repos

---
id: FRAMEWORK-014
title: "Link items across multiple repos"
description: "When a product spans multiple repos (e.g. studygram-app + liteparse), link roadmap items across repos"
phase: "Phase 4 — Advanced"
status: "Deferred"
priority: "P3"
last_updated: 2026-08-12
---

## FRAMEWORK-015 — Render public docs (VISION, ROADMAP, BUGS) as a website

---
id: FRAMEWORK-015
title: "Render public docs (VISION, ROADMAP, BUGS) as a website"
description: "GitHub Pages or similar that renders the public docs from markdown"
phase: "Phase 4 — Advanced"
status: "Deferred"
priority: "P3"
last_updated: 2026-08-12
---

## FRAMEWORK-016 — Obsidian plugin to view and interact with framework docs

---
id: FRAMEWORK-016
title: "Obsidian plugin to view and interact with framework docs"
description: "A TypeScript plugin that reads the YAML-frontmatter docs and renders structured views (task board, roadmap timeline, decision log) plus a graph view of the ROADMAP↔TASK↔DECISION topology"
phase: "Phase 4 — Advanced"
status: "Deferred"
priority: "P3"
last_updated: 2026-08-12
---

A local-first UI head for the framework, building on Obsidian's graph view + wikilink model:
- **Structured views** — task board, roadmap timeline, decision log rendered from frontmatter
- **Graph view** — the `id + name + url` cross-links become Obsidian edges; the ROADMAP↔TASK↔DECISION topology is traversable both directions (mirrors the bidirectional linking the skills already enforce)
- **Inline actions** — mark tasks complete, supersede decisions, from the UI
- **Repo sync** — writes back to the canonical markdown source

**Why deferred:** the framework's source of truth is the markdown + skills; a UI is additive, not foundational. Build only after the schemas stabilize and after FRAMEWORK-015 clarifies which views belong on the web vs. in a local-first tool. The OKF alignment (DEC-002) matters here: the plugin consumes the same frontmatter OKF-compliant tools read, so it is a consumer of the format, not a parallel structure.

**Related:**
- FRAMEWORK-015 (public docs rendering — the adjacent web-rendering line)
- DEC-002 (OKF adoption — the plugin is an OKF consumer)

---

## FRAMEWORK-017 — Build the VEF Integrity Core

---
id: FRAMEWORK-017
title: "Build the VEF Integrity Core"
description: "Make VEF's documented project model deterministically coherent through one schema, typed graph validation, safe mutations, tests, and CI dogfooding."
phase: "Phase 0 — Integrity Core"
status: "Completed"
priority: "P0"
related_tasks:
  - id: TASK-004
    name: "Add Integrity Core test suite"
    url: /TASKS.md#TASK-004
  - id: TASK-005
    name: "Gate the Integrity Core in CI"
    url: /TASKS.md#TASK-005
  - id: TASK-006
    name: "Define canonical schema and typed relationship model"
    url: /TASKS.md#TASK-006
  - id: TASK-007
    name: "Align filename conventions and provenance"
    url: /TASKS.md#TASK-007
  - id: TASK-008
    name: "Harden /apply migration trust boundaries"
    url: /TASKS.md#TASK-008
  - id: TASK-010
    name: "Enforce durable-memory catalogue coherence"
    url: /TASKS.md#TASK-010
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. Validation knows allowed source/target types, inverse fields, cardinality, duplicates, cycles, malformed references, scalar types, heading/frontmatter agreement, and the canonical durable-memory catalogue. Tests and CI enforce the contract on Ubuntu and Windows. `/apply` now uses proposal-first migration boundaries: untrusted evidence, explicit optional sources and writes, classified memory, blocked orphan invention, and deterministic staged validation.

The work also resolves dogfooding drift (filenames, stale claims, templates, provenance), makes strict validation a complete CI contract, and makes migration conservative when evidence is uncertain.

---

## FRAMEWORK-018 — Expose deterministic project queries

---
id: FRAMEWORK-018
title: "Expose deterministic project queries"
description: "Make the project graph useful without an LLM through CLI list, show, reference, rationale, graph, and search commands."
phase: "Phase 1 — Queryable Project Memory"
status: "Completed"
priority: "P1"
related_tasks:
  - id: TASK-009
    name: "Design and implement deterministic query commands"
    url: /TASKS.md#TASK-009
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. `vef list`, `show`, `refs`, `why`, `graph`, and `search` derive records and typed edges from the canonical parser and relationship declarations used by integrity checks. Default text output serves humans; versioned JSON serves scripts and CI. Rationale traversal is rule-based and read-only, so the model remains useful where no agent is available.

---

## Summary

| Phase | Status | Items |
|---|---|---|
| Phase 0 — Integrity Core | ✅ Completed | FRAMEWORK-017 |
| Phase 0 — Foundation | ✅ Completed | FRAMEWORK-001, -002, -003 |
| Phase 1 — Queryable Project Memory | ✅ Completed | FRAMEWORK-018 |
| Phase 1 — Proven in studygram-app | 🔄 In Progress | FRAMEWORK-004, -005 (done); FRAMEWORK-006 (in progress); FRAMEWORK-007 (deferred) |
| Phase 2 — Automation | ⏸ Deferred | FRAMEWORK-008, -009, -010 (consumer adapter only) |
| Phase 3 — Generalization | ✅ Completed | FRAMEWORK-011, -012 (CLI + templates shipped) |
| Phase 4 — Advanced | ⏸ Deferred | FRAMEWORK-013, -014, -015, -016 |

**Next priority:** No additional framework milestone is currently committed. FRAMEWORK-006 tracks consumer-specific adoption work in `studygram-app`; it may provide compatibility evidence but is not this framework's next priority.

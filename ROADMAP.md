# ROADMAP.md

**vibe-coding-engineering Framework Roadmap** — Directional themes for the documentation framework.

Last updated: 2026-08-12

---

## Roadmap item schema

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

## Phase 0 — Foundation

**Status:** Completed (2026-08-12)

What was built to establish the framework.

### FRAMEWORK-001: Core docs definition
- **id:** FRAMEWORK-001
- **title:** Define the core documents
- **description:** VISION.md, CLAUDE.md, AGENTS.md, README.md created
- **phase:** Phase 0
- **status:** Completed
- **priority:** P0
- **last_updated:** 2026-08-12

Defined the framework's purpose, structure, and agent/skill model:
- VISION.md — the problem (doc rot), the 3-layer solution (content/discipline/trigger), target user, success criteria
- CLAUDE.md — repo-level instructions, schemas, skill invocation guide
- AGENTS.md — agent profiles, tool catalog, skill catalog, context-gating framework
- README.md — entry point

### FRAMEWORK-002: Skills documented
- **id:** FRAMEWORK-002
- **title:** Document the four management skills
- **description:** /tasks, /roadmap, /bugs, /decisions schemas and invocation patterns
- **phase:** Phase 0
- **status:** Completed
- **priority:** P0
- **last_updated:** 2026-08-12

Documented the four skills that enforce structure and prevent drift:
- `/tasks` — Manage TASKS.md (list, add, update, complete, reconcile)
- `/roadmap` — Manage ROADMAP.md (list, add, graduate, reconcile)
- `/bugs` — Manage GitHub Issues + product_failures (list, create, resolve, sync)
- `/decisions` — Manage DECISIONS.md (list, add, update, supersede, reconcile)

### FRAMEWORK-003: Related-item pattern standardized
- **id:** FRAMEWORK-003
- **title:** Standardize id+name+url related-item pattern
- **description:** All cross-doc references use id + name + url (relative for same-repo, absolute for external)
- **phase:** Phase 0
- **status:** Completed
- **priority:** P1
- **last_updated:** 2026-08-12

Established the canonical pattern for cross-referencing items between docs:
```yaml
related_tasks:
  - id: TASK-002
    name: "Implement activeWhen filter in buildToolset"
    url: /TASKS.md#TASK-002
```

---

## Phase 1 — Proven in studygram-app

**Status:** In Progress

The framework is being proven in a real product (studygram-app). This phase tracks the implementation.

### FRAMEWORK-004: Skills built and tested in studygram-app
- **id:** FRAMEWORK-004
- **title:** Build and test the four skills in studygram-app
- **description:** All four skills created as SKILL.md files in studygram-app/.claude/skills/
- **phase:** Phase 1
- **status:** Completed
- **priority:** P0
- **last_updated:** 2026-08-12

- ✅ `/tasks` skill — `.claude/skills/tasks/SKILL.md`
- ✅ `/roadmap` skill — `.claude/skills/roadmap/SKILL.md`
- ✅ `/bugs` skill — `.claude/skills/bugs/SKILL.md`
- ✅ `/decisions` skill — `.claude/skills/decisions/SKILL.md`
- ✅ Tested `/tasks list` — works correctly

### FRAMEWORK-005: Core docs created in studygram-app
- **id:** FRAMEWORK-005
- **title:** Create ROADMAP.md, TASKS.md, DECISIONS.md in studygram-app
- **description:** Migrated roadmap from memory, seeded tasks from task list, created DECISIONS.md template
- **phase:** Phase 1
- **status:** Completed
- **priority:** P0
- **last_updated:** 2026-08-12

- ✅ ROADMAP.md — Q1 pptx, Q2 sandboxed dev, Q4 context-gated tools
- ✅ TASKS.md — 6 open tasks (TASK-001 through TASK-006)
- ✅ DECISIONS.md — template with frontmatter schema
- ✅ BUGS — GitHub Issues (existing, no markdown file)

### FRAMEWORK-006: Schema refinement — apply id+name+url to studygram-app docs
- **id:** FRAMEWORK-006
- **title:** Migrate studygram-app docs to id+name+url pattern
- **description:** The actual TASKS.md, ROADMAP.md, DECISIONS.md items still use old format (IDs only, no name/url). Migrate them.
- **phase:** Phase 1
- **status:** In Progress
- **priority:** P1
- **last_updated:** 2026-08-12

**What needs migration:**
- TASKS.md: `roadmap_item: Q4 — Context-gated tools/skills` → `roadmap_item: { id, name, url }`
- TASKS.md: `depends_on: TASK-001` → `depends_on: [{ id, name, url }]`
- TASKS.md: Add `description` field to YAML (currently prose-only)
- ROADMAP.md: Add frontmatter (currently prose-only sections)
- ROADMAP.md: Add `related_tasks` with id+name+url
- DECISIONS.md: Add frontmatter to DEC-001 (currently markdown-body only)

### FRAMEWORK-007: VISION.md frontmatter for studygram-app
- **id:** FRAMEWORK-007
- **title:** Add frontmatter to VISION.md themes
- **description:** Studygram's VISION.md (not yet written) needs per-theme frontmatter with cross-links to ROADMAP items
- **phase:** Phase 1
- **status:** Deferred
- **priority:** P2
- **last_updated:** 2026-08-12

**Note:** studygram-app's VISION.md hasn't been written yet. When it is, each theme should have frontmatter with `related_roadmap_items` (id+name+url).

**Related:**
- studygram-app TASK-006

---

## Phase 2 — Automation

**Status:** Deferred

When manual skill invocation becomes a pain, automate.

### FRAMEWORK-008: GitHub Actions auto-reconcile
- **id:** FRAMEWORK-008
- **title:** Auto-run reconcile skills on doc changes
- **description:** GitHub Actions that watch doc files and auto-run the relevant /reconcile skill
- **phase:** Phase 2
- **status:** Deferred
- **priority:** P1
- **last_updated:** 2026-08-12

**Triggers:**
- PR opens touching `TASKS.md` → run `/tasks reconcile` as a check
- PR opens touching `ROADMAP.md` → run `/roadmap reconcile`
- Commit touches `DECISIONS.md` → run `/decisions reconcile`

**Blocker:** Needs Claude in CI (GitHub Action that runs Claude Code headless).

### FRAMEWORK-009: ROADMAP intake tool integration
- **id:** FRAMEWORK-009
- **title:** Wire Fider or GitHub Discussions for ROADMAP proposals
- **description:** Public intake for roadmap proposals (vote, comment) that sync to the repo
- **phase:** Phase 2
- **status:** Deferred
- **priority:** P2
- **last_updated:** 2026-08-12

**Options:**
- **Fider** (self-hosted OSS) — purpose-built for roadmap voting, better UX, new infra to maintain
- **GitHub Discussions** — zero new infra, clunkier UX, native to the repo

**Open decision:** Which tool? (Lean: GitHub Discussions for zero infra initially)

### FRAMEWORK-010: BUGS bidirectional sync
- **id:** FRAMEWORK-010
- **title:** Auto-sync GitHub Issues ↔ product_failures
- **description:** Webhook or cron that keeps product_failures table in sync with GitHub Issues
- **phase:** Phase 2
- **status:** Deferred
- **priority:** P2
- **last_updated:** 2026-08-12

**Flow:**
- GitHub Issue created with `bug` label → webhook → insert product_failures row
- GitHub Issue closed → webhook → update product_failures status
- product_failures row resolved manually → (optional) close GitHub Issue

---

## Phase 3 — Generalization

**Status:** Deferred

Once the framework is proven in studygram-app, generalize it for other repos.

### FRAMEWORK-011: Package skills as reusable templates
- **id:** FRAMEWORK-011
- **title:** Make skills portable across repos
- **description:** Extract the skill definitions into reusable templates that any repo can adopt
- **phase:** Phase 3
- **status:** Deferred
- **priority:** P2
- **last_updated:** 2026-08-12

**Approach options:**
- Git submodule — `vibe-coding-engineering` as a submodule, skills symlinked
- NPM package — `npm install vibe-coding-engineering`, copy skills on postinstall
- GitHub template repo — fork/copy to start a new project

### FRAMEWORK-012: Framework CLI
- **id:** FRAMEWORK-012
- **title:** CLI to scaffold docs in a new repo
- **description:** `npx vibe-coding-engineering init` creates VISION/ARCHITECTURE/ROADMAP/TASKS/DECISIONS + skills
- **phase:** Phase 3
- **status:** Deferred
- **priority:** P3
- **last_updated:** 2026-08-12

---

## Phase 4 — Advanced

**Status:** Deferred

Features that go beyond basic doc management.

### FRAMEWORK-013: ARCHITECTURE.md derivation
- **id:** FRAMEWORK-013
- **title:** Auto-derive ARCHITECTURE.md from code
- **description:** Skill that scans the codebase and proposes/suggests architecture updates
- **phase:** Phase 4
- **status:** Deferred
- **priority:** P3
- **last_updated:** 2026-08-12

### FRAMEWORK-014: Cross-repo linking
- **id:** FRAMEWORK-014
- **title:** Link items across multiple repos
- **description:** When a product spans multiple repos (e.g. studygram-app + liteparse), link roadmap items across repos
- **phase:** Phase 4
- **status:** Deferred
- **priority:** P3
- **last_updated:** 2026-08-12

### FRAMEWORK-015: Public docs rendering
- **id:** FRAMEWORK-015
- **title:** Render public docs (VISION, ROADMAP, BUGS) as a website
- **description:** GitHub Pages or similar that renders the public docs from markdown
- **phase:** Phase 4
- **status:** Deferred
- **priority:** P3
- **last_updated:** 2026-08-12

---

## Summary

| Phase | Status | Items |
|---|---|---|
| Phase 0 — Foundation | ✅ Completed | FRAMEWORK-001, -002, -003 |
| Phase 1 — Proven in studygram-app | 🔄 In Progress | FRAMEWORK-004, -005 (done); FRAMEWORK-006 (in progress); FRAMEWORK-007 (deferred) |
| Phase 2 — Automation | ⏸ Deferred | FRAMEWORK-008, -009, -010 |
| Phase 3 — Generalization | ⏸ Deferred | FRAMEWORK-011, -012 |
| Phase 4 — Advanced | ⏸ Deferred | FRAMEWORK-013, -014, -015 |

**Next priority:** FRAMEWORK-006 (migrate studygram-app docs to id+name+url pattern)

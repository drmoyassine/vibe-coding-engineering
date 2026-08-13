# TASKS.md

**vibe-engineering-framework Tasks** — Concrete work breakdown for the framework itself. Directional themes live in ROADMAP.md (FRAMEWORK-XXX); decisions live in DECISIONS.md.

Last updated: 2026-08-13

---

## Task schema

Each task uses YAML frontmatter. `src/lib/schemas.mjs` is the canonical machine-readable field contract delivered by FRAMEWORK-017. Related references follow the **`id + name + url`** pattern (relative URL for same-repo, absolute for cross-repo):

```yaml
---
id: TASK-XXX
title: Short description
description: One-line summary
status: pending | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
roadmap_item:                 # SINGULAR object — a task belongs to one roadmap item (omit if unlinked)
  id: FRAMEWORK-XXX
  name: "Roadmap item title"
  url: /ROADMAP.md#FRAMEWORK-XXX
assignee:                     # name, or empty
depends_on: []                # array of task refs
related_decisions: []         # array of decision refs (DECISIONS, not LOG)
last_updated: 2026-08-12
---

Full description, acceptance criteria, implementation notes.
```

`roadmap_item` ↔ ROADMAP `related_tasks` must be bidirectional.

<!-- VEF:ITEMS -->

## Summary

| ID | Title | Status | Priority |
|---|---|---|---|
| TASK-001 | Publish the VEF CLI package to npm | completed | P0 |
| TASK-002 | Write ARCHITECTURE.md | ✅ completed | P2 |
| TASK-003 | Install 4 management skills (dogfood) | ✅ completed | P2 |
| TASK-004 | Integrity Core test suite | completed | P0 |
| TASK-005 | Integrity Core CI gate | completed | P0 |
| TASK-006 | Canonical schema and typed relationship model | completed | P0 |
| TASK-007 | Filename conventions and provenance | completed | P0 |
| TASK-008 | /apply migration trust boundaries | completed | P0 |
| TASK-009 | Deterministic query commands | completed | P1 |
| TASK-010 | Durable-memory catalogue coherence | completed | P0 |
| TASK-011 | Canonical item storage and ledger projection contract | completed | P0 |
| TASK-012 | Canonical record store and ledger projector | completed | P0 |
| TASK-013 | Recoverable transaction engine | pending | P0 |
| TASK-014 | `vef create` and `vef update` | pending | P0 |
| TASK-015 | Agent-adapter migration and mutation tests | pending | P1 |
| TASK-016 | Rename the local repository directory | pending | P3 |
| TASK-017 | Public VEF release and launch narrative | completed | P0 |
| TASK-018 | Adoption examples and public feedback loop | pending | P0 |
| TASK-019 | Public launch and distribution plan | pending | P0 |
| TASK-024 | Consumer-neutral framework boundary | completed | P0 |
| TASK-025 | Human review artifact and comment contract | in-progress | P1 |
| TASK-026 | Lightweight `vef review` workspace | pending | P1 |
| TASK-027 | Obsidian and wiki review adapters | pending | P2 |
| TASK-028 | One-command doctor remediation | completed | P0 |
| TASK-029 | Core enforcement and adapter separation | completed | P0 |
| TASK-030 | Simplify the complete VEF adoption lifecycle | completed | P0 |
| TASK-031 | Release and prove the VEF 0.2 adoption lifecycle | in-progress | P0 |

**Next priority:** Complete TASK-031 by releasing and proving DEC-009's `0.2.0` two-command lifecycle. Only then do TASK-018 and TASK-019 resume adoption examples, feedback, and distribution. TASK-025 then TASK-026 continue the parallel lightweight human-review track. TASK-013 through TASK-015 remain deferred under FRAMEWORK-022; TASK-016 is cosmetic; TASK-027 remains adapter-specific follow-up work. Consumer and commercial priorities are tracked only in their owning repositories.

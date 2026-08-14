# ROADMAP.md

**vibe-engineering-framework Roadmap** — Directional commitments for the project-memory framework and its public ecosystem.

Last updated: 2026-08-14

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
    url: https://github.com/example/consumer-repo/blob/main/TASKS.md#TASK-XXX
related_decisions:
  - id: DEC-XXX
    name: "Decision title"
    url: /DECISIONS.md#DEC-XXX
modified:                      # transaction-managed actor/time provenance
  by: "agent/session"
  at: "2026-08-14T00:00:00Z"
last_updated: 2026-08-12
---
```

<!-- VEF:ITEMS -->

## Summary

| Phase | Status | Items |
|---|---|---|
| Phase 0 — Integrity Core | ✅ Completed | FRAMEWORK-017 |
| Phase 0 — Foundation | ✅ Completed | FRAMEWORK-001, -002, -003 |
| Phase 1 — Queryable Project Memory | ✅ Completed | FRAMEWORK-018 |
| Phase 2 — Public Launch | 🔄 In Progress | FRAMEWORK-020 |
| Phase 2 — Evidence-Gated Public Launch | 🔄 In Progress | FRAMEWORK-025 |
| Phase 2 — Canonical Record Storage | ✅ Completed | FRAMEWORK-019 |
| Phase 2 — Human Review | 🔄 In Progress | FRAMEWORK-015 (parallel, non-blocking contract and workspace) |
| Phase 3 — Transactional Project Memory | ✅ Completed | FRAMEWORK-022 |
| Phase 3 — Transactional Project Memory | 🔄 In Progress | FRAMEWORK-023 (0.3.1 hardening) |
| Phase 1 — Consumer Validation | ✅ Core completed | FRAMEWORK-004, -005, -006 completed; FRAMEWORK-007 deferred |
| Phase 2 — Automation | ⏸ Deferred | FRAMEWORK-008, -009, -010 (consumer adapter only) |
| Phase 3 — Generalization | ✅ Completed | FRAMEWORK-011, -012 (CLI + templates shipped) |
| Phase 4 — Schema Interoperability | ⏸ Deferred | FRAMEWORK-024 |
| Phase 4 — Advanced | ⏸ Deferred | FRAMEWORK-013, -014, -016 |
| Phase 5 — Extensibility | ⏸ Deferred | FRAMEWORK-026 |

**Next priority:** FRAMEWORK-023 is the immediate release gate: TASK-032 through TASK-034 are complete, and TASK-035 must
now release and publicly prove 0.3.1. FRAMEWORK-025
may freeze its evaluation protocol in parallel, but evaluation execution waits for that hotfix and its published evidence
gates broad promotion under FRAMEWORK-020. FRAMEWORK-024 and FRAMEWORK-015 follow as parallel interoperability and human-
review tracks. FRAMEWORK-026 remains evidence-gated and deferred. Named consumer implementations and commercial programs
remain canonical in their own repositories rather than VEF's roadmap.

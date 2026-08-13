---
id: FRAMEWORK-006
title: Migrate consumer documents to the canonical relationship pattern
description: Migrate an adopting repository's legacy relationship values to typed id+name+url references.
phase: Phase 1 — Consumer validation
status: In Progress
priority: P1
related_decisions:
  - id: DEC-002
    name: Adopt the OKF v0.2 pattern with product-doc extensions
    url: /DECISIONS.md#DEC-002
last_updated: '2026-08-12'
---
# FRAMEWORK-006 — Migrate consumer documents to the canonical relationship pattern

**What needs migration:**
- TASKS.md: `roadmap_item: Q4 — Context-gated tools/skills` → `roadmap_item: { id, name, url }`
- TASKS.md: `depends_on: TASK-001` → `depends_on: [{ id, name, url }]`
- TASKS.md: Add `description` field to YAML (currently prose-only)
- ROADMAP.md: Add frontmatter (currently prose-only sections)
- ROADMAP.md: Add `related_tasks` with id+name+url
- DECISIONS.md: Add frontmatter to DEC-001 (currently markdown-body only)

---
id: TASK-038
title: Decide and migrate roadmap-to-vision cardinality
description: >-
  Decide whether roadmap items may serve multiple vision themes and implement a backward-compatible pre-1.0 migration if
  accepted.
status: pending
priority: P1
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
roadmap_item:
  id: FRAMEWORK-024
  name: Ship schema and editor interoperability
  url: /ROADMAP.md#FRAMEWORK-024
depends_on:
  - id: TASK-037
    name: Ship versioned JSON Schemas and vef schema
    url: /TASKS.md#TASK-037
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
modified:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
---
# TASK-038 — Decide and migrate roadmap-to-vision cardinality

Record a durable decision before changing the model. Evaluate singular `vision_theme` against plural `vision_themes`, inverse-link semantics, query behavior, generated ledgers, adapters, JSON Schema, and existing consumer migration.

If plural is accepted, provide an idempotent migration from one object to an array, preserve strict validation throughout, and document compatibility before 1.0. Do not silently change cardinality in place.

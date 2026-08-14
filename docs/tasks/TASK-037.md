---
id: TASK-037
title: Ship versioned JSON Schemas and vef schema
description: >-
  Provide editor-compatible record schemas and deterministic schema discovery without overstating record-local
  validation.
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
  - id: TASK-035
    name: Release and publicly prove VEF 0.3.1
    url: /TASKS.md#TASK-035
related_decisions:
  - id: DEC-002
    name: Adopt the OKF v0.2 pattern (index.md, log.md, actor convention, trust signals) with product-doc extensions
    url: /DECISIONS.md#DEC-002
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
modified:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
---
# TASK-037 — Ship versioned JSON Schemas and vef schema

Generate and publish versioned JSON Schema artifacts for task, roadmap, decision, vision, references, and provenance from the authoritative executable schema. Add `vef schema`, `vef schema task`, and JSON output suitable for editor configuration and external tooling.

Package-export and artifact-drift tests must prove the JSON Schemas match the executable field contract. Documentation must state that only `vef check` can validate graph-wide inverses, targets, duplicates, cycles, projections, and catalogue coherence.

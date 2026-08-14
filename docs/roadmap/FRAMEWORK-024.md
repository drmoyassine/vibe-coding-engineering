---
id: FRAMEWORK-024
title: Ship schema and editor interoperability
description: >-
  Expose versioned JSON Schemas and a discoverable schema CLI while keeping graph-wide validation authoritative in vef
  check.
phase: Phase 4 — Schema Interoperability
status: Deferred
priority: P1
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
related_decisions:
  - id: DEC-002
    name: Adopt the OKF v0.2 pattern (index.md, log.md, actor convention, trust signals) with product-doc extensions
    url: /DECISIONS.md#DEC-002
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
related_tasks:
  - id: TASK-037
    name: Ship versioned JSON Schemas and vef schema
    url: /TASKS.md#TASK-037
  - id: TASK-038
    name: Decide and migrate roadmap-to-vision cardinality
    url: /TASKS.md#TASK-038
modified:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
---
# FRAMEWORK-024 — Ship schema and editor interoperability

The executable schema and package export serve JavaScript integrations, but they do not satisfy the original editor/tooling requirement. This track ships versioned JSON Schema artifacts and `vef schema` discovery, explicitly limiting JSON Schema to record-local structure while `vef check` remains authoritative for inverse links, duplicates, cycles, projections, and catalogue coherence.

The roadmap-to-vision cardinality question is resolved here through a durable decision and backward-compatible migration rather than an incidental field edit.

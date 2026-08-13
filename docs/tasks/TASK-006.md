---
id: TASK-006
title: Define canonical schema and typed relationship model
description: >-
  Replace duplicated schema descriptions with one machine-readable model that defines fields, references, inverse links,
  cardinality, and lifecycle constraints.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: Build the VEF Integrity Core
  url: /ROADMAP.md#FRAMEWORK-017
assignee: null
depends_on: []
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-006 — Define canonical schema and typed relationship model

Completed 2026-08-13. `src/lib/schemas.mjs` is the executable schema/relationship definition used by validation and graph traversal. It defines reference targets, cardinality, inverse fields, scalar constraints, and provenance shape; validation now enforces the associated invariants.

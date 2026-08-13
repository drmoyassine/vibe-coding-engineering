---
id: FRAMEWORK-017
title: Build the VEF Integrity Core
description: >-
  Make VEF's documented project model deterministically coherent through one schema, typed graph validation, safe
  mutations, tests, and CI dogfooding.
phase: Phase 0 — Integrity Core
status: Completed
priority: P0
related_tasks:
  - id: TASK-004
    name: Add Integrity Core test suite
    url: /TASKS.md#TASK-004
  - id: TASK-005
    name: Gate the Integrity Core in CI
    url: /TASKS.md#TASK-005
  - id: TASK-006
    name: Define canonical schema and typed relationship model
    url: /TASKS.md#TASK-006
  - id: TASK-007
    name: Align filename conventions and provenance
    url: /TASKS.md#TASK-007
  - id: TASK-008
    name: Harden /apply migration trust boundaries
    url: /TASKS.md#TASK-008
  - id: TASK-010
    name: Enforce durable-memory catalogue coherence
    url: /TASKS.md#TASK-010
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# FRAMEWORK-017 — Build the VEF Integrity Core

Completed 2026-08-13. Validation knows allowed source/target types, inverse fields, cardinality, duplicates, cycles, malformed references, scalar types, heading/frontmatter agreement, and the canonical durable-memory catalogue. Tests and CI enforce the contract on Ubuntu and Windows. `/apply` now uses proposal-first migration boundaries: untrusted evidence, explicit optional sources and writes, classified memory, blocked orphan invention, and deterministic staged validation.

The work also resolves dogfooding drift (filenames, stale claims, templates, provenance), makes strict validation a complete CI contract, and makes migration conservative when evidence is uncertain.

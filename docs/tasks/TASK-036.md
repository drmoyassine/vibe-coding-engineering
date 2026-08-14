---
id: TASK-036
title: Classify and implement isolated deterministic repairs
description: >-
  Distinguish mechanically safe repairs from semantic reconciliation and permit partial work only when isolation is
  provable.
status: pending
priority: P1
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
roadmap_item:
  id: FRAMEWORK-023
  name: Harden public transactional authoring
  url: /ROADMAP.md#FRAMEWORK-023
depends_on:
  - id: TASK-035
    name: Release and publicly prove VEF 0.3.1
    url: /TASKS.md#TASK-035
related_decisions:
  - id: DEC-009
    name: Make setup and check the complete public adoption lifecycle
    url: /DECISIONS.md#DEC-009
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
modified:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
---
# TASK-036 — Classify and implement isolated deterministic repairs

Define an operation matrix: always mechanical repairs such as ledger projection and managed-CI refresh; explicitly authoritative repairs such as title/heading selection; and ambiguous repairs such as conflicting IDs, missing semantic relationships, or record-type changes.

Doctor must show safe candidate repairs, interpretation blockers, and expected residual state. Independent partial repair is allowed only when the transaction engine proves the operation cannot leave a harder canonical recovery state. Arbitrary best-effort repair remains out of scope.

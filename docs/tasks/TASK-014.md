---
id: TASK-014
title: Expose vef create and vef update
description: >-
  Provide two portable public commands over the transaction engine for record creation and combined field/relationship
  updates.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-022
  name: Build transactional project mutations
  url: /ROADMAP.md#FRAMEWORK-022
assignee: Codex
depends_on:
  - id: TASK-013
    name: Build the recoverable transaction engine
    url: /TASKS.md#TASK-013
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
last_updated: '2026-08-14'
modified:
  by: agent/codex
  at: '2026-08-14T15:20:56.169Z'
---
# TASK-014 — Expose vef create and vef update

Completed 2026-08-14. The CLI exposes preview-first vef create and vef update over the shared planner. Create accepts complete records and initial relationships; update combines scalar, body, and add/remove/set relationship changes. --write is explicit, --actor stamps provenance, JSON output is available, and adapter batch proposals remain a create submode rather than another top-level mutation command.

The stable package exports expose the executable schema and transaction API. Exceptional recover is hidden from normal help but every unresolved-journal diagnostic prints the exact forward/rollback commands.

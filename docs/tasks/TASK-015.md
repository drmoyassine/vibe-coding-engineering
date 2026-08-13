---
id: TASK-015
title: Migrate agent adapters and complete mutation tests
description: >-
  Make shipped skills use the shared mutation contract for mechanical edits and prove the contract across failures and
  platforms.
status: pending
priority: P1
roadmap_item:
  id: FRAMEWORK-022
  name: Build transactional project mutations
  url: /ROADMAP.md#FRAMEWORK-022
assignee: null
depends_on:
  - id: TASK-014
    name: Expose vef create and vef update
    url: /TASKS.md#TASK-014
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-015 — Migrate agent adapters and complete mutation tests

Adapters continue interpreting intent and authoring semantic prose, but delegate IDs, lifecycle fields, graph links, projection, and validated writes to the shared core. Tests cover dry runs, idempotency, invalid transitions, inverse updates, malformed starting state, interrupted writes, migration compatibility, and Windows/Linux behavior.

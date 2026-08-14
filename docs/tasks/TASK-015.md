---
id: TASK-015
title: Migrate agent adapters and complete mutation tests
description: >-
  Make shipped skills use the shared mutation contract for mechanical edits and prove the contract across failures and
  platforms.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-022
  name: Build transactional project mutations
  url: /ROADMAP.md#FRAMEWORK-022
assignee: Codex
depends_on:
  - id: TASK-014
    name: Expose vef create and vef update
    url: /TASKS.md#TASK-014
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
# TASK-015 — Migrate agent adapters and complete mutation tests

Completed 2026-08-14 in the same release boundary as TASK-014. The tasks, roadmap, decisions, and apply adapters now author semantic proposal data and delegate canonical Markdown, IDs, lifecycle fields, provenance, inverse links, ledgers, validation, journaling, and recovery to the shared core. /apply returns proposedOperations instead of proposedItemFiles and uses one batch transaction for accepted writes.

Tests cover preview/write behavior, batch delegation, idempotency, invalid candidates and starting graphs, inverse closure, stale previews, Windows-style busy destinations, cleanup debris, stale and competing leases, thrown interruptions, hard termination at every write boundary, explicit forward/back recovery, malformed journals, and a 17-record first-pass strict-integrity replay.

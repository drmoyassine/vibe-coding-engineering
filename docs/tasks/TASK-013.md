---
id: TASK-013
title: Build the recoverable transaction engine
description: Plan, validate, preview, and recoverably apply multi-record structural changes without partial graph updates.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-022
  name: Build transactional project mutations
  url: /ROADMAP.md#FRAMEWORK-022
assignee: Codex
depends_on:
  - id: TASK-012
    name: Implement the canonical record store and ledger projector
    url: /TASKS.md#TASK-012
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
  - id: DEC-004
    name: Store canonical items in per-type folders and generate the ledgers
    url: /DECISIONS.md#DEC-004
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
last_updated: '2026-08-14'
modified:
  by: agent/codex
  at: '2026-08-14T15:20:24.671Z'
---
# TASK-013 — Build the recoverable transaction engine

Completed 2026-08-14. The shared library now plans complete multi-record candidates in memory, validates the starting graph and candidate, closes typed inverse relationships, stamps last_updated and modified provenance, and renders minimal canonical-item plus ledger changes.

Before touching project files it writes an immutable versioned manifest, hash-verified before/after content, and additive state markers under .vef/transactions. A renewable token/PID/host/timestamp lease serializes writers without depending on lock deletion. Project-target writes retry Windows busy/access failures without rename-over-open-file behavior; cleanup failures remain warnings.

Interrupted transactions block planning, setup, check, validation, projection, migration, and later mutations until explicit hash-checked roll-forward or rollback. Tests cover thrown interruptions, hard process termination at every write boundary, forward/back recovery, competing writers, stale leases, cleanup debris, busy destinations, stale previews, malformed journals, invalid graphs, idempotency, and path confinement.

---
id: FRAMEWORK-019
title: Adopt canonical per-item storage and ledger projections
description: >-
  Migrate structured records to canonical per-type Markdown files and generate deterministic committed ledgers before
  the public package contract is released.
phase: Phase 2 — Canonical Record Storage
status: Completed
priority: P0
related_tasks:
  - id: TASK-011
    name: Decide canonical item storage and ledger projection contract
    url: /TASKS.md#TASK-011
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
last_updated: '2026-08-13'
---
# FRAMEWORK-019 — Adopt canonical per-item storage and ledger projections

Completed 2026-08-13. DEC-004's per-item storage contract is implemented and dogfooded: canonical records live under `docs/<record-type>/`, collection `_index.md` files own ledger prose, `.vef/storage.json` versions the layout, and root ledgers are deterministic committed projections with drift detection. Fresh projects start on the new layout. Legacy consumers retain read compatibility and safe migration mechanics; DEC-009 now composes those internals behind the public `vef setup` lifecycle. The retired root-directory preview layout is relocated safely. General-purpose transactional writes remain separated into deferred FRAMEWORK-022.

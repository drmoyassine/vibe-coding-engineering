---
id: TASK-012
title: Implement the canonical record store and ledger projector
description: Implement the storage and projection contract accepted by TASK-011, including migration and drift detection.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-019
  name: Adopt canonical per-item storage and ledger projections
  url: /ROADMAP.md#FRAMEWORK-019
assignee: Codex
depends_on:
  - id: TASK-011
    name: Decide canonical item storage and ledger projection contract
    url: /TASKS.md#TASK-011
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
  - id: DEC-004
    name: Store canonical items in per-type folders and generate the ledgers
    url: /DECISIONS.md#DEC-004
last_updated: '2026-08-13'
---
# TASK-012 — Implement the canonical record store and ledger projector

Completed 2026-08-13. One canonical loader now serves validation, queries, projection, doctor, and future mutation work. `.vef/storage.json` activates versioned per-item storage under `docs/`; the advanced `vef migrate` command previews or performs legacy extraction/root-layout relocation, and `vef project` deterministically regenerates the four committed root ledgers. Strict validation rejects projection drift. Legacy queries remain readable during the compatibility window, `vef doctor --fix` is the supported consumer repair path, conflicting partial migrations are blocked, and fresh initialization creates the new layout directly. Migration, root-layout compatibility, drift, clean-init, canonical-query, adapter-preservation, and cross-platform path behavior are covered by automated tests.

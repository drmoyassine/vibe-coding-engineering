---
id: TASK-028
title: Add one-command doctor remediation
description: Collapse the safe post-install consumer migration sequence into an explicitly authorized doctor repair mode.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: Codex
depends_on:
  - id: TASK-012
    name: Implement the canonical record store and ledger projector
    url: /TASKS.md#TASK-012
related_decisions:
  - id: DEC-004
    name: Store canonical items in per-type folders and generate the ledgers
    url: /DECISIONS.md#DEC-004
  - id: DEC-007
    name: Separate core enforcement from agent adapter compatibility
    url: /DECISIONS.md#DEC-007
last_updated: '2026-08-13'
---
# TASK-028 — Add one-command doctor remediation

Completed 2026-08-13. `vef doctor --fix` is the consumer-facing orchestration layer over the migration operations delivered by TASK-012. Plain `vef doctor` remains read-only and suitable for CI; `--fix` is explicit write authorization and does not require users to reproduce the internal sequence manually.

Acceptance criteria:

- preflight the complete storage and relationship candidate before changing the repository;
- create or relocate `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/` as required;
- install missing VEF adapters as a convenience while preserving every existing consumer-owned adapter file;
- regenerate all committed root ledgers from canonical records;
- run strict validation and a final health check automatically;
- preserve the recoverability and no-partial-activation guarantees of the existing migration core;
- clearly report that package acquisition is a bootstrap responsibility, since an obsolete installed binary cannot execute future repair behavior;
- expose the current installed CLI as `npx vef doctor --fix`, and do not claim an npm `@latest` path before TASK-001 publishes the package;
- cover legacy migration, retired-root relocation, already-current state, conflict preflight, and strict final validation with tests.

The implementation preflights the storage graph, required singleton documents, durable-memory catalogue, semantic relationships, and unresolved review flags before structural writes. It delegates to the existing recoverable migration and projector, runs strict validation, and finishes by rerunning the read-only health check. It never commits automatically. Package acquisition remains a bootstrap responsibility because an obsolete CLI cannot execute behavior it does not contain.

TASK-029 corrected the initial adapter coupling: core enforcement and optional adapter compatibility are now separate results, existing adapters are never overwritten, and the former adapter-update flag is retired.

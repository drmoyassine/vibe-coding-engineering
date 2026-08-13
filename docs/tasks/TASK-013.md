---
id: TASK-013
title: Build the recoverable transaction engine
description: Plan, validate, preview, and recoverably apply multi-record structural changes without partial graph updates.
status: pending
priority: P0
roadmap_item:
  id: FRAMEWORK-022
  name: Build transactional project mutations
  url: /ROADMAP.md#FRAMEWORK-022
assignee: null
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
last_updated: '2026-08-13'
---
# TASK-013 — Build the recoverable transaction engine

The engine owns mechanically implied dates, provenance, typed target checks, inverse relationships, minimal candidate diffs, pre-write validation, controlled file replacement, and recovery information. It must not claim database-level atomicity or decide semantic truth.

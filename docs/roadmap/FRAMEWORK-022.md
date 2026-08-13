---
id: FRAMEWORK-022
title: Build transactional project mutations
description: Add a recoverable mutation core and two portable public write operations after the public storage contract is stable.
phase: Phase 3 — Transactional Project Memory
status: Deferred
priority: P1
related_tasks:
  - id: TASK-013
    name: Build the recoverable transaction engine
    url: /TASKS.md#TASK-013
  - id: TASK-014
    name: Expose vef create and vef update
    url: /TASKS.md#TASK-014
  - id: TASK-015
    name: Migrate agent adapters and complete mutation tests
    url: /TASKS.md#TASK-015
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
  - id: DEC-004
    name: Store canonical items in per-type folders and generate the ledgers
    url: /DECISIONS.md#DEC-004
last_updated: '2026-08-13'
---
# FRAMEWORK-022 — Build transactional project mutations

The public write surface remains intentionally small: `vef create` creates a record and `vef update` changes scalar fields and relationships in one validated transaction. Agents retain semantic judgment and prose authorship; deterministic code owns IDs, lifecycle mechanics, typed inverse links, candidate validation, projection, and recoverable writes. Direct Markdown editing remains supported through the strict validation gate.

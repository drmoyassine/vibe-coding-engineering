---
id: FRAMEWORK-022
title: Build transactional project mutations
description: Add a recoverable mutation core and two portable public write operations after the public storage contract is stable.
phase: Phase 3 — Transactional Project Memory
status: Completed
priority: P0
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
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
last_updated: '2026-08-14'
modified:
  by: agent/codex-release
  at: '2026-08-14T15:47:16.538Z'
---
# FRAMEWORK-022 — Build transactional project mutations

Completed 2026-08-14 and released in VEF 0.3.0. VEF now has two public day-to-day mutation commands over one recoverable writer. Agents and humans continue to decide meaning; deterministic code owns mechanical structure. No separate link command or adapter-specific serializer was added.

DEC-010 governs the immutable journal, additive state markers, renewable stale-tolerant lease, direct retrying Windows writes, non-fatal cleanup debris, and explicit recovery. TASK-013 through TASK-015 shipped as one boundary and the frozen 17-record engine replay reaches strict integrity without manual inverse repair. The next product track can use the candidate diff and exported transaction contract for lightweight human review.

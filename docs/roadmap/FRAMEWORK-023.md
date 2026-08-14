---
id: FRAMEWORK-023
title: Harden public transactional authoring
description: >-
  Remove the confirmed 0.3.0 write-recovery failure and finish the minimum authoring CLI contract before further
  promotion.
phase: Phase 3 — Transactional Project Memory
status: In Progress
priority: P0
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
related_tasks:
  - id: TASK-032
    name: Recover safely from malformed and accumulated lease claims
    url: /TASKS.md#TASK-032
  - id: TASK-033
    name: Make roadmap ID allocation predictable
    url: /TASKS.md#TASK-033
  - id: TASK-034
    name: Complete authoring help and break-glass CLI ergonomics
    url: /TASKS.md#TASK-034
  - id: TASK-035
    name: Release and publicly prove VEF 0.3.1
    url: /TASKS.md#TASK-035
  - id: TASK-036
    name: Classify and implement isolated deterministic repairs
    url: /TASKS.md#TASK-036
modified:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
---
# FRAMEWORK-023 — Harden public transactional authoring

VEF 0.3.0 proved inverse closure, interruption recovery, concurrency, and Windows-safe writes, but independent fault injection found one adoption blocker: a malformed lease claim can brick every mutation without a CLI remedy. This track owns the 0.3.1 hotfix and the directly adjacent authoring defects and break-glass usability gaps.

Promotion remains paused until TASK-032 and TASK-035 prove malformed lease recovery from the public package. TASK-033 and TASK-034 complete the small, backward-compatible authoring fixes in the same release boundary. TASK-036 then narrows any further repair behavior by mechanical isolation rather than permitting arbitrary partial canonical writes.

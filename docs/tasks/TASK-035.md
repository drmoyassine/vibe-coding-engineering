---
id: TASK-035
title: Release and publicly prove VEF 0.3.1
description: Publish the transaction-hardening patch and independently verify every repaired public CLI path from the registry.
status: in-progress
priority: P0
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
roadmap_item:
  id: FRAMEWORK-023
  name: Harden public transactional authoring
  url: /ROADMAP.md#FRAMEWORK-023
depends_on:
  - id: TASK-032
    name: Recover safely from malformed and accumulated lease claims
    url: /TASKS.md#TASK-032
  - id: TASK-033
    name: Make roadmap ID allocation predictable
    url: /TASKS.md#TASK-033
  - id: TASK-034
    name: Complete authoring help and break-glass CLI ergonomics
    url: /TASKS.md#TASK-034
related_decisions:
  - id: DEC-008
    name: Bootstrap npm manually, then use staged trusted publishing
    url: /DECISIONS.md#DEC-008
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
modified:
  by: agent/codex-release
  at: '2026-08-14T16:43:48.683Z'
---
# TASK-035 — Release and publicly prove VEF 0.3.1

Run the complete release gate on Ubuntu and Windows, stage the tagged artifact through trusted publishing, require human 2FA approval, and verify registry hashes and provenance.

Public-registry acceptance must include malformed-lease diagnosis/recovery, debris sweep behavior, fresh and inferred roadmap allocation, authority-only repair without a proposal, update grammar help, visible recover guidance, fresh setup, and strict check. Broad promotion remains blocked until this task completes.

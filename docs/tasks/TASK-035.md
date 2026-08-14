---
id: TASK-035
title: Release and publicly prove VEF 0.3.1
description: Publish the transaction-hardening patch and independently verify every repaired public CLI path from the registry.
status: completed
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
  at: '2026-08-14T19:28:08.240Z'
---
# TASK-035 — Release and publicly prove VEF 0.3.1

Completed 2026-08-14. Commit `ecf4633` passed the complete release gate on Ubuntu and Windows with Node 18 and Node 24, was tagged `v0.3.1`, and was staged through the stage-only trusted GitHub OIDC publisher. Human 2FA approval made `vibe-engineering-framework@0.3.1` public as `latest`.

The live registry reports SHA-1 `32b1aa5ec6beab0e304b609eba350771aaf3f50d`, integrity `sha512-DPI19Cx9AuG5fAYNPtngJyst9j57Rft1YaVnjhB7W/peGsskOubF8ts/HSvsDFDuHpQAWSMRAeqmeatQa2lLbQ==`, 37 files, an empty staging queue, an npm signature, and SLSA provenance. A clean public-registry installation passed fresh setup/check, malformed-lease diagnosis and quarantine, inactive-debris sweep, fresh and inferred roadmap allocation, authority-only repair without a proposal, update grammar help, visible recovery guidance, and final strict enforcement.

The matching GitHub release is public. Bugs #3, #4, and #5 were closed with registry evidence. TASK-040 may now execute the already frozen controlled inheritance protocol; broad promotion remains gated by TASK-041 and TASK-043.

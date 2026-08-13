---
id: TASK-008
title: Harden /apply migration trust boundaries
description: >-
  Treat discovered repository content as untrusted data, make memory import opt-in, and require deterministic validation
  before a migration is accepted.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: Build the VEF Integrity Core
  url: /ROADMAP.md#FRAMEWORK-017
assignee: null
depends_on:
  - id: TASK-006
    name: Define canonical schema and typed relationship model
    url: /TASKS.md#TASK-006
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-008 — Harden /apply migration trust boundaries

Completed 2026-08-13. `/apply` now defaults to read-only file evidence and requires explicit `--write`, `--source memory`, and `--source git` intent. Every discovery phase labels repository, memory, Git, and agent payloads as untrusted evidence. Memory is classified as project/personal/sensitive/transient before reconciliation; only project knowledge remains eligible. Orphans become blocked review items instead of fabricated targets. Agent validation is advisory, and the write contract requires staged and post-write `vef validate --strict` passes without automatic commits.

`vef doctor` deterministically audits these security-critical adapter defaults. Regression tests cover both the dogfooded adapter and install template, reject the legacy unsafe defaults, and require both copies to remain identical.

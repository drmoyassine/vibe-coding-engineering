---
id: FRAMEWORK-020
title: Publish and publicly launch VEF
description: >-
  Make VEF installable, discoverable, credible, and ready for public adoption through a coordinated package and launch
  release.
phase: Phase 2 — Public Launch
status: In Progress
priority: P0
related_tasks:
  - id: TASK-001
    name: Publish the VEF CLI package to npm
    url: /TASKS.md#TASK-001
  - id: TASK-017
    name: Prepare the public VEF release and launch narrative
    url: /TASKS.md#TASK-017
  - id: TASK-018
    name: Publish adoption examples and a public feedback loop
    url: /TASKS.md#TASK-018
  - id: TASK-019
    name: Execute the public launch and distribution plan
    url: /TASKS.md#TASK-019
  - id: TASK-024
    name: Enforce the consumer-neutral framework boundary
    url: /TASKS.md#TASK-024
  - id: TASK-028
    name: Add one-command doctor remediation
    url: /TASKS.md#TASK-028
  - id: TASK-029
    name: Separate core enforcement from consumer-owned adapters
    url: /TASKS.md#TASK-029
  - id: TASK-030
    name: Simplify the complete VEF adoption lifecycle
    url: /TASKS.md#TASK-030
  - id: TASK-031
    name: Release and prove the VEF 0.2 adoption lifecycle
    url: /TASKS.md#TASK-031
related_decisions:
  - id: DEC-007
    name: Separate core enforcement from agent adapter compatibility
    url: /DECISIONS.md#DEC-007
  - id: DEC-008
    name: Bootstrap npm manually, then use staged trusted publishing
    url: /DECISIONS.md#DEC-008
  - id: DEC-009
    name: Make setup and check the complete public adoption lifecycle
    url: /DECISIONS.md#DEC-009
last_updated: '2026-08-14'
modified:
  by: agent/codex-release
  at: '2026-08-14T15:47:16.538Z'
---
# FRAMEWORK-020 — Publish and publicly launch VEF

`0.2.0` completed the verified two-command adoption lifecycle on 2026-08-14: public latest acquisition, clean setup/check, and two representative consumer upgrades all passed. `0.3.0` then made FRAMEWORK-022's transaction writer publicly available. TASK-018 and TASK-019 can now resume public examples, feedback, and distribution without teaching manual inverse-link bookkeeping as the normal authoring experience.

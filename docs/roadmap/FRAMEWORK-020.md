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
related_decisions:
  - id: DEC-007
    name: Separate core enforcement from agent adapter compatibility
    url: /DECISIONS.md#DEC-007
  - id: DEC-008
    name: Bootstrap npm manually, then use staged trusted publishing
    url: /DECISIONS.md#DEC-008
last_updated: '2026-08-13'
---
# FRAMEWORK-020 — Publish and publicly launch VEF

This is the immediate framework priority. Public claims remain tied to implemented behavior: Integrity Core validation, deterministic queries, safe migration boundaries, and current package status. TASK-017 completed the public narrative, and TASK-001 published and independently verified `vibe-engineering-framework@0.1.0` as npm's public `latest` release. The authenticated bootstrap boundary defined by DEC-008 is closed; future releases move to staged OIDC publishing with human approval after the npm trust relationship is configured. TASK-018 and TASK-019 now own examples, feedback, and distribution; deferred transaction work must not be advertised as shipped.

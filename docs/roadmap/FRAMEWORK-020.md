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
last_updated: '2026-08-13'
---
# FRAMEWORK-020 — Publish and publicly launch VEF

This is the immediate framework priority. Public claims must remain tied to implemented behavior: Integrity Core validation, deterministic queries, safe migration boundaries, and current package status. TASK-028 has closed the post-install adoption ergonomics gap with one explicitly authorized `doctor --fix` operation while keeping plain doctor read-only. TASK-001 still owns npm publication, so registry-based `@latest` instructions must not appear as executable guidance before the package exists. The launch should make installation, remediation, evaluation, examples, contribution, and feedback obvious without claiming the deferred transaction layer has shipped.

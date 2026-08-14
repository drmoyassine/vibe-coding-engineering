---
id: TASK-018
title: Publish adoption examples and a public feedback loop
description: >-
  Give evaluators a short end-to-end example, visible dogfood evidence, and one canonical way to report feedback and
  adoption problems.
status: pending
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: null
depends_on:
  - id: TASK-017
    name: Prepare the public VEF release and launch narrative
    url: /TASKS.md#TASK-017
  - id: TASK-031
    name: Release and prove the VEF 0.2 adoption lifecycle
    url: /TASKS.md#TASK-031
  - id: TASK-035
    name: Release and publicly prove VEF 0.3.1
    url: /TASKS.md#TASK-035
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-14'
modified:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
---
# TASK-018 — Publish adoption examples and a public feedback loop

After the public 0.3.1 hardening proof, publish a compact sample repository or walkthrough covering `setup` → semantic reconciliation if needed → `check`, transactional create/update with inverse closure, recovery, structured queries, managed CI enforcement, and agent-adapter boundaries.

Establish GitHub Issues/Discussions or an equally explicit feedback path without creating a duplicate internal bug ledger. Publish GitHub CI/release evidence for maintainers and teach consumers to run `vef check`; do not imply that VEF's excluded internal test suite belongs in the npm package.

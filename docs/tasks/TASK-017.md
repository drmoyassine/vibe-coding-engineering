---
id: TASK-017
title: Prepare the public VEF release and launch narrative
description: >-
  Create a truthful, coherent release package that explains VEF's problem, implemented contract, installation path,
  boundaries, and public invitation.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: Codex
depends_on: []
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
  - id: DEC-008
    name: Bootstrap npm manually, then use staged trusted publishing
    url: /DECISIONS.md#DEC-008
last_updated: '2026-08-13'
---
# TASK-017 — Prepare the public VEF release and launch narrative

Completed 2026-08-13. Reconciled the README/front door, truthful pre-publication and post-publication installation paths, current-versus-planned capability table, package/repository metadata, changelog, contribution contract, security reporting, maintainer release procedure, and reusable `0.1.0` launch copy.

The public narrative now leads with Git-native durable project memory and its deterministic integrity boundary. It names per-item storage, generated ledgers, queries, adoption, and optional adapters as shipped; it explicitly marks the human-review workspace as planned and transactional `create`/`update` as deferred. Registry publication itself remains TASK-001, and distribution/adoption execution remains TASK-018/TASK-019.

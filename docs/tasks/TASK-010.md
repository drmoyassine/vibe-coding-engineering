---
id: TASK-010
title: Enforce durable-memory catalogue coherence
description: >-
  Prevent project-level records such as Architecture from disappearing across vision, navigation, public documentation,
  templates, and health checks.
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
# TASK-010 — Enforce durable-memory catalogue coherence

Completed 2026-08-13. `src/lib/memory-catalog.mjs` now defines the seven project-level record types once. `vef validate --strict` and `vef doctor` enforce exact canonical document casing, the VISION record/question table, navigation links, external-issue representation, and framework-source README/template alignment. A regression fixture removes Architecture and proves that both commands fail explicitly.

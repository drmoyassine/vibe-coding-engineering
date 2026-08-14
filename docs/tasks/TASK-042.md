---
id: TASK-042
title: Decide whether VEF needs namespaced record extensions
description: Use adoption evidence to decide whether extension schemas are warranted without fragmenting the core vocabulary.
status: pending
priority: P3
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
roadmap_item:
  id: FRAMEWORK-026
  name: Evaluate namespaced record-type extensions
  url: /ROADMAP.md#FRAMEWORK-026
depends_on:
  - id: TASK-041
    name: Publish VEF effectiveness evidence and gate broad claims
    url: /TASKS.md#TASK-041
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
modified:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
---
# TASK-042 — Decide whether VEF needs namespaced record extensions

Collect concrete unmet record-type needs from adopters after the controlled evaluation and public feedback loop. Compare mapping into the four core types against namespaced extensions.

If extensions are warranted, write a decision covering namespace ownership, schema discovery, graph edges, validation, query behavior, migrations, and the rule that extensions cannot weaken or redefine core records. Do not implement a generic plugin mechanism without this evidence.

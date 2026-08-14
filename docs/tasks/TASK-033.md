---
id: TASK-033
title: Make roadmap ID allocation predictable
description: Allocate roadmap IDs in fresh and coherent existing projects while explaining mixed-prefix ambiguity.
status: completed
priority: P1
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
roadmap_item:
  id: FRAMEWORK-023
  name: Harden public transactional authoring
  url: /ROADMAP.md#FRAMEWORK-023
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
related_bugs:
  - id: '4'
    name: Roadmap creation cannot auto-allocate a record ID
    url: https://github.com/drmoyassine/vibe-engineering-framework/issues/4
modified:
  by: agent/codex-implementation
  at: '2026-08-14T16:42:38.334Z'
---
# TASK-033 — Make roadmap ID allocation predictable

Completed 2026-08-14 for the 0.3.1 candidate. Roadmap creation without an ID now allocates `ROADMAP-001` in a fresh collection and continues the next number when every existing roadmap ID belongs to one coherent numeric prefix such as `FRAMEWORK-*`.

Mixed numeric families and non-numeric existing IDs produce a direct explicit-ID error rather than guessing. Explicit roadmap IDs remain schema-valid for compatibility, and vision records still require semantic slug IDs. Tests cover fresh allocation, inferred continuation, mixed-family refusal, and the unchanged vision boundary. GitHub issue #4 remains open through public-package proof in TASK-035.

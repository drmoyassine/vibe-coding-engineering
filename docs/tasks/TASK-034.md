---
id: TASK-034
title: Complete authoring help and break-glass CLI ergonomics
description: Make authority-only repair usable, document update proposals, and surface recover as an explicit diagnostic command.
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
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
related_bugs:
  - id: '5'
    name: Title-authority repair unnecessarily requires an empty proposal file
    url: https://github.com/drmoyassine/vibe-engineering-framework/issues/5
modified:
  by: agent/codex-implementation
  at: '2026-08-14T16:42:38.334Z'
---
# TASK-034 — Complete authoring help and break-glass CLI ergonomics

Completed 2026-08-14 for the 0.3.1 candidate. `vef update <id> --authority frontmatter|heading` now works without an empty proposal file, while every ordinary update still fails clearly unless `--from` is supplied.

Normal `update --help` documents `set`, `unset`, `body`, and relationship grammar. `vef recover` is visible as a break-glass command, with separate journal and lease examples; README, shipped agent templates, and dogfood agent instructions distinguish recovery from the two-command setup/check adoption lifecycle. GitHub issue #5 remains open through public-package proof in TASK-035.

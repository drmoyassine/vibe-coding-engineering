---
id: TASK-007
title: Align filename conventions and provenance
description: Adopt lowercase OKF index.md/log.md consistently and remove stale or fabricated scaffold provenance.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: Build the VEF Integrity Core
  url: /ROADMAP.md#FRAMEWORK-017
assignee: null
depends_on: []
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-007 — Align filename conventions and provenance

Completed 2026-08-13. The canonical files are `index.md` and `log.md`; templates, `init`, `doctor`, migration detection, and primary adapter discovery use those names. `init` now stamps process-generated records with the actual timestamp rather than a fabricated human actor/date. Tests verify the exact scaffold filenames.

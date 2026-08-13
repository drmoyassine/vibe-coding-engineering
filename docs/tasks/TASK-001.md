---
id: TASK-001
title: Publish the VEF CLI package to npm
description: >-
  Release the verified CLI, templates, and adapter package to npm so public adopters can install and run VEF without a
  local clone.
status: in-progress
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: drmoy
depends_on:
  - id: TASK-012
    name: Implement the canonical record store and ledger projector
    url: /TASKS.md#TASK-012
related_decisions: []
last_updated: '2026-08-13'
---
# TASK-001 — Publish the VEF CLI package to npm

Scope revised 2026-08-13 when public launch became the immediate priority. Publishing is now P0; the unrelated local-directory rename moved to TASK-016. Acceptance: the package contents pass the existing CI contract, the registry metadata and version are truthful, installation works from a clean directory, and `npx vibe-engineering-framework@latest --help` plus a fresh `vef init`/`doctor`/`validate --strict` flow succeed.

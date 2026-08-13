---
id: TASK-005
title: Gate the Integrity Core in CI
description: Run tests, strict validation, doctor, and package checks on supported platforms.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: Build the VEF Integrity Core
  url: /ROADMAP.md#FRAMEWORK-017
assignee: null
depends_on:
  - id: TASK-004
    name: Add Integrity Core test suite
    url: /TASKS.md#TASK-004
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-005 — Gate the Integrity Core in CI

Completed 2026-08-13. `.github/workflows/validate.yml` runs on pushes and pull requests across Ubuntu and Windows with Node 20. It installs dependencies, runs `npm test`, strict validation, `doctor`, and `npm pack --dry-run`.

**Acceptance:**
- `.github/workflows/validate.yml` runs on pull requests and pushes.
- Linux at minimum; add Windows coverage for filename-case behavior.
- Fails on schema/graph errors, warnings in strict mode, test failures, or an invalid package manifest.

---
id: TASK-004
title: Add Integrity Core test suite
description: Cover parsing, canonical schema validation, typed graph integrity, CLI behavior, and migration safety fixtures.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: Build the VEF Integrity Core
  url: /ROADMAP.md#FRAMEWORK-017
assignee: Codex
depends_on: []
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-004 — Add Integrity Core test suite

Completed 2026-08-13. `node --test` now covers field/reference validation, target typing, duplicate IDs, both directions of inverse-link checks, dependency cycles, and fresh scaffold casing/provenance.

**Completed scope:**
- `node --test` is wired into `package.json`.
- Fixtures cover valid/invalid schema data, malformed references, wrong target types, duplicate IDs, bidirectional links, cycles, and scaffold output.
- CLI command-specific integration coverage remains desirable as the command surface grows.

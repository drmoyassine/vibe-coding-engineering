---
id: TASK-030
title: Simplify the complete VEF adoption lifecycle
description: >-
  Replace the normal init/migrate/fix/project/strict sequence with idempotent setup and one strict check while preserving
  safety and compatibility.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: Codex
depends_on:
  - id: TASK-029
    name: Separate core enforcement from consumer-owned adapters
    url: /TASKS.md#TASK-029
related_decisions:
  - id: DEC-009
    name: Make setup and check the complete public adoption lifecycle
    url: /DECISIONS.md#DEC-009
last_updated: '2026-08-13'
---
# TASK-030 — Simplify the complete VEF adoption lifecycle

Completed 2026-08-13. The normal CLI now presents two lifecycle commands:

- `vef setup` handles fresh adoption, compatible upgrades, storage repair, ledger projection, strict validation, missing-adapter installation, enforcement reporting, and CI deployment without overwrite flags;
- `vef check` is the strict read-only local and CI gate;
- `vef doctor` explains blockers but no longer advertises a competing repair flag;
- `init`, `migrate`, `project`, `validate`, `doctor --fix`, and the former top-level aliases remain callable but are hidden from normal help.

Human-facing `npx` commands deliberately omit npm's `--yes` approval flag. It is not a VEF option and is reserved only for generated non-interactive CI commands.

Fresh setup preflights every template-owned surface before writing. Existing VEF repositories stop before structural mutation when schemas, links, catalogue meaning, or review flags are unresolved. GitHub setup installs or refreshes a clearly marked workflow pinned to the running framework version; custom enforcement is preserved; other CI systems receive the exact portable command.

Tests cover fresh adoption, legacy upgrade, already-enforced idempotency, preflight conflicts, semantic blockers, projection drift repair, managed CI deployment, custom compatibility paths, help visibility, and installed-tarball smoke behavior.

---
id: TASK-031
title: Release and prove the VEF 0.2 adoption lifecycle
description: >-
  Publish the two-command lifecycle and verify that real consumers can update through latest setup and reach enforced
  state without reconstructing internal commands.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: drmoy
depends_on:
  - id: TASK-001
    name: Publish the VEF CLI package to npm
    url: /TASKS.md#TASK-001
  - id: TASK-030
    name: Simplify the complete VEF adoption lifecycle
    url: /TASKS.md#TASK-030
related_decisions:
  - id: DEC-009
    name: Make setup and check the complete public adoption lifecycle
    url: /DECISIONS.md#DEC-009
  - id: DEC-008
    name: Bootstrap npm manually, then use staged trusted publishing
    url: /DECISIONS.md#DEC-008
last_updated: '2026-08-14'
modified:
  by: agent/codex-release
  at: '2026-08-14T15:47:16.538Z'
---
# TASK-031 — Release and prove the VEF 0.2 adoption lifecycle

Completed 2026-08-14. The adoption-lifecycle release was proven across every declared boundary:

- merged PR #1 after the complete release gate and eight passing Ubuntu/Windows checks, then tagged merge commit `e5b37fb` as `v0.2.0`;
- staged the tag through GitHub OIDC, published signed provenance, and released it after human 2FA approval under DEC-008;
- verified npm `latest` resolves to `0.2.0`, registry SHA-1 `9fa04f7f8cd235b101c83870743ccec522d486da`, and SHA-512 integrity `sha512-5/zsyx+zylpgqWTZkd2IUTGEHHkjUJTAfLvrOszk9BRR++mMosZijIG0dO9LmU0qpdLaHIa5AdSZ3h0yOVEEww==`;
- installed public `@latest` into a clean temporary repository and passed fresh `setup` followed by `check`;
- ran public latest `setup` and `check` against two independently governed adopted repositories: one idempotent current state and one safe regeneration of four stale derived ledgers from semantically coherent canonical records;
- published the matching GitHub Release and retained the documented boundary between deterministic core enforcement, optional adapters, and unresolved product meaning.

TASK-018 and TASK-019 are no longer blocked by the lifecycle release. FRAMEWORK-022 subsequently delivered deterministic day-to-day record writes so public examples no longer need to teach manual inverse-link bookkeeping.

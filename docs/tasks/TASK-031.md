---
id: TASK-031
title: Release and prove the VEF 0.2 adoption lifecycle
description: >-
  Publish the two-command lifecycle and verify that real consumers can update through latest setup and reach enforced
  state without reconstructing internal commands.
status: in-progress
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
last_updated: '2026-08-13'
---
# TASK-031 — Release and prove the VEF 0.2 adoption lifecycle

`0.2.0` is the adoption-lifecycle release candidate. Completion requires:

- the complete release gate and cross-platform CI on the tagged artifact;
- staged OIDC publication and human 2FA approval through DEC-008;
- public-registry verification of `setup`, `check`, and the exact package integrity;
- clean fresh-repository setup plus check from npm;
- upgrade proof on representative independently owned consumer repositories using only `npx --yes vibe-engineering-framework@latest setup`, semantic reconciliation when explicitly reported, and `check`;
- final README/release notes that distinguish core enforcement from optional adapter compatibility and state that no CLI can invent missing product meaning.

TASK-018 and TASK-019 remain blocked behind this proof. Public examples and launch distribution must teach the simplified lifecycle rather than the obsolete 0.1 command sequence.

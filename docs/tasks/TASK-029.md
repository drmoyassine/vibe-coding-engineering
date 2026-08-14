---
id: TASK-029
title: Separate core enforcement from consumer-owned adapters
description: Make one-command core enforcement non-destructive and report optional adapter compatibility independently.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: Codex
depends_on:
  - id: TASK-028
    name: Add one-command doctor remediation
    url: /TASKS.md#TASK-028
related_decisions:
  - id: DEC-007
    name: Separate core enforcement from agent adapter compatibility
    url: /DECISIONS.md#DEC-007
last_updated: '2026-08-13'
---
# TASK-029 — Separate core enforcement from consumer-owned adapters

Completed 2026-08-13. Corrected the first implementation of TASK-028, which treated installed agent adapters as part of the core repair contract and exposed an overwrite flag.

The shipped behavior now:

- reports `NOT ADOPTED`, `SEMANTIC RECONCILIATION REQUIRED`, `STRUCTURALLY REPAIRABLE`, or `CORE ENFORCED` for deterministic project memory;
- reports optional adapter installation/compatibility separately, without allowing adapter attention to invalidate an enforced core;
- makes `vef doctor --fix` the only consumer-facing repair path and confines `migrate`, `project`, and `validate` to advanced or CI use;
- migrates storage, regenerates projections, validates strictly, and reruns health without overwriting any existing adapter file;
- installs only adapter files that are absent, as an optional convenience;
- retires `--update-adapters` as a hard failure that changes no files;
- stops before writes when schemas, relationships, catalogue meaning, or review flags require human/agent reconciliation.

Regression coverage models both important adoption shapes: a structurally ready legacy repository with customized adapters reaches `CORE ENFORCED` without changing those adapters, while a repository with a dangling roadmap-to-vision relationship receives the exact semantic blocker and remains untouched.

DEC-009 and TASK-030 preserve this boundary while presenting `setup` and `check` as the complete public lifecycle. The older doctor repair mode remains a hidden compatibility surface.

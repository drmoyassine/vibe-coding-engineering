---
id: FRAMEWORK-027
title: Establish VibeBench as a cross-platform engineering benchmark
description: >-
  Build a reproducible paired benchmark of one-pass coding-agent work with and without VEF across platforms,
  capabilities, and frozen runtime parameters.
phase: Phase 3 — Evidence Program
status: Deferred
priority: P1
last_updated: '2026-08-14'
generated:
  by: agent/codex-vibebench
  at: '2026-08-14T20:39:56.779Z'
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
related_tasks:
  - id: TASK-044
    name: Freeze the VibeBench v0 specification and task corpus
    url: /TASKS.md#TASK-044
  - id: TASK-045
    name: Build and pilot the VibeBench cross-platform runner
    url: /TASKS.md#TASK-045
  - id: TASK-046
    name: Execute and publish VibeBench v1
    url: /TASKS.md#TASK-046
modified:
  by: agent/codex-vibebench
  at: '2026-08-14T20:39:56.779Z'
---
# FRAMEWORK-027 — Establish VibeBench as a cross-platform engineering benchmark

VibeBench is the working name for VEF's broader evidence program: matched one-pass build, repair, refactor, migration, integration, constraint-adherence, and project-state tasks executed with and without VEF on major coding-agent platforms.

The current Codex inheritance study remains the narrow precursor and must be completed and published unchanged. VibeBench begins afterward with a prospectively frozen corpus, platform adapter contract, reproducible isolation, condition-neutral oracles, blinded scoring, immutable evidence, compute/sample design, and explicit claim boundaries. Its design source is `docs/evaluations/vibebench/README.md`.

---
id: FRAMEWORK-018
title: Expose deterministic project queries
description: Make the project graph useful without an LLM through CLI list, show, reference, rationale, graph, and search commands.
phase: Phase 1 — Queryable Project Memory
status: Completed
priority: P1
related_tasks:
  - id: TASK-009
    name: Design and implement deterministic query commands
    url: /TASKS.md#TASK-009
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# FRAMEWORK-018 — Expose deterministic project queries

Completed 2026-08-13. `vef list`, `show`, `refs`, `why`, `graph`, and `search` derive records and typed edges from the canonical parser and relationship declarations used by integrity checks. Default text output serves humans; versioned JSON serves scripts and CI. Rationale traversal is rule-based and read-only, so the model remains useful where no agent is available.

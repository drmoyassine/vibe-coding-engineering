---
id: TASK-009
title: Design and implement deterministic query commands
description: Expose project-memory retrieval without an LLM through list, show, refs, why, graph, and search commands.
status: completed
priority: P1
roadmap_item:
  id: FRAMEWORK-018
  name: Expose deterministic project queries
  url: /ROADMAP.md#FRAMEWORK-018
assignee: null
depends_on:
  - id: TASK-006
    name: Define canonical schema and typed relationship model
    url: /TASKS.md#TASK-006
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-009 — Design and implement deterministic query commands

Completed 2026-08-13. A shared read-only project loader now derives records and edges from the canonical parser and relationship schema. `vef list`, `show`, `refs`, `why`, `graph`, and `search` provide stable text output and a versioned `schemaVersion: 1` JSON envelope. Filters are deterministic and case-insensitive, errors remain machine-readable under `--json`, incoming links come from the typed graph, and `why` follows task → roadmap → vision plus relevant decision edges without agent interpretation.

Integration tests cover text and JSON output, repeatability, filters and aliases, normalized dates, typed incoming/outgoing/external references, rationale traversal, graph rendering, body search, ambiguity selectors, and failing exit codes.

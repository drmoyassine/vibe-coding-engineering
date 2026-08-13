---
id: FRAMEWORK-016
title: Project review adapters for Obsidian and wiki systems
description: >-
  Expose the shared VEF review and graph contract through optional local-first knowledge tools without moving canonical
  state out of the repository.
phase: Phase 4 — Advanced
status: Deferred
priority: P2
related_tasks:
  - id: TASK-027
    name: Prototype Obsidian and wiki review adapters
    url: /TASKS.md#TASK-027
related_decisions:
  - id: DEC-006
    name: Keep review interfaces disposable and canonical records authoritative
    url: /DECISIONS.md#DEC-006
last_updated: '2026-08-13'
---
# FRAMEWORK-016 — Project review adapters for Obsidian and wiki systems

Obsidian, wiki, and future hosted views should consume the same neutral review packet and graph representation defined by FRAMEWORK-015. Obsidian can add backlinks, graph exploration, task boards, and local annotations; a wiki adapter can publish selected views for broader review. Neither becomes a required runtime or an alternate system of record.

**Why deferred:** prove the tool-neutral review contract and lightweight workspace first. Adapter-specific editing and canonical write-back must use the validated mutation boundary rather than independently implementing fragile Markdown edits.

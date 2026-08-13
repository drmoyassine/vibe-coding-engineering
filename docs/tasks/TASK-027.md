---
id: TASK-027
title: Prototype Obsidian and wiki review adapters
description: >-
  Prove that local-first and collaborative knowledge tools can consume the shared VEF review contract without becoming
  systems of record.
status: pending
priority: P2
roadmap_item:
  id: FRAMEWORK-016
  name: Project review adapters for Obsidian and wiki systems
  url: /ROADMAP.md#FRAMEWORK-016
assignee: null
depends_on:
  - id: TASK-026
    name: Implement the lightweight vef review workspace
    url: /TASKS.md#TASK-026
related_decisions:
  - id: DEC-006
    name: Keep review interfaces disposable and canonical records authoritative
    url: /DECISIONS.md#DEC-006
last_updated: '2026-08-13'
---
# TASK-027 — Prototype Obsidian and wiki review adapters

Build narrow proofs for Obsidian and one generic wiki/static-site projection using the review manifest and comment packet. Compare navigation, backlinks, graph exploration, annotation exchange, installation burden, and write-back risk. Do not ship adapter-specific canonical mutations before the shared transaction layer exists.

---
id: TASK-026
title: Implement the lightweight vef review workspace
description: Generate a portable local UI for human review and comment export from the canonical VEF model.
status: pending
priority: P1
roadmap_item:
  id: FRAMEWORK-015
  name: Generate ephemeral human review workspaces
  url: /ROADMAP.md#FRAMEWORK-015
assignee: null
depends_on:
  - id: TASK-025
    name: Define the human review artifact and comment contract
    url: /TASKS.md#TASK-025
  - id: TASK-012
    name: Implement the canonical record store and ledger projector
    url: /TASKS.md#TASK-012
related_decisions:
  - id: DEC-006
    name: Keep review interfaces disposable and canonical records authoritative
    url: /DECISIONS.md#DEC-006
last_updated: '2026-08-13'
---
# TASK-026 — Implement the lightweight vef review workspace

Add a small `vef review` surface that generates or serves the review bundle without a hosted service or project database. It should render canonical documents, structured items, backlinks, rationale, validation state, provenance, diffs, and review queues; capture local comments; export a deterministic review packet; and leave canonical Markdown unchanged. Tests cover escaping/untrusted content, stable anchors, deterministic output, comment round-trips, accessibility basics, and Windows/Linux paths.

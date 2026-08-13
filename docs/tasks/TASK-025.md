---
id: TASK-025
title: Define the human review artifact and comment contract
description: >-
  Specify a tool-neutral, disposable review bundle for documents, graph context, diffs, findings, provenance, and human
  comments.
status: in-progress
priority: P1
roadmap_item:
  id: FRAMEWORK-015
  name: Generate ephemeral human review workspaces
  url: /ROADMAP.md#FRAMEWORK-015
assignee: null
depends_on: []
related_decisions:
  - id: DEC-006
    name: Keep review interfaces disposable and canonical records authoritative
    url: /DECISIONS.md#DEC-006
last_updated: '2026-08-13'
---
# TASK-025 — Define the human review artifact and comment contract

Define the versioned review manifest, stable targets for document/item/field/relationship/text annotations, comment lifecycle, diff and validation inputs, provenance, export behavior, privacy boundary, and acceptance handoff. The artifact is local and disposable by default. Exported comments remain review evidence until a human or agent explicitly reconciles them into canonical records and strict validation passes.

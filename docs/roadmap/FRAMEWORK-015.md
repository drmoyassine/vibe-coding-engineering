---
id: FRAMEWORK-015
title: Generate ephemeral human review workspaces
description: >-
  Render a disposable local review UI from canonical records, diffs, audit findings, provenance, and comments without
  creating a second source of truth.
phase: Phase 2 — Human Review
status: In Progress
priority: P1
related_tasks:
  - id: TASK-025
    name: Define the human review artifact and comment contract
    url: /TASKS.md#TASK-025
  - id: TASK-026
    name: Implement the lightweight vef review workspace
    url: /TASKS.md#TASK-026
related_decisions:
  - id: DEC-006
    name: Keep review interfaces disposable and canonical records authoritative
    url: /DECISIONS.md#DEC-006
last_updated: '2026-08-13'
---
# FRAMEWORK-015 — Generate ephemeral human review workspaces

After an audit, migration, or large reconciliation, VEF should be able to fold the affected project state into a temporary review workspace that a human can navigate without reading every ledger linearly.

The initial surface is a portable static/local artifact:

- canonical documents and structured items with backlinks and rationale paths;
- candidate-versus-current diffs, validation results, provenance, and `needsReview` queues;
- comments anchored to a document, item, field, relationship, or selected text;
- an exportable review packet that an agent or later deterministic mutation layer can reconcile;
- no hosted account, UI-owned database, or silent canonical Markdown mutation.

Review artifacts are disposable by default and may be intentionally exported for handoff or audit evidence. Canonical acceptance still requires explicit reconciliation followed by `vef validate --strict`.

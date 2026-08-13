---
id: TASK-014
title: Expose vef create and vef update
description: >-
  Provide two portable public commands over the transaction engine for record creation and combined field/relationship
  updates.
status: pending
priority: P0
roadmap_item:
  id: FRAMEWORK-022
  name: Build transactional project mutations
  url: /ROADMAP.md#FRAMEWORK-022
assignee: null
depends_on:
  - id: TASK-013
    name: Build the recoverable transaction engine
    url: /TASKS.md#TASK-013
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
last_updated: '2026-08-13'
---
# TASK-014 — Expose vef create and vef update

`vef create` accepts a complete proposed record, including initial relationships. `vef update` combines scalar changes with link/unlink operations in one transaction. Preview is the safe default and an explicit write flag applies the validated candidate. No delete or semantic inference command is included.

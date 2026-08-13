---
id: TASK-011
title: Decide canonical item storage and ledger projection contract
description: >-
  Resolve whether item blocks remain canonical inside ledgers or move to per-item files that deterministically generate
  the ledgers.
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-019
  name: Adopt canonical per-item storage and ledger projections
  url: /ROADMAP.md#FRAMEWORK-019
assignee: null
depends_on:
  - id: TASK-006
    name: Define canonical schema and typed relationship model
    url: /TASKS.md#TASK-006
related_decisions:
  - id: DEC-003
    name: Make the Integrity Core authoritative and keep agent adapters portable
    url: /DECISIONS.md#DEC-003
  - id: DEC-004
    name: Store canonical items in per-type folders and generate the ledgers
    url: /DECISIONS.md#DEC-004
last_updated: '2026-08-13'
---
# TASK-011 — Decide canonical item storage and ledger projection contract

Completed 2026-08-13. DEC-004 accepts canonical per-item Markdown files organized by record type, with deterministic committed ledgers as projections. It preserves public ledger anchors, keeps singleton documents canonical, requires drift detection, and distinguishes the accepted target from the still-monolithic implementation.

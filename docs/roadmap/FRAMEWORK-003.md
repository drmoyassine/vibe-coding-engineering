---
id: FRAMEWORK-003
title: Standardize id+name+url related-item pattern
description: All cross-doc references use id + name + url (relative for same-repo, absolute for external)
phase: Phase 0 — Foundation
status: Completed
priority: P1
last_updated: '2026-08-12'
---
# FRAMEWORK-003 — Standardize id+name+url related-item pattern

Established the canonical pattern for cross-referencing items between docs:
```yaml
related_tasks:
  - id: TASK-002
    name: "Implement activeWhen filter in buildToolset"
    url: /TASKS.md#TASK-002
```

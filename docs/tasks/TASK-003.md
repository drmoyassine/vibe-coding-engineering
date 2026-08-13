---
id: TASK-003
title: Install the four management skills in the framework repo (dogfood)
description: >-
  Install /tasks /roadmap /decisions /bugs into the framework's own .claude/skills so it self-manages and vef doctor
  passes
status: completed
priority: P2
roadmap_item:
  id: FRAMEWORK-002
  name: Document the four management skills
  url: /ROADMAP.md#FRAMEWORK-002
assignee: drmoy
depends_on: []
related_decisions: []
last_updated: '2026-08-12'
---
# TASK-003 — Install the four management skills in the framework repo (dogfood)

Done — concrete (de-placeholderized) copies of `/tasks`, `/roadmap`, `/decisions`, `/bugs` installed in `.claude/skills/` alongside the existing `/apply`. The framework now manages its own ROADMAP/TASKS/DECISIONS via its own skills, matching the consumer install and clearing the `vef doctor` skill gaps.

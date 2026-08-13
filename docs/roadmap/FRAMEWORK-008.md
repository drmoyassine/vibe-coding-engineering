---
id: FRAMEWORK-008
title: Auto-run reconcile skills on doc changes
description: GitHub Actions that watch doc files and auto-run the relevant /reconcile skill
phase: Phase 2 — Automation
status: Deferred
priority: P1
last_updated: '2026-08-12'
---
# FRAMEWORK-008 — Auto-run reconcile skills on doc changes

*Phase 2 — Automation (Deferred). When manual skill invocation becomes a pain, automate.*

**Triggers:**
- PR opens touching `TASKS.md` → run `/tasks reconcile` as a check
- PR opens touching `ROADMAP.md` → run `/roadmap reconcile`
- Commit touches `DECISIONS.md` → run `/decisions reconcile`

**Blocker:** Needs Claude in CI (GitHub Action that runs Claude Code headless).

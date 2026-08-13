---
id: FRAMEWORK-011
title: Make skills portable across repos
description: Extract the skill definitions into reusable templates that any repo can adopt
phase: Phase 3 — Generalization
status: Completed
priority: P2
last_updated: '2026-08-13'
---
# FRAMEWORK-011 — Make skills portable across repos

*Phase 3 — Generalization. Once proven in an independent consumer, make adoption repeatable across repositories.*

**Approach (shipped):**
- ✅ Local/package artifact — `vef init` scaffolds docs + skills; public npm registry release is tracked by FRAMEWORK-020
- Git submodule — `vibe-engineering-framework` as a submodule, skills symlinked
- GitHub template repo — fork/copy to start a new project

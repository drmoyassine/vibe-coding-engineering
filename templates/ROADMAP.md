# Roadmap

Directional roadmap — quarters, themes, priorities. Each item is a markdown section with YAML frontmatter.

> All related references use the **`id + name + url`** pattern. Same-repo URLs are relative; cross-repo/external are absolute.

## Schema

```yaml
---
id: ROADMAP-XXX
title: Short description
description: One-line summary
quarter: Q1 | Q2 | Q3 | Q4
status: Deferred | In Progress | Completed | Blocked
priority: P0 | P1 | P2 | P3
vision_theme:               # singular, OPTIONAL — links to a VISION.md theme
  id: document-intelligence
  name: "Vision theme title"
  url: /VISION.md#document-intelligence
related_tasks: []           # array of task refs (empty: [])
related_decisions: []       # array of decision refs — link to DECISIONS, not LOG.md
tags: []                    # OPTIONAL (OKF)
resource:                   # OPTIONAL (OKF)
log_ref:                    # OPTIONAL — ref to LOG.md section
  date: 2026-01-01
  section: "### ..."
generated:                  # OPTIONAL (OKF trust signal)
  by: "human:<id>"
  at: "2026-01-01T00:00:00Z"
verified:                   # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-01-01T00:00:00Z"
last_updated: 2026-01-01
---

Problem, solution, dependencies, open decisions.
```

**Field rules:** `vision_theme` is singular and optional (omit until VISION.md themes exist). `related_tasks`, `related_decisions` are arrays (empty = `[]`). `related_decisions` links to DECISIONS.md, NOT to LOG.md.

---

## Roadmap items

<!--
## ROADMAP-001 — Adopt documentation framework

---
id: ROADMAP-001
title: Adopt vibe-engineering-framework
description: Scaffold the doc framework + skills into this repo
quarter: Q1
status: Completed
priority: P1
vision_theme:
related_tasks: []
related_decisions:
  - id: DEC-001
    name: "Adopt vibe-engineering-framework"
    url: /DECISIONS.md#DEC-001
tags: [docs, framework]
last_updated: 2026-01-01
---

Adopt the framework via `vef init`. Scaffolds VISION.md, ROADMAP.md, TASKS.md, DECISIONS.md, LOG.md, INDEX.md, CLAUDE.md, AGENTS.md + 5 Claude Code skills.
-->

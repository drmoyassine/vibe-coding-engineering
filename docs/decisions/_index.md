# DECISIONS.md

**vibe-engineering-framework Decisions** — Architectural, product, and technical decisions with context and rationale.

Last updated: 2026-08-13

---

## Decision schema

Each decision uses YAML frontmatter (canonical source: this file + `CLAUDE.md` "Frontmatter schemas"). Related references follow the **`id + name + url`** pattern (relative URL for same-repo, absolute for cross-repo):

```yaml
---
id: DEC-XXX
title: Short description
status: accepted | deprecated | superseded
context: What problem or situation led to this decision
decision: What we decided
rationale: Why this option over alternatives
consequences: Impact (positive + negative)
superseded_by:                   # SINGULAR object, only when status = superseded (else omit)
  id: DEC-YYY
  name: "Newer decision"
  url: /DECISIONS.md#DEC-YYY
generated:                       # OPTIONAL (OKF trust signal) — who wrote this, when
  by: "human:<id>" | "<producer>/<version>" | "process:<id>"
  at: "2026-08-12T00:00:00Z"
verified:                        # OPTIONAL (OKF trust signal) — who confirmed this
  - by: "human:<id>"
    at: "2026-08-12T00:00:00Z"
related_tasks:
  - id: TASK-XXX
    name: "Task title"
    url: /TASKS.md#TASK-XXX
related_roadmap_items:
  - id: FRAMEWORK-XXX
    name: "Roadmap item"
    url: /ROADMAP.md#FRAMEWORK-XXX
related_decisions:
  - id: DEC-YYY
    name: "Related decision"
    url: /DECISIONS.md#DEC-YYY
last_updated: 2026-08-13
---
```

**Actor convention** (OKF §7): `human:<id>` for people, `<producer>/<version>` for agents/tools (e.g. `apply-agent/glm-5.2`), `process:<id>` for automated processes.

<!-- VEF:ITEMS -->

## Legend

| Status | Meaning |
|---|---|
| accepted | Currently in force |
| deprecated | No longer recommended but not reversed |
| superseded | Replaced by a newer decision (link in `superseded_by`) |

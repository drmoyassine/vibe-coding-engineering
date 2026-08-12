# Decisions

Architectural, product, and technical decisions with context + rationale. This is the **central decision ledger** — all decisions (including those made by AI agents) go here, never in memory files.

> All related references use the **`id + name + url`** pattern. Same-repo URLs are relative; cross-repo/external are absolute.

## Schema

```yaml
---
id: DEC-XXX
title: Short description
status: accepted | deprecated | superseded
context: What problem or situation led to this decision
decision: What we decided
rationale: Why this option over alternatives
consequences: What this means for the system (positive + negative)
superseded_by:               # singular, only when status = superseded
  id: DEC-002
  name: "Newer decision"
  url: /DECISIONS.md#DEC-002
related_vision: []           # array of vision refs (optional)
related_roadmap_items: []    # array of roadmap refs
related_tasks: []            # array of task refs
related_decisions: []        # array of decision refs
tags: []                     # OPTIONAL (OKF)
resource:                    # OPTIONAL (OKF)
log_ref:                     # OPTIONAL — ref to LOG.md section
  date: 2026-01-01
  section: "### ..."
generated:                   # OPTIONAL (OKF trust signal)
  by: "human:<id>"
  at: "2026-01-01T00:00:00Z"
verified:                    # OPTIONAL (OKF trust signal)
  - by: "human:<id>"
    at: "2026-01-01T00:00:00Z"
last_updated: 2026-01-01
---

Full prose expansion of the decision, discussion, alternatives considered.
```

**Field rules:** `superseded_by` is singular (omit unless `status: superseded`). `related_vision`, `related_roadmap_items`, `related_tasks`, `related_decisions` are arrays (empty = `[]`). Decisions link **bidirectionally** to/from vision/roadmap/tasks. `log_ref` points to LOG.md but LOG.md does NOT link back.

---

## Decisions

## DEC-001 — Adopt vibe-engineering-framework

---
id: DEC-001
title: Adopt vibe-engineering-framework
status: accepted
context: Product documentation was scattered — decisions lived in chat logs, memory files, and AI transcripts that vanish after context compaction. No canonical source of truth.
decision: Adopt the vibe-engineering-framework documentation system. All product docs (VISION, ROADMAP, TASKS, DECISIONS) live in version-controlled markdown with YAML frontmatter. Claude Code skills manage them.
rationale: Queryable, diffable, AI-readable — no proprietary lock-in. The id+name+url cross-linking makes relationships traversable. The /apply skill handles migration from scattered sources.
consequences: Requires discipline to maintain. Skills enforce structure. All decisions — including AI-made ones — must go through /decisions add, never memory files.
related_vision: []
related_roadmap_items: []
related_tasks: []
related_decisions: []
tags: [docs, framework]
last_updated: 2026-01-01
---

This decision establishes the documentation substrate for the project. The framework was scaffolded via `vef init`. See [vibe-coding-engineering](https://github.com/drmoyassine/vibe-coding-engineering) for the canonical definition.

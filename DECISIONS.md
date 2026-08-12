# DECISIONS.md

**vibe-coding-engineering Framework Decisions** — Architectural, product, and technical decisions with context and rationale.

Last updated: 2026-08-12

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
last_updated: 2026-08-12
---
```

**Actor convention** (OKF §7): `human:<id>` for people, `<producer>/<version>` for agents/tools (e.g. `apply-agent/glm-5.2`), `process:<id>` for automated processes.

---

## DEC-001 — Use markdown as source of truth for docs

---
id: DEC-001
title: "Use markdown as source of truth for docs"
status: accepted
context: "Need a way to maintain product documentation that's version-controlled, queryable, and AI-readable."
decision: "Use plain markdown files (VISION.md, ARCHITECTURE.md, ROADMAP.md, TASKS.md, DECISIONS.md) as canonical sources. Interactive docs (ROADMAP, BUGS) have paired intake tools (Fider/GitHub Discussions, GitHub Issues) but the canonical doc remains read-only markdown."
rationale: "Markdown is git-native (diffable, mergeable), human-readable, AI-readable, and requires zero infrastructure. SQLite-as-source breaks git history; external tools (GitHub Issues, Fider) are intake mechanisms, not the source."
consequences: "Positive — clean git history, easy to review, AI can read/edit directly. Negative — no native voting/commenting on markdown (hence the paired intake tools)."
generated:
  by: "human:drmoy"
  at: "2026-08-12T00:00:00Z"
related_tasks: []
related_roadmap_items:
  - id: FRAMEWORK-001
    name: "Core docs definition"
    url: /ROADMAP.md#FRAMEWORK-001
last_updated: 2026-08-12
---

This is the foundational decision of the framework. All structured items across ROADMAP.md / TASKS.md / DECISIONS.md use `id + name + url` cross-linking and per-item YAML frontmatter.

---

## DEC-002 — Adopt the Open Knowledge Format (OKF) pattern with product-doc extensions

---
id: DEC-002
title: "Adopt the OKF v0.2 pattern (index.md, log.md, actor convention, trust signals) with product-doc extensions"
status: accepted
context: "The framework's markdown + YAML-frontmatter design independently converged on the same pattern as Google's Open Knowledge Format (OKF) and the LLM-Wiki/OpenKB ecosystem. Aligning explicitly lets us (a) reuse OKF's reserved-filename and trust-signal conventions, (b) position the framework as an OKF extension for product documentation, and (c) be referenceable in media/literature against OKF and OpenKB."
decision: "Adopt the OKF v0.2 conventions that fit product docs: `index.md` (navigation hub + `okf_version`), `log.md` (chronological changelog replacing ad-hoc session memory), the actor convention (`human:<id>` / `<producer>/<version>` / `process:<id>`), and the trust-signal fields (`generated`, `verified`). Add the `resource` and `tags` optional fields. Keep our existing extensions: structured `id + name + url` cross-linking, bidirectional relationships, the four management skills, and multi-repo support."
rationale: "OKF is a vendor-neutral, agent- and human-friendly open spec. Conforming to it costs nothing (we already use markdown + YAML frontmatter) and gains interoperability: any OKF consumer (visualizer, agent, search tool) can read our docs. Our extensions (relationship types, skills, multi-repo) are the differentiated value — the framework is 'OKF for product docs.' Adopting `log.md` also resolves the memory-drift problem: session learnings become a version-controlled changelog instead of gitignored, per-repo auto-memory."
consequences: "Positive — OKF conformance + literature-ready positioning; drift eliminated (LOG.md replaces misplaced MEMORY content); trust signals align with the agent-hallucination guard work (agent-written content can be marked provisional/unverified). Negative — schema grows (more optional fields to document); `log.md` must be maintained (or it rots like any changelog). Attested-Computation fields and `sources` provenance are NOT adopted (out of scope for product-docs)."
generated:
  by: "human:drmoy"
  at: "2026-08-12T00:00:00Z"
verified:
  - by: "human:drmoy"
    at: "2026-08-12T00:00:00Z"
related_tasks: []
related_roadmap_items:
  - id: FRAMEWORK-006
    name: "Migrate studygram-app docs to id+name+url pattern"
    url: /ROADMAP.md#FRAMEWORK-006
last_updated: 2026-08-12
---

**What we adopt from OKF v0.2:**

| OKF concept | Our implementation |
|-------------|--------------------|
| `index.md` (reserved filename) | Repo-root navigation hub with `okf_version` frontmatter |
| `log.md` (reserved filename) | Chronological changelog; replaces session-scoped auto-memory for durable learnings |
| Actor convention (§7) | `generated.by` / `verified.by` use `human:<id>`, `<producer>/<version>`, `process:<id>` |
| Trust signals (`generated`, `verified`) | Optional fields on all items; advisory tiers (Unverified / Machine-confirmed / Human-reviewed) |
| `resource` field | Canonical URI to the underlying artifact (migration, PR, code) |
| `tags` field | Free-form cross-cutting labels |
| Format-not-platform | Git-native, no proprietary lock-in (already true) |

**What we do NOT adopt:** Attested Computation (`runtime`/`executor`/`attester`) — data-pipeline scope, not product docs. `sources` provenance family — deferred until decisions commonly cite external standards.

**Our extensions beyond OKF:** structured `id + name + url` relationship types (`depends_on`, `related_tasks`, `related_decisions`, `roadmap_item`), bidirectional cross-linking, four management skills (`/tasks` `/roadmap` `/bugs` `/decisions`) + `/apply` migration, multi-repo canonical/consumer split.

---

## Legend

| Status | Meaning |
|---|---|
| accepted | Currently in force |
| deprecated | No longer recommended but not reversed |
| superseded | Replaced by a newer decision (link in `superseded_by`) |

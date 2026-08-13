# TASKS.md

**vibe-engineering-framework Tasks** — Concrete work breakdown for the framework itself. Directional themes live in ROADMAP.md (FRAMEWORK-XXX); decisions live in DECISIONS.md.

Last updated: 2026-08-13

---

## Task schema

Each task uses YAML frontmatter. The current field contract is implemented in `src/lib/schemas.mjs`; FRAMEWORK-017 will consolidate it into the canonical machine-readable schema. Related references follow the **`id + name + url`** pattern (relative URL for same-repo, absolute for cross-repo):

```yaml
---
id: TASK-XXX
title: Short description
description: One-line summary
status: pending | in-progress | completed | cancelled
priority: P0 | P1 | P2 | P3
roadmap_item:                 # SINGULAR object — a task belongs to one roadmap item (omit if unlinked)
  id: FRAMEWORK-XXX
  name: "Roadmap item title"
  url: /ROADMAP.md#FRAMEWORK-XXX
assignee:                     # name, or empty
depends_on: []                # array of task refs
related_decisions: []         # array of decision refs (DECISIONS, not LOG)
last_updated: 2026-08-12
---

Full description, acceptance criteria, implementation notes.
```

`roadmap_item` ↔ ROADMAP `related_tasks` must be bidirectional.

---

## TASK-001 — Publish to npm + rename local repo dir (low priority)

---
id: TASK-001
title: "Publish to npm + rename local repo dir (low priority)"
description: "Publish the vef CLI to npm AND rename the on-disk vibe-coding-engineering dir to vibe-engineering-framework — both cosmetic/optional, bundled as one low-priority task"
status: pending
priority: P3
roadmap_item:
  id: FRAMEWORK-011
  name: "Make skills portable across repos"
  url: /ROADMAP.md#FRAMEWORK-011
assignee: drmoy
depends_on: []
related_decisions: []
last_updated: 2026-08-12
---

Two low-priority, optional cleanups bundled into a single task. **Do not treat as in-flight.**

1. **npm publish** — The CLI works locally today via `npm link` / `node bin/vef.mjs`. Publishing makes `npx vibe-engineering-framework init|validate|doctor` available to any repo without a local clone. Gated on `npm login` (same gate as liteparse). Acceptance: `npx vibe-engineering-framework@latest --help` runs from a clean checkout; keep `files: [bin/, src/, templates/]`.
2. **Rename local repo dir** — The on-disk directory is still `vibe-coding-engineering` while the GitHub remote is already `vibe-engineering-framework`. Purely cosmetic — the git remote, package name, and all references are already correct. Rename when convenient (update any local shortcuts / IDE workspace paths).

Neither blocks anything.

## TASK-002 — Write framework ARCHITECTURE.md

---
id: TASK-002
title: "Write framework ARCHITECTURE.md"
description: "Author the framework's own ARCHITECTURE.md (CLI, lib layer, skill model, cross-link topology, OKF conformance)"
status: completed
priority: P2
roadmap_item:
  id: FRAMEWORK-001
  name: "Define the core documents"
  url: /ROADMAP.md#FRAMEWORK-001
assignee: drmoy
depends_on: []
related_decisions: []
last_updated: 2026-08-12
---

Done — `ARCHITECTURE.md` now describes the three layers, document topology, the `vef` CLI + lib layer, the skill model, OKF conformance (DEC-002), package layout, and the consumer lifecycle. This closed the `vef doctor` ARCHITECTURE.md gap.

## TASK-003 — Install the four management skills in the framework repo (dogfood)

---
id: TASK-003
title: "Install the four management skills in the framework repo (dogfood)"
description: "Install /tasks /roadmap /decisions /bugs into the framework's own .claude/skills so it self-manages and vef doctor passes"
status: completed
priority: P2
roadmap_item:
  id: FRAMEWORK-002
  name: "Document the four management skills"
  url: /ROADMAP.md#FRAMEWORK-002
assignee: drmoy
depends_on: []
related_decisions: []
last_updated: 2026-08-12
---

Done — concrete (de-placeholderized) copies of `/tasks`, `/roadmap`, `/decisions`, `/bugs` installed in `.claude/skills/` alongside the existing `/apply`. The framework now manages its own ROADMAP/TASKS/DECISIONS via its own skills, matching the consumer install and clearing the `vef doctor` skill gaps.

## TASK-004 — Add Integrity Core test suite

---
id: TASK-004
title: "Add Integrity Core test suite"
description: "Cover parsing, canonical schema validation, typed graph integrity, CLI behavior, and migration safety fixtures."
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: "Build the VEF Integrity Core"
  url: /ROADMAP.md#FRAMEWORK-017
assignee:
depends_on: []
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. `node --test` now covers field/reference validation, target typing, duplicate IDs, both directions of inverse-link checks, dependency cycles, and fresh scaffold casing/provenance.

**Completed scope:**
- `node --test` is wired into `package.json`.
- Fixtures cover valid/invalid schema data, malformed references, wrong target types, duplicate IDs, bidirectional links, cycles, and scaffold output.
- CLI command-specific integration coverage remains desirable as the command surface grows.

## TASK-005 — Gate the Integrity Core in CI

---
id: TASK-005
title: "Gate the Integrity Core in CI"
description: "Run tests, strict validation, doctor, and package checks on supported platforms."
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: "Build the VEF Integrity Core"
  url: /ROADMAP.md#FRAMEWORK-017
assignee:
depends_on:
  - id: TASK-004
    name: "Add Integrity Core test suite"
    url: /TASKS.md#TASK-004
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. `.github/workflows/validate.yml` runs on pushes and pull requests across Ubuntu and Windows with Node 20. It installs dependencies, runs `npm test`, strict validation, `doctor`, and `npm pack --dry-run`.

**Acceptance:**
- `.github/workflows/validate.yml` runs on pull requests and pushes.
- Linux at minimum; add Windows coverage for filename-case behavior.
- Fails on schema/graph errors, warnings in strict mode, test failures, or an invalid package manifest.

---

## TASK-006 — Define canonical schema and typed relationship model

---
id: TASK-006
title: "Define canonical schema and typed relationship model"
description: "Replace duplicated schema descriptions with one machine-readable model that defines fields, references, inverse links, cardinality, and lifecycle constraints."
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: "Build the VEF Integrity Core"
  url: /ROADMAP.md#FRAMEWORK-017
assignee:
depends_on: []
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. `src/lib/schemas.mjs` is the executable schema/relationship definition used by validation and graph traversal. It defines reference targets, cardinality, inverse fields, scalar constraints, and provenance shape; validation now enforces the associated invariants.

## TASK-007 — Align filename conventions and provenance

---
id: TASK-007
title: "Align filename conventions and provenance"
description: "Adopt lowercase OKF index.md/log.md consistently and remove stale or fabricated scaffold provenance."
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: "Build the VEF Integrity Core"
  url: /ROADMAP.md#FRAMEWORK-017
assignee:
depends_on: []
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. The canonical files are `index.md` and `log.md`; templates, `init`, `doctor`, migration detection, and primary adapter discovery use those names. `init` now stamps process-generated records with the actual timestamp rather than a fabricated human actor/date. Tests verify the exact scaffold filenames.

## TASK-008 — Harden /apply migration trust boundaries

---
id: TASK-008
title: "Harden /apply migration trust boundaries"
description: "Treat discovered repository content as untrusted data, make memory import opt-in, and require deterministic validation before a migration is accepted."
status: completed
priority: P0
roadmap_item:
  id: FRAMEWORK-017
  name: "Build the VEF Integrity Core"
  url: /ROADMAP.md#FRAMEWORK-017
assignee:
depends_on:
  - id: TASK-006
    name: "Define canonical schema and typed relationship model"
    url: /TASKS.md#TASK-006
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. `/apply` now defaults to read-only file evidence and requires explicit `--write`, `--source memory`, and `--source git` intent. Every discovery phase labels repository, memory, Git, and agent payloads as untrusted evidence. Memory is classified as project/personal/sensitive/transient before reconciliation; only project knowledge remains eligible. Orphans become blocked review items instead of fabricated targets. Agent validation is advisory, and the write contract requires staged and post-write `vef validate --strict` passes without automatic commits.

`vef doctor` deterministically audits these security-critical adapter defaults. Regression tests cover both the dogfooded adapter and install template, reject the legacy unsafe defaults, and require both copies to remain identical.

## TASK-009 — Design and implement deterministic query commands

---
id: TASK-009
title: "Design and implement deterministic query commands"
description: "Expose project-memory retrieval without an LLM through list, show, refs, why, graph, and search commands."
status: completed
priority: P1
roadmap_item:
  id: FRAMEWORK-018
  name: "Expose deterministic project queries"
  url: /ROADMAP.md#FRAMEWORK-018
assignee:
depends_on:
  - id: TASK-006
    name: "Define canonical schema and typed relationship model"
    url: /TASKS.md#TASK-006
related_decisions:
  - id: DEC-003
    name: "Make the Integrity Core authoritative and keep agent adapters portable"
    url: /DECISIONS.md#DEC-003
last_updated: 2026-08-13
---

Completed 2026-08-13. A shared read-only project loader now derives records and edges from the canonical parser and relationship schema. `vef list`, `show`, `refs`, `why`, `graph`, and `search` provide stable text output and a versioned `schemaVersion: 1` JSON envelope. Filters are deterministic and case-insensitive, errors remain machine-readable under `--json`, incoming links come from the typed graph, and `why` follows task → roadmap → vision plus relevant decision edges without agent interpretation.

Integration tests cover text and JSON output, repeatability, filters and aliases, normalized dates, typed incoming/outgoing/external references, rationale traversal, graph rendering, body search, ambiguity selectors, and failing exit codes.

---

## Summary

| ID | Title | Status | Priority |
|---|---|---|---|
| TASK-001 | Publish to npm + rename local dir | pending | P3 |
| TASK-002 | Write ARCHITECTURE.md | ✅ completed | P2 |
| TASK-003 | Install 4 management skills (dogfood) | ✅ completed | P2 |
| TASK-004 | Integrity Core test suite | completed | P0 |
| TASK-005 | Integrity Core CI gate | completed | P0 |
| TASK-006 | Canonical schema and typed relationship model | completed | P0 |
| TASK-007 | Filename conventions and provenance | completed | P0 |
| TASK-008 | /apply migration trust boundaries | completed | P0 |
| TASK-009 | Deterministic query commands | completed | P1 |

**Next priority:** TASK-001 is the only remaining local task and remains intentionally P3/cosmetic. New framework product work should start as an explicit roadmap item and linked task.

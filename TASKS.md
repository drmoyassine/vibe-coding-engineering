# TASKS.md

**vibe-engineering-framework Tasks** — Concrete work breakdown for the framework itself. Directional themes live in ROADMAP.md (FRAMEWORK-XXX); decisions live in DECISIONS.md.

Last updated: 2026-08-12

---

## Task schema

Each task uses YAML frontmatter (canonical source: `CLAUDE.md`). Related references follow the **`id + name + url`** pattern (relative URL for same-repo, absolute for cross-repo):

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

## TASK-004 — Add CLI unit tests

---
id: TASK-004
title: "Add CLI unit tests"
description: "Cover frontmatter parsing, schema validation, cross-link orphan/bidirectional detection, and the four commands"
status: pending
priority: P2
assignee:
depends_on: []
related_decisions: []
last_updated: 2026-08-12
---

The `vef` CLI currently ships with no automated tests — `validate`/`doctor` are exercised only by smoke-testing against real repos.

**Acceptance:**
- A test runner (e.g. `node --test`) wired into `package.json` (`npm test`).
- Fixtures: a clean repo (all green) and a broken repo (orphan ref, missing required field, bad status enum, missing back-ref).
- Covers: `parseDoc` / `stringifyItem`, `validateItem` per doc type, `findOrphans`, `checkBidirectional`, and each command's exit code on the fixtures.

## TASK-005 — Add vef validate to CI (GitHub Actions)

---
id: TASK-005
title: "Add vef validate to CI (GitHub Actions)"
description: "Run `vef validate` on PRs that touch framework docs so broken cross-links fail the build"
status: pending
priority: P2
roadmap_item:
  id: FRAMEWORK-008
  name: "Auto-run reconcile skills on doc changes"
  url: /ROADMAP.md#FRAMEWORK-008
assignee:
depends_on:
  - id: TASK-004
    name: "Add CLI unit tests"
    url: /TASKS.md#TASK-004
related_decisions: []
last_updated: 2026-08-12
---

A lightweight GitHub Action that runs `node bin/vef.mjs validate --strict` on PRs touching `*.md` (schema docs). This is the deterministic half of FRAMEWORK-008 (the agentic `/reconcile`-on-PR half is blocked on Claude-in-CI; `vef validate` needs only Node).

**Acceptance:**
- `.github/workflows/validate.yml` triggers on PRs touching `TASKS.md`/`ROADMAP.md`/`DECISIONS.md`/`VISION.md`.
- Fails the check on schema errors or (with `--strict`) dangling/bidirectional warnings.

---

## Summary

| ID | Title | Status | Priority |
|---|---|---|---|
| TASK-001 | Publish to npm + rename local dir | pending | P3 |
| TASK-002 | Write ARCHITECTURE.md | ✅ completed | P2 |
| TASK-003 | Install 4 management skills (dogfood) | ✅ completed | P2 |
| TASK-004 | Add CLI unit tests | pending | P2 |
| TASK-005 | vef validate in CI | pending | P2 |

**Next priority:** TASK-004 (CLI tests — unblocks a confident CI gate). TASK-001 (npm publish + local rename) is low-priority / cosmetic — deferred until convenient.

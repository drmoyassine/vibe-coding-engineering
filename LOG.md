# LOG.md

**vibe-coding-engineering Change Log** — Chronological history of framework updates, decisions, and learnings.

This is an OKF v0.2 `log.md` (reserved filename). Date-grouped entries, newest first. Durable session learnings live here — NOT in private Claude auto-memory (which is gitignored and drifts).

---

## 2026-08-12

### OKF v0.2 adoption + extensions
- **Decision:** [DEC-002](/DECISIONS.md#DEC-002) — adopt the Open Knowledge Format pattern (`index.md`, `log.md`, actor convention, trust signals) with product-doc extensions (structured cross-linking, skills, multi-repo).
- **Why:** framework's markdown+frontmatter design independently converged on OKF; aligning explicitly gains interoperability + literature-ready positioning vs OKF & OpenKB. Adopting `log.md` also kills the memory-drift problem.
- **Created:** this `LOG.md`, repo-root [`index.md`](/index.md), [`DECISIONS.md`](/DECISIONS.md) (DEC-001 + DEC-002).

### `/product-docs` naming ghost resolved
- **Fix:** `/product-docs` was referenced as an invocable skill in CLAUDE.md / AGENTS.md / README.md / VISION.md but never existed. Resolved: `/product-docs` is now the **conceptual umbrella name** for the skill suite; the actual invocable skills are `/tasks`, `/roadmap`, `/bugs`, `/decisions`, `/apply`. All `/product-docs reconcile` references replaced with the real per-doc commands. README status updated (skills ARE built).

### Cross-link URL rule corrected
- **Fix:** VISION.md said "GitHub blob URLs are the canonical reference format" — contradicted the agreed rule. Corrected to: **relative URLs for same-repo** (`/TASKS.md#TASK-001`), **absolute URLs for cross-repo/external** (GitHub Issues).

### Schema status (2026-08-12)
- ✅ `description` present on Task + Roadmap schemas
- ✅ All `related_*` fields use `id + name + url` (relative same-repo, absolute cross-repo)
- ✅ `roadmap_item` / `vision_theme` / `superseded_by` are SINGULAR objects; `depends_on` / `related_*` are PLURAL arrays
- ✅ OKF trust signals (`generated`, `verified`), `resource`, `tags`, actor convention added as OPTIONAL fields (DEC-002)
- ⬜ VISION.md needs frontmatter per theme (studygram-app TASK-006 — deferred)

### Canonical/consumer split confirmed
- **`vibe-coding-engineering`** = framework DEFINITION (canonical schemas here; ships only `/apply`).
- **`studygram-app`** = CONSUMER (ships `/tasks` `/roadmap` `/bugs` `/decisions` `/apply` + the 3 doc files; BUGS = GitHub Issues).

---

## 2026-08-10

### Framework schema alignment (studygram-app conformance)
- studygram-app's 4 skills + 3 docs conformed to canonical `id+name+url` schema. Commits: canonical `b28ec13`, studygram `a51169c`. Earlier same-day: `/apply` install `c7647f6` + initial reformat `d063bb8`.

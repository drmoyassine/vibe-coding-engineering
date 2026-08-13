# log.md

**vibe-engineering-framework Change Log** — Chronological history of framework updates, decisions, and learnings.

This is an OKF v0.2 `log.md` (reserved filename). Date-grouped entries, newest first. Durable session learnings live here — NOT in private Claude auto-memory (which is gitignored and drifts).

---

## 2026-08-13

### Deterministic project queries shipped
- Completed TASK-009 and FRAMEWORK-018. The CLI now exposes `list`, `show`, `refs`, `why`, `graph`, and `search` over one canonical read-only project loader.
- Query text is stable and human-readable; `--json` uses a versioned `schemaVersion: 1` envelope for successes and failures.
- `why` traverses declared task → roadmap → vision and decision edges without an LLM. Integration tests cover filters, aliases, incoming/outgoing/external refs, traversal, graph output, search, normalization, and error exit codes.

### Integrity Core completed
- Replaced the duplicated field descriptions in the CLI with a single machine-readable schema and typed relationship declarations.
- The validator now checks field types, enums, dates, reference objects, target types, complete inverse links, duplicate IDs, dependency cycles, and heading/frontmatter agreement.
- Aligned the canonical OKF filenames to lowercase `index.md` and `log.md`; init templates now generate truthful process/timestamp provenance instead of placeholder claims.
- Completed TASK-004, TASK-006, and TASK-007. `npm test`, `vef validate --strict`, and `vef doctor` pass against the dogfooded repository.
- Completed TASK-005. GitHub Actions now runs the Integrity Core contract on Ubuntu and Windows for every push and pull request, including package-content verification.
- Completed TASK-008 and FRAMEWORK-017. `/apply` is proposal-first and read-only by default; memory/Git and writes require explicit intent, evidence is untrusted, non-project memory is excluded, orphans cannot cause invented entities, and deterministic staged validation is mandatory.
- `vef doctor` now audits the installed `/apply` trust contract. Tests keep the dogfood and install-template copies identical and reject the former unsafe defaults.

### Repositioned VEF around durable project memory
- Rewrote [README.md](/README.md) as the framework's public front door: VEF is now described precisely as a git-native project-memory and integrity layer for AI-assisted engineering.
- **Decision:** [DEC-003](/DECISIONS.md#DEC-003) establishes a portable VEF Core and deterministic structural authority.

---

## 2026-08-12

### OKF v0.2 adoption + extensions
- **Decision:** [DEC-002](/DECISIONS.md#DEC-002) — adopt the Open Knowledge Format pattern (`index.md`, `log.md`, actor convention, trust signals) with product-doc extensions.

# Changelog

All notable changes to Vibe Engineering Framework are recorded here. Durable architectural context remains in `DECISIONS.md`; this file is the public release history.

## Unreleased

## 0.3.1 — 2026-08-14

### Fixed

- Malformed or incomplete writer-lease files are now diagnosed instead of permanently bricking every mutation. Explicit `vef recover leases` writes additive quarantine markers, while expired, dead, released, and orphan-renewal families are settled and swept without relying on deletion.
- Roadmap creation now allocates `ROADMAP-001` in a fresh project, continues one coherent existing numeric family, and reports mixed-family ambiguity instead of requiring IDs in every case.
- Authority-only title repair no longer requires an empty proposal file.

### Changed

- `vef doctor` inventories active, malformed, quarantined, expired, dead, released, settled, and orphan-renewal lease state with an exact remedy.
- `vef recover` is visible in normal help, and `vef update --help` documents the proposal grammar.

## 0.3.0 — 2026-08-14

### Added

- Preview-first `vef create` and `vef update`, plus adapter batch proposals, over one exported transaction API.
- Intent-first versioned recovery journals with explicit roll-forward/rollback and strict unresolved-journal blocking.
- Stale-tolerant PID/host/timestamp writer leases and Windows/synchronized-folder retry behavior.
- Transaction-managed `last_updated` and `modified: { by, at }` provenance, inverse relationship closure, and schema/transaction package exports.
- Explicit `vef update --authority frontmatter|heading` repair for a named title mismatch without relaxing unrelated preflight failures.

### Changed

- `/tasks`, `/roadmap`, `/decisions`, and `/apply` now delegate canonical serialization, inverse links, projection, and writes to the transaction core.
- `/apply` returns structured operation proposals instead of canonical item-file Markdown or snapshot/copy rollback instructions.

### Safety

- Hard process termination at every target-write boundary is recoverable from hash-verified before/after content.
- Cleanup failures are warnings after success; settled journal/lease debris does not block later work.

## 0.2.0 — 2026-08-14

### Added

- `vef setup` as the idempotent installation, adoption, upgrade, repair, projection, validation, and enforcement lifecycle.
- `vef check` as the single strict read-only local and CI acceptance gate.
- Safe fresh-setup preflight and managed, version-pinned GitHub enforcement deployment with custom-CI preservation.

### Changed

- Normal CLI help now presents only setup, check, doctor troubleshooting, and read-only queries.
- Legacy lifecycle commands and flags remain callable for compatibility but are hidden from the normal adoption path.
- Public docs and install templates teach one update path: run the latest setup, reconcile meaning only when reported, then check.

## 0.1.0 — 2026-08-13

### Added

- Git-native canonical project memory for Vision, Architecture, Roadmap, Tasks, Decisions, Log, and external issue references.
- One-file-per-item storage under `docs/` with deterministic committed reading ledgers.
- A canonical schema, typed relationships, bidirectional-link checks, cycle/duplicate detection, provenance validation, and strict CI enforcement.
- Deterministic `list`, `show`, `refs`, `why`, `graph`, and `search` queries with versioned JSON output.
- `vef init`, read-only `vef doctor`, non-destructive `vef doctor --fix`, and advanced migration/projection commands.
- Optional Claude Code adapters for tasks, roadmap, decisions, bugs, and guarded evidence migration.
- Cross-platform package smoke testing from the exact npm tarball candidate.

### Safety

- Existing consumer-owned agent adapters are never overwritten.
- Semantic ambiguity blocks structural repair before any file changes.
- Generated ledgers are checked for reproducible projection drift.
- Agent evidence is untrusted and proposal-first; writes require explicit intent and deterministic validation.

### Known limits

- General-purpose transactional `create` and `update` operations are planned, not shipped.
- The lightweight human review workspace is planned, not shipped.
- VEF validates documented project state; it does not prove that implementation code matches every documented claim.

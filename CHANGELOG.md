# Changelog

All notable changes to Vibe Engineering Framework are recorded here. Durable architectural context remains in `DECISIONS.md`; this file is the public release history.

## Unreleased — targeting 0.1.0

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

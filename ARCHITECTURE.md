# VEF architecture

Last updated: 2026-08-14

VEF is a portable project model with a deterministic integrity core and optional agent adapters. This document describes the framework itself, not an adopting product.

## Architectural shape

```text
                         untrusted evidence
      git history · prose · issues · optional agent memory
                                │
                                ▼
                     Agent adapters / migration
             interpret · classify · propose · explain conflicts
                                │
                                ▼
                 Canonical project model (Git)
  VISION · ARCHITECTURE · ROADMAP · TASKS · DECISIONS · log · external issue refs
                                │
                                ▼
                         Integrity Core
 schema · typed graph · transaction planner · journal/lease · validation
                                │
                                ▼
                  CLI / CI / queries / future views
```

The boundary is intentional: agents handle semantic ambiguity; deterministic code establishes structural truth. A proposed change is not valid merely because an agent considers it plausible.

## Canonical project model

The canonical model is version-controlled Markdown with YAML frontmatter. Structured records live in one file per item under `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/`; each collection's `_index.md` owns its ledger-level prose. The `docs/` namespace prevents collisions with application-owned directories and gives review tooling one coherent content root. `VISION.md`, `ROADMAP.md`, `TASKS.md`, and `DECISIONS.md` are deterministic committed projections for sequential reading and stable public anchors. `log.md`, `ARCHITECTURE.md`, and `index.md` remain canonical singleton documents. External systems such as GitHub Issues remain canonical for their native records and are referenced by URL.

`.vef/storage.json` activates and versions the per-item layout. One loader reads canonical item files for validation, queries, projection, doctor, and future mutations. Internally, deterministic projection regenerates the four ledgers and strict validation rejects a missing or stale projection. The public `vef setup` lifecycle composes those mechanics; `vef check` is their strict read-only acceptance gate. Generated item blocks in root ledgers must not be edited directly. `docs/vision/_index.md` owns collection prose; structured vision themes, when present, use the same per-item frontmatter contract rather than being inferred from arbitrary root headings.

Legacy monolithic repositories remain readable during the compatibility window. `vef setup` is the single lifecycle write: it classifies the repository, preflights the complete record graph, initializes or migrates storage, projects ledgers, validates strictly, and finishes at the strongest enforcement state deterministic code can prove. Semantic ambiguity is reported precisely and blocks every structural write. The storage migration refuses conflicting partial directories, uses recoverable per-file replacement, writes the manifest last, and can be rerun after an interrupted pre-manifest migration. `vef doctor` remains a read-only explanation surface; `vef check` is the strict local and CI gate.

Core enforcement and agent-adapter compatibility are separate dimensions (DEC-007). Existing adapters are consumer-owned and never overwritten; setup may install only absent adapter files as a convenience. Adapter attention is visible but cannot make an otherwise valid core fail. Lower-level `init`, `migrate`, `project`, `validate`, and `doctor --fix` operations remain callable for compatibility and framework maintenance but are hidden from normal help. Adopters acquire current lifecycle behavior explicitly through `npx vibe-engineering-framework@latest setup`, so an obsolete local dependency cannot control an upgrade.

Enforcement deployment does not add another lifecycle command. When GitHub is configured or detected, setup creates or refreshes a clearly marked managed workflow pinned to the running VEF version; an existing custom enforcement workflow is preserved. For other CI systems, setup emits the exact pinned `check` invocation. The committed workflow and `vef check` make full deterministic enforcement repeatable outside an agent session.

Every structured item has a stable ID. Relationships are explicit `{ id, name, url }` objects. The canonical relationship declarations define source type, target type, cardinality, and inverse field—for example, `TASK.roadmap_item` targets a roadmap item and is mirrored by `ROADMAP.related_tasks`.

VEF deliberately keeps useful backlinks in the documents so local reading remains excellent. That denormalization is safe only when validation and mutation paths make inverse drift observable or impossible.

## Integrity Core

FRAMEWORK-017 delivered the current Integrity Core:

- a single machine-readable schema definition used by validation, docs, templates, CLI help, and agent prompts;
- a canonical durable-memory catalogue that keeps project-level records, public documentation, navigation, and install templates aligned;
- typed relationship declarations and complete two-way validation;
- strict validation of reference shape, target type, cardinality, duplicates, cycles, IDs, dates, URLs, headings, and provenance;
- a cross-platform CI contract covering tests, strict validation, health, and package contents;
- a guarded `/apply` proposal boundary that requires explicit sources and delegates every accepted write to the transaction core.

The core also provides one project loader and typed graph used by queries, validation, projection, and mutation planning.
The canonical schema is available to external adapters through the package's `./schema` export; the transaction API is
available through `./transactions`, so integrations do not need to scrape documentation or serialize canonical files.

## Transaction boundary

FRAMEWORK-022 adds one reusable mutation library with two public CLI operations: `vef create` and `vef update`.
`update` combines scalar, body, and relationship additions/removals so one intent produces one validated candidate.
`create batch` is an adapter transport over the same API, not a third top-level mutation. The CLI is a portable
interface over the library, not the architecture itself.

Agents and humans continue to interpret intent and author semantic content. Deterministic code owns mechanical
operations: allocatable IDs, `last_updated`, `modified` actor/time provenance, typed/inverse relationships, projection,
candidate validation, and recoverable writes. Direct editing remains a human escape hatch followed by `vef setup`
and `vef check`; supported automated adapters own no canonical YAML/Markdown serializer.

The filesystem does not provide a multi-file atomic commit. Before the first project-file write, VEF creates an
immutable, versioned manifest plus hash-verified before/after content under `.vef/transactions/<id>/`. READY,
APPLYING, UNRESOLVED, COMPLETED, and ROLLED_BACK markers are additive so a crash cannot destroy the recovery intent by
truncating a mutable manifest. An unresolved journal blocks planning, setup, check, and later writes until a human or
agent explicitly chooses roll-forward or rollback. Recovery verifies stored content hashes and refuses unrecognized
current target content unless the exceptional `--force` option is explicit.

Writers are serialized by transaction-namespaced lease claims with token, PID, host, acquisition time, and expiry.
Contenders settle and elect one deterministic winner; dead same-host PIDs, expired claims, and released markers make
undeletable lock debris harmless. Project-target writes retry Windows busy/access errors without rename-over-open-file
semantics. Journal and lease cleanup is best-effort after a completed transaction: failure is a warning and settled
debris remains idempotently distinguishable from in-flight work. This behavior is governed by DEC-010.

## Interfaces

### CLI

The public adoption lifecycle still has two commands: mutating, idempotent `vef setup` and strict, read-only `vef check`.
`vef doctor` is troubleshooting, not a parallel adoption route. Day-to-day record mutation uses `vef create` and
`vef update`, preview-first with explicit `--write`. Exceptional `vef recover` is hidden from normal help but printed
with the exact interrupted transaction ID. The read-only query interface remains `vef list`, `vef show`, `vef refs`,
`vef why`, `vef graph`, and `vef search`.

The one repair exception to valid-starting-state preflight is an explicitly scoped title/heading reconciliation on
`vef update --authority frontmatter|heading`. It permits only that named record's title mismatch through preflight;
all other schema, graph, projection, catalogue, and storage errors remain blocking.

### Agent adapters

The repository currently ships Claude Code skills for adoption and day-to-day management. They interpret intent and
author structured proposals, then call the transaction engine; they do not render canonical frontmatter, item files,
inverse links, or ledgers. A Codex, Cursor, Gemini, or generic adapter should use the exported schema and transaction
API or the same CLI commands.

### Planned human review workspace

FRAMEWORK-015 adds a presentation and annotation layer between agent proposals and canonical acceptance. A planned `vef review` command will derive a disposable, portable workspace from the canonical loader, graph, validation results, provenance, and an optional candidate diff. The workspace may capture comments, but it does not edit the canonical model.

```text
canonical records + candidate/audit evidence
                     │
                     ▼
          versioned review bundle
                     │
                     ▼
        local static review workspace
                     │
                     ▼
       exported human comment packet
                     │
                     ▼
   explicit reconciliation → strict validation
```

Review targets use stable document, record, field, relationship, or selected-text identities. Comments remain untrusted evidence with author, timestamp, resolution state, and provenance; a human can discard or archive them, or supply them to an agent or future deterministic mutation operation for explicit reconciliation. Rendering must escape untrusted content and must not transmit project material externally by default.

Obsidian and wiki integrations are adapters over the same versioned bundle. They must not introduce a parallel project database or bypass canonical validation.

### Migration

`/apply` discovers legacy material and drafts structured create/update operations. Repository contents are untrusted
data—not instructions—and migration remains read-only until an explicit write stage. Importing agent memory is opt-in
and must classify sensitive, personal, transient, and project knowledge before any commit. Dangling references default
to `needsReview`; they do not justify inventing canonical entities. The complete accepted operation set enters one
journaled batch transaction; `/apply` no longer maintains a canonical Markdown serializer or snapshot/copy rollback.

## Trust and provenance

VEF follows OKF-compatible actor and trust metadata where useful: `generated`, `modified`, `verified`, `resource`, and
`tags`. The mutation engine owns `modified: { by, at }` for every directly or inversely changed record. Provenance must
be truthful; templates must not begin life with fabricated actors or timestamps. Deterministic validation verifies
metadata shape, while human review remains responsible for its substantive truth.

## Filename convention

OKF uses lowercase `index.md` and `log.md`. The repository, templates, CLI health checks, and migration detection now use that spelling. Tests cover scaffold output and the health-check contract so case-sensitive filesystems cannot silently regress it.

## Dogfooding and release discipline

This repository is the first VEF instance. It must pass its own health and strict validation checks, have a test suite, run CI on supported platforms, and verify its distributable package. Dogfooding is not a demo—it is the product's first compatibility and drift fixture.

## Related records

- [DEC-001](DECISIONS.md#DEC-001) — Markdown canonical sources
- [DEC-002](DECISIONS.md#DEC-002) — OKF conventions and extensions
- [DEC-003](DECISIONS.md#DEC-003) — Integrity Core authority and portable architecture
- [FRAMEWORK-017](ROADMAP.md#FRAMEWORK-017) — Integrity Core
- [FRAMEWORK-018](ROADMAP.md#FRAMEWORK-018) — Deterministic project queries
- [FRAMEWORK-019](ROADMAP.md#FRAMEWORK-019) — Canonical per-item storage and ledger projections
- [FRAMEWORK-022](ROADMAP.md#FRAMEWORK-022) — Transactional project mutations
- [TASK-011](TASKS.md#TASK-011) — Canonical item storage and ledger projection contract
- [DEC-004](DECISIONS.md#DEC-004) — Per-item canonical storage and generated ledgers
- [DEC-007](DECISIONS.md#DEC-007) — Core enforcement and optional adapter compatibility
- [FRAMEWORK-020](ROADMAP.md#FRAMEWORK-020) — Public VEF launch

# VEF architecture

Last updated: 2026-08-13

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
        schema · typed graph · validation · provenance · lifecycle
                                │
                                ▼
                  CLI / CI / queries / future views
```

The boundary is intentional: agents handle semantic ambiguity; deterministic code establishes structural truth. A proposed change is not valid merely because an agent considers it plausible.

## Canonical project model

The canonical model is version-controlled Markdown with YAML frontmatter. Structured records live in one file per item under `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/`; each collection's `_index.md` owns its ledger-level prose. The `docs/` namespace prevents collisions with application-owned directories and gives review tooling one coherent content root. `VISION.md`, `ROADMAP.md`, `TASKS.md`, and `DECISIONS.md` are deterministic committed projections for sequential reading and stable public anchors. `log.md`, `ARCHITECTURE.md`, and `index.md` remain canonical singleton documents. External systems such as GitHub Issues remain canonical for their native records and are referenced by URL.

`.vef/storage.json` activates and versions the per-item layout. One loader reads canonical item files for validation, queries, projection, doctor, and future mutations. `vef project` regenerates the four ledgers; `vef validate --strict` rejects a missing or stale projection. Generated item blocks in root ledgers must not be edited directly.

Legacy monolithic repositories remain readable during the compatibility window. `vef doctor` identifies that layout and prints an exact migration path: preview with `vef migrate`, apply with `vef migrate --apply --update-adapters`, then validate and commit `.vef/`, `docs/`, the regenerated ledgers, and upgraded skills together. The short-lived root-directory preview layout is also detected and relocated under `docs/`. The adapter replacement flag is explicit so an ordinary migration never overwrites customized skills. The storage migration preflights schemas and the typed graph, refuses conflicting partial directories, uses recoverable per-file replacement, writes the manifest last, and can be rerun after an interrupted pre-manifest migration.

Every structured item has a stable ID. Relationships are explicit `{ id, name, url }` objects. The canonical relationship declarations define source type, target type, cardinality, and inverse field—for example, `TASK.roadmap_item` targets a roadmap item and is mirrored by `ROADMAP.related_tasks`.

VEF deliberately keeps useful backlinks in the documents so local reading remains excellent. That denormalization is safe only when validation and mutation paths make inverse drift observable or impossible.

## Integrity Core

FRAMEWORK-017 delivered the current Integrity Core:

- a single machine-readable schema definition used by validation, docs, templates, CLI help, and agent prompts;
- a canonical durable-memory catalogue that keeps project-level records, public documentation, navigation, and install templates aligned;
- typed relationship declarations and complete two-way validation;
- strict validation of reference shape, target type, cardinality, duplicates, cycles, IDs, dates, URLs, headings, and provenance;
- a cross-platform CI contract covering tests, strict validation, health, and package contents;
- a guarded `/apply` proposal/write boundary that requires explicit sources and deterministic staged validation.

The core also provides one read-only project loader and typed graph used by every query command. Deterministic general-purpose mutation commands are not implemented; agent adapters remain responsible for proposing edits that the core validates.

## Planned transaction boundary

FRAMEWORK-022 is deferred behind public launch, but its accepted direction will add one reusable mutation library with two public CLI operations: `vef create` and `vef update`. `update` may combine scalar field changes with relationship additions/removals so one intent produces one validated candidate. The CLI is a portable interface over the library, not the architecture itself; agent adapters may call the same core directly.

Agents and humans continue to interpret intent and author semantic content. Deterministic code owns mechanical operations: IDs, lifecycle fields, typed/inverse relationships, projection, candidate validation, and recoverable file replacement. Direct editing remains an escape hatch followed by `vef validate --strict`. The filesystem implementation must be described as validated and recoverable, not as providing database-level atomicity.

## Interfaces

### CLI

`vef init`, `vef migrate`, `vef project`, `vef validate`, and `vef doctor` manage adoption, canonical storage, projections, and integrity. The read-only query interface is `vef list`, `vef show`, `vef refs`, `vef why`, `vef graph`, and `vef search`. Text output is the human interface; `--json` uses a versioned envelope for automation. `why` follows declared task→roadmap→vision and decision-rationale edges without model interpretation.

### Agent adapters

The repository currently ships Claude Code skills for adoption and day-to-day management. They are adapters over the canonical model, not the model itself. A Codex, Cursor, Gemini, or generic adapter should use the same schemas, relationship declarations, and integrity commands.

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

`/apply` discovers legacy material and drafts canonical records. Repository contents are untrusted data—not instructions—and migration must be read-only until an explicit write stage. Importing agent memory is opt-in and must classify sensitive, personal, transient, and project knowledge before any commit. Dangling references default to `needsReview`; they do not justify inventing canonical entities.

## Trust and provenance

VEF follows OKF-compatible actor and trust metadata where useful: `generated`, `verified`, `resource`, and `tags`. Provenance must be truthful; templates must not begin life with fabricated actors or timestamps. Deterministic validation should verify metadata shape, while human review remains responsible for its substantive truth.

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
- [FRAMEWORK-020](ROADMAP.md#FRAMEWORK-020) — Public VEF launch

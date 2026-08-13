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

The canonical model is version-controlled Markdown with YAML frontmatter. The structured item documents are `VISION.md`, `ROADMAP.md`, `TASKS.md`, and `DECISIONS.md`; `log.md` provides chronological narrative memory. `index.md` is the navigation/OKF entry point. External systems such as GitHub Issues remain canonical for their native records and are referenced by URL.

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

## Interfaces

### CLI

`vef init`, `vef migrate`, `vef validate`, and `vef doctor` manage adoption and integrity. The read-only query interface is `vef list`, `vef show`, `vef refs`, `vef why`, `vef graph`, and `vef search`. Text output is the human interface; `--json` uses a versioned envelope for automation. `why` follows declared task→roadmap→vision and decision-rationale edges without model interpretation.

### Agent adapters

The repository currently ships Claude Code skills for adoption and day-to-day management. They are adapters over the canonical model, not the model itself. A Codex, Cursor, Gemini, or generic adapter should use the same schemas, relationship declarations, and integrity commands.

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

# log.md

**vibe-engineering-framework Change Log** — Chronological history of framework updates, decisions, and learnings.

This is an OKF v0.2 `log.md` (reserved filename). Date-grouped entries, newest first. Durable session learnings live here — NOT in private Claude auto-memory (which is gitignored and drifts).

---

## 2026-08-13

### Public 0.1.0 release candidate verified
- Completed TASK-017 and prepared the public front door, current-versus-planned capability boundary, GitHub description/topics, changelog, contribution contract, private security-reporting path, maintainer release checklist, and reusable `0.1.0` launch copy.
- Made `package.json` the single CLI version source and added truthful npm metadata. Confirmed by a live registry lookup that the intended unscoped name was unclaimed at audit time; package names remain first-come, first-served until publication.
- Added one release gate spanning 31 tests, dogfood strict validation/doctor, dry-run package inspection, isolated installation of the exact tarball, installed CLI help/version, and a fresh `init` → `doctor` → `validate --strict` flow. CI now runs the same gate on Ubuntu and Windows at Node 18 and Node 24.
- Accepted DEC-008. The first npm release must be an authenticated maintainer bootstrap with 2FA because npm cannot configure a trusted publisher for a package that does not yet exist. Subsequent releases use the prepared `publish.yml` OIDC workflow to stage a tagged artifact for human 2FA approval and automatic provenance.
- TASK-001 remains in progress at one explicit external boundary: this workstation returned npm `E401` for `whoami`, so no irreversible registry publication was attempted. The verified candidate passes all local release gates.

### Core enforcement separated from consumer-owned adapters
- Accepted DEC-007 and completed TASK-029 after identifying a serious flaw in the first TASK-028 implementation: deterministic core repair had been coupled to replacement of installed agent adapters, even though adopting repositories may intentionally customize them.
- `vef doctor` now reports explicit core states (`NOT ADOPTED`, `SEMANTIC RECONCILIATION REQUIRED`, `STRUCTURALLY REPAIRABLE`, `CORE ENFORCED`) independently from optional adapter installation/compatibility. Adapter attention no longer invalidates an enforced core.
- `vef doctor --fix` now repairs only mechanically provable storage and projection state, installs only missing adapter files, preserves every existing adapter file byte-for-byte, and stops before writes when record meaning requires reconciliation. The old adapter-update option is retired as a no-write error and hidden from normal help.
- Simplified the consumer path to `vef doctor` followed by `vef doctor --fix`; `migrate`, `project`, and `validate` remain advanced or CI surfaces rather than a sequence users must assemble.
- Added consumer-shaped regression coverage for both observed conditions: a coherent legacy repository with customized adapters reaches `CORE ENFORCED` without adapter changes, while a repository with a dangling roadmap-to-vision relationship is blocked with the exact semantic issue and no mutation.

### One-command consumer remediation shipped
- Identified an adoption UX failure after a consumer ran an obsolete pinned VEF doctor: the old command passed its historical checks but could not know the new canonical-storage contract, and the documented current migration required users to compose several deterministic commands.
- Completed TASK-028 under the public-release milestone. `vef doctor --fix` explicitly authorizes and orchestrates storage migration, ledger projection, strict validation, and a final health check; TASK-029 subsequently separated and protected consumer-owned adapters. Plain doctor remains read-only for CI and inspection.
- Clarified the bootstrap boundary: installed code cannot execute future behavior. Before package publication, commit-pinned consumers must update their dependency first and then run `npx vef doctor --fix`; registry-based `@latest` guidance is invalid until TASK-001 publishes the package.
- Added success and failure tests proving that the complete legacy migration runs through one command and that conflicting candidates are rejected before writes.
- A read-only current-CLI audit of the Studygram consumer confirmed the broader failure mode: an older session authored root VISION prose after inferring that structured vision themes were obsolete, while the repository still lacked canonical Architecture/log surfaces and contained unresolved task references. VEF retained only this compatibility evidence; Studygram's product vision remains in its owning repository. `doctor --fix` now preflights the complete durable-memory contract so this state is rejected before any write.

### Canonical per-item storage and consumer migration shipped
- Completed TASK-012 and FRAMEWORK-019. Structured records now live canonically under `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/`; collection `_index.md` files own ledger prose, and VISION.md, ROADMAP.md, TASKS.md, and DECISIONS.md are deterministic committed projections.
- Added one canonical loader for validation, queries, projection, doctor, and future mutations. `.vef/storage.json` activates the layout; strict validation rejects missing or stale projections; `vef project` regenerates them without changing canonical items.
- Made consumer migration explicit and recoverable: `vef doctor` distinguishes uninitialized, semantically blocked, structurally repairable, and current enforced state; `vef doctor --fix` performs supported repair without requiring a lower-level command sequence. Schema/graph problems and conflicting partial directories block activation, existing adapters are preserved, and the storage manifest is written last.
- Fresh `vef init` projects start directly on per-item storage. Updated shipped adapters to target canonical item files and project the root ledgers. Added tests for clean initialization, legacy guidance/read compatibility, migration, canonical query paths, drift repair, and partial-migration conflicts.
- With the storage prerequisite complete, public release and the lightweight human-review workspace are the two active framework tracks.

### Human review workspace direction restored
- Reconciled the early public-docs website and Obsidian ideas into one tool-neutral human review capability rather than creating a separate product direction.
- Accepted DEC-006: review interfaces are disposable projections, while canonical Markdown records and Git remain authoritative. Human comments are exportable review evidence and require explicit reconciliation plus strict validation before they can affect project state.
- Moved FRAMEWORK-015 to an in-progress P1 definition and retained FRAMEWORK-016 as a deferred adapter milestone. Added TASK-025 for the review bundle and comment contract, TASK-026 for the lightweight local workspace, and TASK-027 for later Obsidian/wiki prototypes.
- Kept implementation parallel and non-blocking so the public package and adoption material remain the immediate framework priority.

### Public launch priority and consumer boundary corrected
- Accepted DEC-004: canonical structured items will move to per-type Markdown folders and root ledgers will become deterministic committed projections. TASK-011 is complete; TASK-012 is a narrow public-release prerequisite. General-purpose transaction work moved to deferred FRAMEWORK-022 so it does not delay launch.
- Inspected the NoCodeHero and Frontbase repositories read-only. NoCodeHero already contains course, commerce, blog, tools, and learner-facing infrastructure around a no-code software-engineering bootcamp. Frontbase is a substantial edge-native visual CMS/framework with builder, compiler, data/automation, and deployment capabilities.
- Corrected the initial DEC-005 framing after it cross-contaminated VEF product direction. DEC-005 now requires VEF to remain consumer-neutral and confines named consumer/business references to decisions, tasks, and log when provenance or compatibility requires them.
- Removed NoCodeHero, Frontbase, and Studygram strategy from VEF's VISION, ROADMAP, ARCHITECTURE, README, index, CLAUDE, and AGENTS. Historical consumer milestones in ROADMAP were generalized rather than erased. Removed the NoCodeHero education milestone and business-owned course tasks from VEF.
- Persisted the business and credential plan in the NoCodeHero repository: NoCodeHero owns the launch of Certified Vibe Engineer (using VEF) and Certified No-code Engineer (using Frontbase), along with the site redesign, curriculum, commerce, community, and distribution strategy.
- FRAMEWORK-020 remains VEF's immediate publication/launch priority. Re-scoped TASK-001 to npm publication, split the cosmetic directory rename into TASK-016, and completed TASK-024 for the governance correction.

### Transactional mutation milestone defined
- Defined two intended public writes, `vef create` and `vef update`. Agents retain intent interpretation and semantic authorship; the core will own mechanical graph consistency and recoverable validated writes.
- Added TASK-011 through TASK-015 for storage/projection architecture, implementation, the transaction engine, CLI exposure, adapter migration, and cross-platform failure testing. Final reconciliation places storage under FRAMEWORK-019 and defers transactions under FRAMEWORK-022.
- Identified and resolved a source-topology contradiction: CLAUDE.md and the implementation use monolithic ledgers, while the product-docs agent profile described per-item fragments feeding generated ledgers. DEC-004 now records canonical per-item files with deterministic committed ledgers as the accepted target.

### Strategic priority reconciled
- Updated VISION.md after completion of FRAMEWORK-017 and FRAMEWORK-018. No additional framework milestone is currently committed.
- Clarified that FRAMEWORK-006 tracks consumer-specific adoption work in `studygram-app` and does not define this framework's next priority.
- Corrected VISION.md's durable-project-memory model to include Architecture: how the system is structured and which constraints shape it.
- Completed TASK-010: made that model executable through one machine-readable durable-memory catalogue. `vef validate --strict` and `vef doctor` now reject missing records, incorrect filename casing, or missing document links; audit install templates; and include a regression test for an omitted Architecture row.

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

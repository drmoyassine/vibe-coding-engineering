# log.md

**vibe-engineering-framework Change Log** — Chronological history of framework updates, decisions, and learnings.

This is an OKF v0.2 `log.md` (reserved filename). Date-grouped entries, newest first. Durable session learnings live here — NOT in private Claude auto-memory (which is gitignored and drifts).

---

## 2026-08-14

### VEF 0.3.0 transaction release published and verified
- Merged PR #2 after all eight Ubuntu/Windows release jobs passed, tagged merge commit `0079a24` as `v0.3.0`, and staged the exact artifact through the trusted GitHub OIDC publisher. Human 2FA approval made `vibe-engineering-framework@0.3.0` public with the `latest` tag.
- Verified registry SHA-1 `0caa047911a7556211da00feee766b31a503af2b`, SHA-512 `sha512-dsKA7tETUyeInFHild0aTLvTzB6GgaJetrKPkt9nxNmU78+29CedPovGjehYVhAmZfGUQRCtqkr3bJP0rcr72w==`, SLSA provenance, an empty staged-package queue, and a clean public-registry `setup` followed by `check`.
- Published the matching GitHub Release. The transaction writer, exported schema/API, adapter writer boundary, explicit recovery, Windows/synchronized-folder behavior, and narrow title-authority repair are now the public 0.3.0 contract.

### Recoverable transaction writer completed and dogfooded
- Completed FRAMEWORK-022 and TASK-013 through TASK-015 as one writer-boundary release unit. `vef create` and `vef update` preview complete candidates by default; explicit `--write` routes single or adapter-batch operations through the same exported transaction API.
- Implemented DEC-010 with immutable versioned manifests, hash-verified before/after content, additive state markers, renewable PID/host/timestamp lease claims, Windows busy-write retries without rename-over-target, non-fatal cleanup debris, and explicit forward/rollback recovery. Unresolved journals now block planning, validation/check, setup, projection, migration, and later mutations.
- Removed independent canonical serializers from `/tasks`, `/roadmap`, `/decisions`, and `/apply`. Adapters own semantic proposal data; the core owns IDs, lifecycle dates, `modified` provenance, canonical references, inverse links, ledgers, validation, and recovery.
- Added failure tests for stale previews, malformed starting graphs/journals, invalid values, idempotency, competing and stale leases, destination-busy retries, cleanup failure, thrown interruptions, and real child-process termination at every write boundary. The 17-record engine replay reached strict integrity on its first transaction pass with no manual inverse repair; it is explicitly not presented as a controlled agent-performance evaluation.
- Dogfooded the new writer on VEF itself: previewed and completed TASK-013, then used one batch transaction to complete TASK-014, TASK-015, and FRAMEWORK-022. Public examples/distribution and the lightweight review workspace are now the next framework tracks.

### VEF 0.2.0 published and transaction work activated
- Merged PR #1, tagged merge commit `e5b37fb` as `v0.2.0`, passed the tagged release gate, and staged the package through the trusted GitHub OIDC publisher. Human 2FA approval made `vibe-engineering-framework@0.2.0` public with signed provenance and the `latest` tag.
- Matched npm SHA-1 `9fa04f7f8cd235b101c83870743ccec522d486da` and SHA-512 integrity to the verified candidate, published the matching GitHub Release, and passed public-registry acquisition, clean fresh `setup`, and `check`.
- Proved representative consumer upgrades with public latest. Studygram was already current and remained idempotent; NoCodeHero was semantically coherent and public setup regenerated four stale derived ledgers without changing canonical records or consumer-owned adapters/CI. Frontbase remains independently planned but has not adopted VEF canonical storage, so it was not misrepresented as an upgrade proof.
- Completed TASK-031. Promoted FRAMEWORK-022 to active P0 and started TASK-013 because independent end-to-end use confirmed that manual inverse-link bookkeeping is the largest remaining inconsistency between VEF's deterministic principles and its authoring experience.

### Transaction recovery and writer boundary sharpened before implementation
- Accepted corrections from the independent QA review: the executable schema was already authoritative, partial repair was not automatically safer, and the public 0.1 CI/package observations were superseded by 0.2.
- Accepted DEC-010 before committing the first transaction-engine draft. `.vef/transactions` owns a versioned intent-first journal and stale-tolerant lease lock; Git remains post-transaction evidence because valid consumer worktrees may already be dirty.
- Made Windows and synchronized folders part of TASK-013's initial matrix. Cleanup failure cannot reverse a successful result, unresolved journals require explicit verified recovery, and concurrent agents must serialize through token/PID/host/timestamp leases that tolerate stale files.
- Coupled TASK-014 and TASK-015 into one release boundary so supported automated adapters become thin transaction clients rather than retaining a second YAML writer. Froze the independent 17-record manual-authoring trace under `docs/evaluations/` for a before/after transaction evaluation.

## 2026-08-13

### Two-command adoption lifecycle becomes the launch gate
- Paused TASK-018 and TASK-019 after recognizing that the 0.1 lifecycle still exposed internal migration, repair, projection, and strictness phases to adopters.
- Accepted DEC-009 and completed TASK-030. `vef setup` now owns fresh installation, compatible upgrades, safe repair, ledger projection, strict validation, enforcement reporting, and GitHub CI deployment; `vef check` is the single read-only local/CI gate; doctor is troubleshooting only.
- Hidden compatibility paths preserve 0.1 callers while normal help removes `init`, `migrate`, `project`, `validate`, and `doctor --fix`. Setup preflights fresh-surface conflicts, preserves existing adapters and custom CI, and stops before structural writes when project meaning is unresolved.
- Opened TASK-031 as the immediate P0 gate: publish `0.2.0`, verify the public package, and prove representative consumer upgrades using only latest setup, explicit semantic reconciliation when reported, and check.

### VEF 0.1.0 published and independently verified
- Published `vibe-engineering-framework@0.1.0` publicly to npm and confirmed that the `latest` distribution tag resolves to `0.1.0`.
- Matched the public registry's tarball SHA-1 and SHA-512 integrity metadata to the exact release candidate tagged `v0.1.0` at commit `a24b341`.
- Installed `vibe-engineering-framework@latest` from the public registry into a clean temporary project. The installed CLI reported `0.1.0`, initialized canonical per-item storage, reached `CORE ENFORCED` in doctor, and passed strict validation with zero errors or warnings.
- Published the matching GitHub Release and created the GitHub `npm` deployment environment used by `publish.yml`.
- Verified npm's trust record before locking token access: repository `drmoyassine/vibe-engineering-framework`, workflow `publish.yml`, environment `npm`, and `createStagedPackage` as the only permission. Then required human 2FA and disabled traditional publish tokens; no long-lived npm publication secret is stored in GitHub.
- Completed TASK-001 and DEC-008's release-hardening follow-up. TASK-018 and TASK-019 now own the remaining public adoption, feedback, and distribution work.

### Public 0.1.0 release candidate verified
- Completed TASK-017 and prepared the public front door, current-versus-planned capability boundary, GitHub description/topics, changelog, contribution contract, private security-reporting path, maintainer release checklist, and reusable `0.1.0` launch copy.
- Made `package.json` the single CLI version source and added truthful npm metadata. Confirmed by a live registry lookup that the intended unscoped name was unclaimed at audit time; package names remain first-come, first-served until publication.
- Added one release gate spanning 31 tests, dogfood strict validation/doctor, dry-run package inspection, isolated installation of the exact tarball, installed CLI help/version, and a fresh `init` → `doctor` → `validate --strict` flow. CI now runs the same gate on Ubuntu and Windows at Node 18 and Node 24.
- Accepted DEC-008. The first npm release must be an authenticated maintainer bootstrap with 2FA because npm cannot configure a trusted publisher for a package that does not yet exist. Subsequent releases use the prepared `publish.yml` OIDC workflow to stage a tagged artifact for human 2FA approval and automatic provenance.
- At candidate time, TASK-001 remained at the explicit npm authentication boundary. The later publication entry above records closure of that boundary without rewriting this chronological checkpoint.

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

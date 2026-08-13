# Vibe Engineering Framework

**Git-native project memory and integrity for AI-assisted engineering.**

AI can build quickly. The harder problem is remembering why the system is shaped the way it is: the decision made three chats ago, the roadmap item a task serves, the assumption behind a migration, and the work that remains after context is gone.

Vibe Engineering Framework (VEF) turns that fragile context into a durable, human-readable project model. It stores vision, roadmap, tasks, decisions, and engineering learnings in version-controlled Markdown; gives each item a stable identity and typed links; and progressively validates that the model still makes sense.

```text
conversation, code, issues, git history
                 │
                 ▼
     VEF canonical project memory
  Vision ─ Architecture ─ Roadmap ─ Tasks ─ Decisions ─ Log
                 │
                 ▼
       humans, agents, CLI, future views
```

VEF is for teams that want an AI agent to inherit a project, not merely a prompt.

> **Status:** early but operational. The Integrity Core, canonical per-item store, deterministic ledgers and queries, consumer migration path, and cross-platform CI gate are implemented and dogfooded here. See [ROADMAP.md](ROADMAP.md).

## Why this exists

Without durable project memory, AI-assisted work repeatedly loses its own context:

- Decisions end up in chats, calls, issue comments, and private memory.
- Roadmap intent disconnects from the tasks and code that implement it.
- A new session re-discovers architecture instead of building on it.
- Documentation looks plausible while links, ownership, and assumptions silently drift.

That is not a writing problem. It is a project-state problem.

VEF makes the important state explicit, reviewable in Git, and available to both people and agents. Markdown is deliberately the storage format: it is portable, diffable, readable without a platform, and easy to keep beside the code it describes.

## What VEF is

VEF has a vendor-neutral core and agent-specific adapters.

| Layer | Responsibility | Current form |
|---|---|---|
| **Canonical project model** | Durable records for intent, work, decisions, and learnings | Markdown + YAML frontmatter |
| **Integrity Core** | Schemas, typed relationships, validation, provenance, lifecycle rules | `vef` CLI + CI |
| **Interfaces** | Create, inspect, migrate, query, and render the model | CLI, Markdown, agent adapters |
| **Agent adapters** | Help an AI interpret and maintain project state | Claude Code skills today; other agents are a core design goal |

It is not a replacement for Linear, Jira, GitHub Issues, or a chat tool. Those can remain excellent intake and collaboration systems. VEF is the durable, curated model that explains how their important facts relate to the product.

## The knowledge graph

Every structured item has a stable ID and relationships use an explicit, readable shape:

```yaml
roadmap_item:
  id: FRAMEWORK-017
  name: "Build the VEF Integrity Core"
  url: /ROADMAP.md#FRAMEWORK-017
```

The intended topology is:

```text
VISION themes
     ▲       │
     │       ▼
ROADMAP items ◀────► DECISIONS
     ▲                    ▲
     │                    │
   TASKS ─────────────────┘
     ▲
     │
external bugs / issues
```

This creates useful answers that a plain document pile cannot reliably provide:

- Why are we doing this task?
- What decision does this roadmap item implement?
- Which work will be affected if a decision changes?
- What is still unverified or needs human review?

The model is deliberately denormalized for local readability: backlinks live near the thing they describe. The Integrity Core validates every declared inverse so that convenience does not become silent graph drift.

Structured records use one canonical file per item under the documentation namespace:

```text
docs/
  vision/       roadmap/       tasks/         decisions/
    <id>.md       <id>.md        <id>.md         <id>.md
    _index.md     _index.md      _index.md       _index.md
        │             │              │               │
        └─────────────┴──── vef project ─────────────┘
                                │
              VISION.md · ROADMAP.md · TASKS.md · DECISIONS.md
                    generated, committed reading ledgers
```

The root ledgers preserve stable public links and convenient sequential reading, but their generated item blocks are not edited directly. `.vef/storage.json` activates the layout, and strict validation rejects projection drift.

`docs/vision/_index.md` owns the collection-level vision narrative. When an adopter models individual vision themes, each theme is a structured item file with canonical frontmatter under `docs/vision/`; root `VISION.md` is still the generated reading surface. Do not infer a consumer's storage contract from root prose alone—run the current CLI's doctor and migration preflight.

## Core documents

| Document | Role |
|---|---|
| [VISION.md](VISION.md) | The enduring problem, principles, audience, and success definition |
| [ARCHITECTURE.md](ARCHITECTURE.md) | How VEF is composed and where trust boundaries sit |
| [ROADMAP.md](ROADMAP.md) | Directional product commitments and sequencing |
| [TASKS.md](TASKS.md) | Concrete, traceable work |
| [DECISIONS.md](DECISIONS.md) | Context, decision, rationale, and consequences |
| [log.md](log.md) | Chronological learning and material changes |
| [index.md](index.md) | Navigation and OKF metadata |

GitHub Issues remain the canonical bug tracker. A task can reference an external issue; VEF does not create a competing `BUGS.md` ledger.

## What works today

- `vef init` scaffolds a project with the docs, templates, and current agent skills.
- `vef doctor` reports deterministic core enforcement and optional agent-adapter compatibility as separate results; `--fix` performs supported non-destructive core repair.
- Advanced `vef migrate` and `vef project` commands expose storage migration and deterministic ledger projection for maintainers.
- `vef validate --strict` provides the CI gate for field contracts, typed targets, dangling links, inverse relationships, duplicates, dependency cycles, and the canonical durable-memory catalogue.
- `vef list`, `show`, `refs`, `why`, `graph`, and `search` expose the canonical model without an LLM.
- Claude Code skills manage tasks, roadmap items, decisions, bugs, and AI-assisted migration.
- The framework is dogfooded in this repository and designed for adoption by independent product repositories.

## Current and planned capabilities

| Capability | Status |
|---|---|
| Canonical project-memory documents and typed records | Implemented; included in the 0.1.0 candidate |
| Integrity validation and cross-platform CI | Implemented; included in the 0.1.0 candidate |
| Per-item storage and deterministic ledgers | Implemented; included in the 0.1.0 candidate |
| Deterministic read-only graph queries | Implemented; included in the 0.1.0 candidate |
| Safe initialization and non-destructive doctor remediation | Implemented; included in the 0.1.0 candidate |
| Claude Code agent adapters | Implemented as optional adapters |
| Lightweight human review workspace | Planned under FRAMEWORK-015 |
| Transactional `vef create` and `vef update` | Deferred under FRAMEWORK-022 |

## Deterministic contract

The Integrity Core makes deterministic code authoritative for:

- one machine-readable canonical schema;
- one machine-readable durable-memory catalogue spanning Vision, Architecture, Roadmap, Tasks, Decisions, Log, and external issues;
- reference shape, target type, cardinality, duplicate IDs, and cycles;
- every direction of every declared inverse relationship;
- heading/frontmatter agreement, dates, enums, URLs, and provenance structure;
- strict CI checks that establish a complete framework contract;
- safe proposal/write boundaries for agent-assisted migration.

LLMs are valuable for interpreting legacy prose, classifying ambiguous evidence, and explaining conflicts. They should not be the authority for mechanical invariants. That boundary is a product principle, not an implementation detail.

## Install and evaluate

The `0.1.0` package is a verified release candidate but is not yet published to npm. Until the authenticated first publication, evaluate it from the repository:

```bash
git clone https://github.com/drmoyassine/vibe-engineering-framework.git
cd vibe-engineering-framework
npm install
npm link

vef init --name "My project"
vef doctor
vef validate --strict
```

After registry publication, the clean-directory path will be:

```bash
npx vibe-engineering-framework@latest init --name "My Project"
npx vibe-engineering-framework@latest doctor
npx vibe-engineering-framework@latest validate --strict
```

Query the project model directly:

```bash
vef list tasks --status pending
vef show TASK-009
vef refs TASK-009 --direction both
vef why TASK-009
vef graph --json
vef search "migration trust" --type decisions --json
```

Queries are read-only. Human-readable text is the default; every command accepts `--json` and emits a versioned
`schemaVersion: 1` envelope; lookup and filter failures use the same envelope on stderr. `show`, `refs`, and `why` resolve a stable ID across
all document types; use `tasks:TASK-009`-style selectors if an invalid repository contains a cross-type ambiguity.

For an existing repository with VEF installed as a development dependency, remediation is one explicitly authorized command:

```bash
npx vef doctor
npx vef doctor --fix
```

Plain `doctor` is read-only and reports two independent results: deterministic **core enforcement** and optional **agent-adapter compatibility**. Core status is one of:

| Status | Meaning | Next action |
|---|---|---|
| `NOT ADOPTED` | The repository has no VEF structured state | Run `vef init` |
| `SEMANTIC RECONCILIATION REQUIRED` | Records contain missing meaning, invalid relationships, or review flags | Reconcile the reported records, then rerun `vef doctor --fix` |
| `STRUCTURALLY REPAIRABLE` | Meaning is coherent; storage or projections need deterministic repair | Run `vef doctor --fix` |
| `CORE ENFORCED` | Canonical project memory satisfies the deterministic contract | No core repair needed |

`doctor --fix` preflights the complete candidate, creates or relocates canonical records under `docs/`, regenerates the root ledgers, runs strict validation, and finishes with the same health report. It may install adapter files that are missing, but it **never modifies an existing adapter file**. Adapter attention does not invalidate `CORE ENFORCED`; adapters are consumer-owned and require reviewed reconciliation. Neither doctor mode commits changes.

Lower-level commands remain available for framework maintainers, troubleshooting, and CI, but consumers do not need to compose them:

```bash
vef migrate            # advanced storage migration preview
vef migrate --apply    # advanced storage migration apply
vef project            # regenerate committed ledgers
vef validate --strict  # CI/integrity gate
```

The CLI must already contain the relevant migration behavior: an obsolete installed binary cannot discover commands introduced after it was packaged. Before the first npm release, commit-pinned adopters must update their VEF dependency to a revision containing TASK-029; after that bootstrap, `npx vef doctor --fix` performs the complete project migration. npm publication remains tracked by TASK-001.

Commit `.vef/`, `docs/`, the four regenerated root ledgers, and any newly installed adapter files together. The repair checks schemas and typed relationships before writing, refuses semantic blockers and conflicting partial directories, preserves IDs and root-ledger anchors, and leaves legacy ledgers readable until the apply step succeeds. It also relocates the retired root-directory preview layout under `docs/`. The former `--update-adapters` option is retired and fails without changing files.

For normal record maintenance, edit the canonical item file and project the public views:

```bash
vef project
vef validate --strict
```

Then use the installed agent adapter to maintain the model. In Claude Code, for example:

```text
/tasks add
/roadmap graduate FRAMEWORK-017
/decisions add
/apply                       # read-only proposal (default)
/apply --source memory       # explicit, classified memory evidence
/apply --write               # explicit write request through the validation gate
```

`/apply` is an adoption assistant, not a source of truth. It treats repository, Git, memory, and agent output as untrusted evidence and produces read-only proposals by default. Memory and Git are opt-in sources; memory is classified before import; unresolved references are blocked instead of invented. An explicit write request must pass deterministic validation against a staged candidate and again after writing, and it never commits automatically.

## Design principles

1. **Project state belongs beside the code.** Git history and review should apply to decisions and plans, not only source files.
2. **Humans and agents read the same model.** No proprietary database or hidden agent memory is required to understand the important state.
3. **Semantic judgment and structural proof are different jobs.** Agents interpret; the Integrity Core verifies.
4. **Relationships are first-class.** Stable IDs and typed references make intent traversable and explainable.
5. **Provenance is visible.** Optional OKF-aligned metadata records who or what generated and verified a record.
6. **Every material action leaves memory coherent.** Work is not complete when code or prose changes; its durable project-state consequences must be reconciled too.

## Relationship to OKF

VEF builds on the [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) conventions that fit project knowledge: Markdown, frontmatter, portable filenames, actor conventions, and trust signals. VEF adds the product-engineering layer: domain schemas, lifecycle rules, typed relationships, graph integrity, migration workflows, and agent adapters. See [DEC-002](DECISIONS.md#DEC-002).

## Roadmap

[FRAMEWORK-017](ROADMAP.md#FRAMEWORK-017) delivered the Integrity Core, [FRAMEWORK-018](ROADMAP.md#FRAMEWORK-018) delivered deterministic project queries, and [FRAMEWORK-019](ROADMAP.md#FRAMEWORK-019) delivered canonical per-item storage with generated ledgers and consumer migration. [FRAMEWORK-020](ROADMAP.md#FRAMEWORK-020), VEF's public package and launch, and [FRAMEWORK-015](ROADMAP.md#FRAMEWORK-015), its lightweight review workspace, are the active tracks. Transaction commands are deferred to FRAMEWORK-022.

## Contributing and status

This is an early framework with a strong thesis and intentionally narrow scope. If you are evaluating it today, treat the CLI's implemented checks, versioned queries, per-item storage contract, deterministic projections, consumer migration path, and CI gate as the current contract. Transactional day-to-day mutations remain deferred under FRAMEWORK-022. `/apply` remains the guarded agent-assisted semantic migration path.

The most valuable contribution is helping make this statement literally true:

> If `vef validate --strict` passes, the repository's documented project state satisfies VEF's implemented structural contract.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development and pull-request contract, [SECURITY.md](SECURITY.md) for private vulnerability reporting, [CHANGELOG.md](CHANGELOG.md) for release history, and [RELEASING.md](RELEASING.md) for the maintainer publication boundary.

## License

MIT

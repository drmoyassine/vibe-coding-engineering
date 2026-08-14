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

> **Status:** early but operational. The Integrity Core, canonical per-item store, deterministic ledgers and queries, public adoption lifecycle, and recoverable transaction engine are implemented and dogfooded here. See [ROADMAP.md](ROADMAP.md).

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
        └─────────────┴──── vef setup ───────────────┘
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

- `vef setup` is the one idempotent lifecycle write: initialize or upgrade, repair, project, validate, and enforce.
- `vef check` is the one strict read-only gate for local use and CI.
- `vef doctor` explains blockers without becoming another setup path.
- `vef create` and `vef update` preview complete record/relationship changes by default and write only with `--write`.
- Interrupted writes are journaled under `.vef/transactions/`; later writes stop until an explicit roll-forward or rollback.
- Legacy `init`, `migrate`, `project`, `validate`, and `doctor --fix` remain callable for compatibility but are hidden from normal help.
- `vef list`, `show`, `refs`, `why`, `graph`, and `search` expose the canonical model without an LLM.
- Claude Code skills manage tasks, roadmap items, decisions, bugs, and AI-assisted migration.
- The framework is dogfooded in this repository and designed for adoption by independent product repositories.

## Current and planned capabilities

| Capability | Status |
|---|---|
| Canonical project-memory documents and typed records | Shipped in 0.1.0 |
| Integrity validation and cross-platform CI | Shipped in 0.1.0 |
| Per-item storage and deterministic ledgers | Shipped in 0.1.0 |
| Deterministic read-only graph queries | Shipped in 0.1.0 |
| Two-command setup and enforcement lifecycle | Shipped in 0.2.0 |
| Claude Code agent adapters | Shipped as optional adapters |
| Lightweight human review workspace | Planned under FRAMEWORK-015 |
| Recoverable `vef create` and `vef update` | Available in 0.3.0 under FRAMEWORK-022 |

## Deterministic contract

The Integrity Core makes deterministic code authoritative for:

- one machine-readable canonical schema;
- one machine-readable durable-memory catalogue spanning Vision, Architecture, Roadmap, Tasks, Decisions, Log, and external issues;
- reference shape, target type, cardinality, duplicate IDs, and cycles;
- every direction of every declared inverse relationship;
- heading/frontmatter agreement, dates, enums, URLs, and provenance structure;
- strict CI checks that establish a complete framework contract;
- safe proposal/write boundaries for agent-assisted migration;
- intent-first journals, stale-tolerant writer leases, automatic dates/provenance, and explicit recovery.

LLMs are valuable for interpreting legacy prose, classifying ambiguous evidence, and explaining conflicts. They should not be the authority for mechanical invariants. That boundary is a product principle, not an implementation detail.

## Adopt VEF

VEF requires Node.js 18 or newer. New repositories, existing repositories, and upgrades all begin with the same command:

```bash
npx vibe-engineering-framework@latest setup
```

That invocation includes package acquisition. `setup` detects the repository's state and performs the strongest safe lifecycle it can prove:

```text
acquire current CLI → initialize or upgrade → repair → project → validate → enforce
                                                       │
                                                       └─ stop before writes if meaning is unresolved
```

The result is explicit:

- `SETUP COMPLETE — VEF CORE ENFORCED`: the deterministic project-memory contract passes.
- `SETUP PAUSED`: schemas or relationships require human/agent semantic reconciliation; structural writes did not run.
- `SETUP BLOCKED`: existing framework-surface files conflict with a fresh scaffold; no files were changed.

Existing adapters are consumer-owned and are never overwritten. Missing adapters may be installed, but adapter compatibility remains separate from core enforcement.

### Validate and enforce

There is one strict read-only acceptance command:

```bash
npx vibe-engineering-framework@latest check
```

`check` fails unless storage, generated ledgers, schemas, typed targets, inverse relationships, duplicates, cycles, review state, and the durable-memory catalogue all satisfy the implemented contract. Use the same command locally and in CI.

When setup detects GitHub, it creates or refreshes a clearly marked VEF-managed workflow pinned to the current framework version. Existing custom enforcement workflows are preserved. For another CI provider, setup prints the single pinned `check` command to add. This is the deployment boundary: commit `.vef/`, `docs/`, the root ledgers, optional adapters, and the enforcement workflow together.

### Update

Updating uses the same lifecycle command—there is no separate upgrade flag or migration sequence:

```bash
npx vibe-engineering-framework@latest setup
```

The current CLI upgrades mechanically compatible storage and managed CI, validates the complete candidate, and stops on semantic ambiguity. An obsolete local dependency never controls the upgrade because the command explicitly acquires `@latest`.

### Troubleshoot

If setup or check stops, use the read-only explanation surface:

```bash
npx vibe-engineering-framework@latest doctor
```

Normal adoption requires only `setup` and `check`. The former `init`, `migrate --apply`, `project`, `validate --strict`, and `doctor --fix` surfaces remain callable for compatibility and framework maintenance but are intentionally hidden from normal help.

### Create and update records

From 0.3.0, after VEF is installed as a project dependency, day-to-day structural writes use two commands. Both
preview by default; neither infers product meaning:

```yaml
# complete-task.yml
set:
  status: completed
relationships:
  related_decisions:
    add: [DEC-010]
```

```bash
npx vef update TASK-013 --from complete-task.yml
npx vef update TASK-013 --from complete-task.yml --write --actor agent/my-session
```

`create` accepts a complete proposed record and optional initial relationship IDs. Tasks and decisions allocate their
declared numeric families. A fresh roadmap allocates `ROADMAP-001`; an existing roadmap with one coherent numeric family
continues that family, while mixed or non-numeric existing IDs require an explicit ID. Vision themes always require
semantic slug IDs. `update` combines scalar, body,
and relationship changes, so inverse links and ledgers are part of the same validated candidate. The engine owns
allocatable IDs, `last_updated`, `modified` provenance, canonical reference metadata, inverse closure, projection,
and final validation. Agent adapters can submit several create/update operations together through `vef create batch`
without maintaining their own canonical Markdown serializer.

A pre-existing title/heading mismatch remains blocking unless the update names the authority explicitly with
`--authority frontmatter` or `--authority heading`. That exception repairs only the named record's title mismatch;
unrelated malformed state still blocks the complete transaction. Authority-only repair does not require an empty
proposal file:

```bash
npx vef update TASK-013 --authority frontmatter --write
```

Run `npx vef update --help` for the `set`, `unset`, `body`, and relationship `set`/`add`/`remove` proposal grammar.

VEF does not claim database-level filesystem atomicity. It records a versioned write-ahead journal before changing
project files and serializes writers with a PID/host/timestamp lease. If a process stops, `check`, `setup`, and later
mutations refuse to continue. Follow the reported transaction ID with exactly one explicit recovery direction:

```bash
npx vef recover <transaction-id> --rollback
# or
npx vef recover <transaction-id> --forward
```

`recover` is a visible break-glass command, not an adoption step. `doctor` also inventories writer lease families. If it
reports malformed lease state, first confirm that no writer is active and then run:

```bash
npx vef recover leases
```

Fresh partial claims are preserved because they may still be in flight; `--force` is available only after the operator
confirms that no writer is active. Recovery writes additive quarantine or settlement markers before best-effort cleanup,
so failed deletion and synchronized-folder resurrection cannot restore ownership. Cleanup failures from Windows,
OneDrive, Dropbox, antivirus, or open editors are warnings; settled debris does not invalidate or block the project.

### Query and maintain project state

Install VEF as a development dependency when you want short local query commands:

```bash
npm install --save-dev vibe-engineering-framework
npx vef list tasks --status pending
npx vef show TASK-009
npx vef refs TASK-009
npx vef why TASK-009
npx vef graph --json
npx vef search "migration trust" --type decisions --json
```

Queries are read-only. Human-readable text is the default; `--json` emits the versioned `schemaVersion: 1` automation envelope. Use `tasks:TASK-009`-style selectors only if an invalid repository contains a cross-type ambiguity.

For semantic maintenance, use the installed agent adapter. In Claude Code, for example:

```text
/tasks add
/roadmap graduate FRAMEWORK-017
/decisions add
/apply                       # read-only proposal (default)
/apply --source memory       # explicit, classified memory evidence
/apply --write               # explicit write request through the validation gate
```

`/apply` is an adoption assistant, not a source of truth. It treats repository, Git, memory, and agent output as untrusted evidence and produces read-only structured operations by default. Memory and Git are opt-in sources; memory is classified before import; unresolved references are blocked instead of invented. It owns no canonical frontmatter/Markdown renderer: explicit writes submit the complete operation set to the same journaled transaction engine, and it never commits automatically.

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

[FRAMEWORK-017](ROADMAP.md#FRAMEWORK-017) delivered the Integrity Core, [FRAMEWORK-018](ROADMAP.md#FRAMEWORK-018) delivered deterministic project queries, [FRAMEWORK-019](ROADMAP.md#FRAMEWORK-019) delivered canonical per-item storage, [FRAMEWORK-020](ROADMAP.md#FRAMEWORK-020) delivered the public `0.2.0` lifecycle proof, and [FRAMEWORK-022](ROADMAP.md#FRAMEWORK-022) delivered recoverable transaction writes. FRAMEWORK-020 now resumes public examples/distribution while [FRAMEWORK-015](ROADMAP.md#FRAMEWORK-015) builds the lightweight review workspace against the candidate-diff boundary.

## Contributing and status

This is an early framework with a strong thesis and intentionally narrow scope. If you are evaluating the current source, treat its checks, versioned queries, per-item storage contract, deterministic projections, journaled mutations, consumer migration path, and CI gate as the implemented contract. The `0.3.0` package added the transaction writer; `0.3.1` hardens lease recovery and completes the adjacent authoring ergonomics. `/apply` remains the guarded agent-assisted semantic migration path.

The most valuable contribution is helping make this statement literally true:

> If `vef check` passes, the repository's documented project state satisfies VEF's implemented structural contract.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development and pull-request contract, [SECURITY.md](SECURITY.md) for private vulnerability reporting, [CHANGELOG.md](CHANGELOG.md) for release history, and [RELEASING.md](RELEASING.md) for the maintainer publication boundary.

## License

MIT

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

> **Status:** early but operational. The Integrity Core, cross-platform CI gate, safe migration boundary, and deterministic query layer are implemented and dogfooded here. See [ROADMAP.md](ROADMAP.md).

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
- `vef migrate` detects existing structure and prepares a repository for adoption.
- `vef validate --strict` checks field contracts, typed targets, dangling links, inverse relationships, duplicates, dependency cycles, and the canonical durable-memory catalogue.
- `vef doctor` checks expected docs and skills, catalogue alignment, migration review state, casing, and the `/apply` trust contract.
- `vef list`, `show`, `refs`, `why`, `graph`, and `search` expose the canonical model without an LLM.
- Claude Code skills manage tasks, roadmap items, decisions, bugs, and AI-assisted migration.
- The framework is dogfooded in this repository and first adopted by [studygram-app](https://github.com/drmoyassine/studygram-app).

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

## Getting started

The package is not published to npm yet. Use the repository locally:

```bash
git clone https://github.com/drmoyassine/vibe-engineering-framework.git
cd vibe-engineering-framework
npm install
npm link

vef init --name "My project"
vef doctor
vef validate --strict
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

For an existing repository:

```bash
vef migrate                 # inspect; does not rewrite docs
vef migrate --apply         # install the adapter/templates and structural fixes
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

[FRAMEWORK-017](ROADMAP.md#FRAMEWORK-017) delivered the Integrity Core, and [FRAMEWORK-018](ROADMAP.md#FRAMEWORK-018) delivered deterministic project queries. No additional framework milestone is currently committed. FRAMEWORK-006 tracks consumer-specific adoption work in `studygram-app`; it does not define this framework's next priority.

## Contributing and status

This is an early framework with a strong thesis and intentionally narrow scope. If you are evaluating it today, treat the CLI's implemented checks, versioned queries, and CI gate as the current contract. Deterministic day-to-day mutation commands remain future work; `/apply` is the guarded agent-assisted migration path.

The most valuable contribution is helping make this statement literally true:

> If `vef validate --strict` passes, the repository's documented project state satisfies VEF's implemented structural contract.

## License

MIT

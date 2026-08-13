# VISION.md

## Purpose

Vibe Engineering Framework exists to make AI-assisted software engineering cumulative. It gives a project durable memory: a shared, inspectable model of why the product exists, how the system is structured, what it intends to do, what was decided, and what work follows.

## The problem

Modern engineering loses high-value context faster than it creates code. Decisions are made in chat, calls, issue comments, and transient agent memory; plans drift away from implementation; and every new contributor or agent must reconstruct the same reasoning from fragments.

The result is repeated work, not merely weak documentation: teams re-litigate decisions, agents receive incomplete context, and a repository can look well documented while its roadmap, tasks, and architecture no longer agree.

## The vision

VEF is a **git-native project-memory and integrity layer for AI-assisted engineering**.

It treats product knowledge as a portable, typed model stored beside the code. Humans and agents share the same canonical records. Git provides history and review. A deterministic integrity layer makes the model safe to depend on.

### Durable project memory

The core record types capture a project's enduring state:

| Record | Question it answers |
|---|---|
| Vision | Why does this project exist? |
| Architecture | How is the system structured, and what constraints shape it? |
| Roadmap | Where are we going next? |
| Tasks | What concrete work remains? |
| Decisions | What did we choose, and why? |
| Log | What materially changed or was learned? |
| External issues | What problems have been reported? |

Stable IDs and typed links turn these records into an explainable graph rather than a collection of prose files.

### Trustworthy structure

The framework must earn trust by making its promises executable. Agents can interpret ambiguous source material and propose changes; deterministic code is responsible for proving mechanical facts such as schema validity, target type, inverse links, cardinality, uniqueness, and cycles.

The long-term standard is simple:

> When VEF's integrity check passes, the documented project state is structurally coherent.

### Portable, agent-neutral foundations

The canonical model is Markdown, YAML frontmatter, Git, and open conventions—not an agent vendor's memory system. Agent adapters may offer different workflows, but none owns the project's knowledge. Claude Code is the first adapter; Codex, Cursor, Gemini, and generic `AGENTS.md` workflows should be able to participate without changing the underlying data model.

## Operating principle

Every material action should leave durable project memory coherent with the action that just occurred.

That means an agent completing direction-changing work must consider its project-state consequences: update links and status, record material decisions, log meaningful changes, and create or revise directly implied roadmap/task records. It does not authorize inventing requirements, erasing history, or silently resolving ambiguity.

## Who this is for

- Solo founders and small teams building with coding agents.
- Maintainers adopting an existing repository whose product knowledge is scattered across Git, prose, and conversations.
- Contributors who need to understand a project's reasoning without searching private chat history.

## What success looks like

A new contributor or agent can ask “why are we building this?”, “what decision caused this work?”, or “what is blocked?” and follow stable references to an answer. A pull request that breaks the project model fails a deterministic check. A migration from legacy prose leaves uncertain evidence marked for review rather than inventing facts. The model remains useful without an LLM through deterministic query and graph interfaces.

## Boundaries

VEF is not a project-management SaaS, chat platform, issue tracker, or CI/CD system. It complements those systems by maintaining the curated, version-controlled project knowledge they do not provide.

## Current strategic priority

[FRAMEWORK-017](ROADMAP.md#FRAMEWORK-017) delivered the VEF Integrity Core, and [FRAMEWORK-018](ROADMAP.md#FRAMEWORK-018) delivered deterministic project queries. Together they establish the current product foundation: a canonical schema, typed graph validation, safe migration boundaries, cross-platform CI, and project-memory retrieval without an LLM.

[FRAMEWORK-019](ROADMAP.md#FRAMEWORK-019) delivered DEC-004's per-item canonical storage, deterministic ledgers, projection drift checks, and consumer migration path. [FRAMEWORK-020](ROADMAP.md#FRAMEWORK-020) now prioritizes DEC-009's two-command installation-through-enforcement lifecycle and its `0.2.0` consumer proof before examples and distribution. [FRAMEWORK-015](ROADMAP.md#FRAMEWORK-015) continues lightweight human review in parallel. General-purpose mutations are deferred to FRAMEWORK-022. Consumer implementations and commercial uses remain outside VEF's product strategy.

<!-- VEF:ITEMS -->

---
okf_version: "0.2"
type: project-memory-framework
title: "Vibe Engineering Framework"
description: "Git-native project memory and integrity for AI-assisted engineering."
---

# Vibe Engineering Framework

VEF maintains a portable, version-controlled project model for humans and AI agents. Its Integrity Core and deterministic query layer are dogfooded in this repository; see the [README](README.md) for the product overview and capability boundary.

## Canonical project state

| Document | Purpose |
|---|---|
| [VISION.md](VISION.md) | Enduring purpose, principles, audience, and success definition |
| [ARCHITECTURE.md](ARCHITECTURE.md) | VEF Core, integrity boundary, interfaces, and trust model |
| [ROADMAP.md](ROADMAP.md) | Product commitments and sequencing |
| [TASKS.md](TASKS.md) | Concrete implementation work |
| [DECISIONS.md](DECISIONS.md) | Architectural and product decisions |
| [log.md](log.md) | Chronological history and durable learnings |
| [CLAUDE.md](CLAUDE.md) | Current Claude Code adapter instructions |
| [AGENTS.md](AGENTS.md) | Framework workforce manual and conventions |

## Current strategic state

[FRAMEWORK-017](ROADMAP.md#FRAMEWORK-017) delivered the Integrity Core, [FRAMEWORK-018](ROADMAP.md#FRAMEWORK-018) delivered deterministic project queries, and [FRAMEWORK-019](ROADMAP.md#FRAMEWORK-019) delivered canonical per-item storage with deterministic ledgers. [FRAMEWORK-020](ROADMAP.md#FRAMEWORK-020) public release and [FRAMEWORK-015](ROADMAP.md#FRAMEWORK-015) lightweight human review are the active tracks. General-purpose mutations are deferred to FRAMEWORK-022.

## Current interfaces

- CLI integrity/adoption: `vef init`, `vef migrate`, `vef validate`, `vef doctor`
- CLI queries: `vef list`, `vef show`, `vef refs`, `vef why`, `vef graph`, `vef search` (text or versioned JSON)
- Claude Code adapter: `/apply`, `/tasks`, `/roadmap`, `/decisions`, `/bugs`
- External bugs: GitHub Issues are canonical; VEF references them rather than maintaining a duplicate bug document.
- Structured items: `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/` are canonical. The linked root ledgers are generated, committed views; run `vef project` after item changes.

## License

MIT

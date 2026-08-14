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
| [CHANGELOG.md](CHANGELOG.md) | Public release history and known limits |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development and pull-request contract |
| [SECURITY.md](SECURITY.md) | Private vulnerability-reporting policy |
| [RELEASING.md](RELEASING.md) | Maintainer release gate and npm publication boundary |

## Current strategic state

[FRAMEWORK-017](ROADMAP.md#FRAMEWORK-017) delivered the Integrity Core, [FRAMEWORK-018](ROADMAP.md#FRAMEWORK-018) delivered deterministic project queries, and [FRAMEWORK-019](ROADMAP.md#FRAMEWORK-019) delivered canonical per-item storage with deterministic ledgers. VEF `0.1.0` is publicly available from npm. [FRAMEWORK-020](ROADMAP.md#FRAMEWORK-020) now gates examples and distribution on the simplified `0.2.0` setup/check lifecycle and consumer proof, while [FRAMEWORK-015](ROADMAP.md#FRAMEWORK-015) advances lightweight human review. General-purpose mutations are deferred to FRAMEWORK-022.

## Current interfaces

- CLI lifecycle: `vef setup` adopts or upgrades and reaches the strongest safe enforced state; `vef check` is the strict local/CI gate; `vef doctor` explains blockers
- CLI queries: `vef list`, `vef show`, `vef refs`, `vef why`, `vef graph`, `vef search` (text or versioned JSON)
- Claude Code adapter: `/apply`, `/tasks`, `/roadmap`, `/decisions`, `/bugs`
- External bugs: GitHub Issues are canonical; VEF references them rather than maintaining a duplicate bug document.
- Structured items: `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, and `docs/decisions/` are canonical. The linked root ledgers are generated, committed views; run `vef setup`, then `vef check`, after direct item changes.

## License

MIT

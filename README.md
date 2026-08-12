# vibe-coding-engineering

**Structured product documentation framework for AI-assisted engineering.**

A meta-framework — patterns, schemas, and a Claude skill that keep product documentation in sync, queryable, and discoverable by humans and AI.

## Quick start

Read [`VISION.md`](VISION.md) to understand what this is and why it exists.

Read [`CLAUDE.md`](CLAUDE.md) to learn how to work with this repo.

Read [`AGENTS.md`](AGENTS.md) to understand the agent profiles, tool catalogs, and context-gating framework.

## The three layers

1. **Content** — Five core docs (VISION, ARCHITECTURE, ROADMAP, TASKS, BUGS) plus AGENTS.md and CLAUDE.md.
2. **Discipline** — The `/product-docs` skill that enforces structure, handles assembly, and prevents drift.
3. **Trigger** — A thin hook in CLAUDE.md that fires the skill when direction-changing work lands.

## Core idea

Interactive documents (ROADMAP, BUGS) have a **canonical markdown source** (read-only, version-controlled) AND a **paired intake tool** (Fider, GitHub Discussions, GitHub Issues). Users never write the canonical doc; they interact with the intake tool. Promotion into the curated doc is a privileged act enforced by the tool's permissions.

## Status

🚧 **Early framework.** Core docs landed. Skill not yet built. ROADMAP intake tool TBD. GitHub Issues wired as BUGS source.

## Consumers

- [`studygram-app`](https://github.com/drmoyassine/studygram-app) — Studygram CRM, the first product adopting this framework.

## License

MIT

---
okf_version: "0.2"
type: documentation-framework
title: "vibe-coding-engineering"
description: "Structured product documentation framework for AI-assisted engineering — an OKF v0.2 implementation with product-doc extensions"
---

# vibe-coding-engineering

A structured documentation framework for AI-assisted product development. This is an **implementation and extension** of the [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) pattern, specialized for product documentation (ROADMAP, TASKS, DECISIONS, BUGS).

## Documents

| Document | Purpose |
|----------|---------|
| [VISION.md](VISION.md) | Why the framework exists, north-star direction, success criteria |
| [ROADMAP.md](ROADMAP.md) | Directional roadmap — phases, themes, priorities |
| [DECISIONS.md](DECISIONS.md) | Architectural/product/technical decisions with context + rationale |
| [LOG.md](LOG.md) | Chronological change log (OKF reserved filename) |
| [CLAUDE.md](CLAUDE.md) | Repo-level instructions for Claude (schemas, patterns, workflow) |
| [AGENTS.md](AGENTS.md) | Agent profiles, tool/skill catalogs, context-gating rules |

> `ARCHITECTURE.md` and `TASKS.md` are not yet written for this repo. Framework-level work is tracked in [ROADMAP.md](ROADMAP.md) (FRAMEWORK-XXX items).

## Skills (the product-docs suite)

| Skill | What it does |
|-------|--------------|
| `/tasks` | Manage TASKS.md (list, add, update, complete, reconcile) |
| `/roadmap` | Manage ROADMAP.md (list, add, graduate → tasks, reconcile) |
| `/bugs` | Manage GitHub Issues + `product_failures` table (list, create, resolve, sync) |
| `/decisions` | Manage DECISIONS.md (list, add, update, supersede, reconcile) |
| `/apply` | One-shot migration: bare docs → framework standard (multi-agent) |

`/product-docs` is the **conceptual umbrella name** for this suite — it is not an invocable command. Invoke the specific skill above.

## Relationship to OKF

vibe-coding-engineering conforms to OKF v0.2 and extends it for product documentation. See [DEC-002](DECISIONS.md#DEC-002) for the full adoption decision. Key extensions: structured `id + name + url` cross-linking, bidirectional relationships, four management skills, and multi-repo canonical/consumer support.

## Consumers

- [`studygram-app`](https://github.com/drmoyassine/studygram-app) — Studygram CRM, the first product adopting this framework.

## License

MIT

# vibe-coding-engineering

**Structured product documentation framework for AI-assisted engineering.**

A meta-framework — patterns, schemas, and a Claude skill that keep product documentation in sync, queryable, and discoverable by humans and AI.

## Quick start

Read [`VISION.md`](VISION.md) to understand what this is and why it exists.

Read [`CLAUDE.md`](CLAUDE.md) to learn how to work with this repo.

Read [`AGENTS.md`](AGENTS.md) to understand the agent profiles, tool catalogs, and context-gating framework.

## The three layers

1. **Content** — Five core docs (VISION, ARCHITECTURE, ROADMAP, TASKS, BUGS) plus AGENTS.md and CLAUDE.md.
2. **Discipline** — The **product-docs skill suite** (`/tasks`, `/roadmap`, `/bugs`, `/decisions`, `/apply`) that enforces structure, handles assembly, and prevents drift.
3. **Trigger** — A thin hook in CLAUDE.md that fires the skill when direction-changing work lands.

## Core idea

Interactive documents (ROADMAP, BUGS) have a **canonical markdown source** (read-only, version-controlled) AND a **paired intake tool** (Fider, GitHub Discussions, GitHub Issues). Users never write the canonical doc; they interact with the intake tool. Promotion into the curated doc is a privileged act enforced by the tool's permissions.

## Status

🚧 **Early framework.** Core docs + four management skills (`/tasks`, `/roadmap`, `/bugs`, `/decisions`) + migration skill (`/apply`) built and proven in [studygram-app](https://github.com/drmoyassine/studygram-app). ROADMAP intake tool TBD. GitHub Issues wired as BUGS source.

## Relationship to OKF and OpenKB

vibe-coding-engineering is an **implementation and extension** of the [Open Knowledge Format (OKF) v0.2](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md), specialized for product documentation. See [DEC-002](DECISIONS.md#DEC-002) for the adoption decision.

| OKF concept | Our implementation |
|-------------|--------------------|
| Markdown + YAML frontmatter | ✅ TASKS.md, ROADMAP.md, DECISIONS.md |
| Reserved filenames (`index.md`, `log.md`) | ✅ `index.md` (navigation hub) + `log.md` (changelog) |
| `okf_version` field | ✅ declared in root `index.md` frontmatter |
| Actor convention (§7) | ✅ `human:<id>` / `<producer>/<version>` / `process:<id>` |
| Trust signals (`generated`, `verified`) | ✅ optional fields; advisory tiers |
| `resource` + `tags` fields | ✅ optional fields |
| Producer/consumer independence | ✅ humans produce; skills consume; `/apply` migrates |
| Format, not platform | ✅ git-native, no proprietary lock-in |

**Extensions beyond OKF** (the differentiated value — "OKF for product docs"):
- **Structured cross-linking** — `id + name + url` with explicit relationship types (`depends_on`, `related_tasks`, `related_decisions`, `roadmap_item`)
- **Bidirectional relationships** — ROADMAP ↔ TASK ↔ DECISION topology is traversable both ways
- **Management skills** — `/tasks`, `/roadmap`, `/bugs`, `/decisions` for interactive, validated editing
- **GitHub Issues integration** — `related_bugs` links to an external issue tracker (bugs have no markdown file)
- **Multi-repo support** — canonical definition (this repo) + consumer repos (`studygram-app`)

**Comparison to [OpenKB](https://github.com/VectifyAI/OpenKB) / [LLM-Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f):** those compile *raw documents* into a structured wiki using LLMs (LLM-authored links). vibe-coding-engineering inverts the model: **human-structured schemas** with skill-based management, where the LLM assists via the `/apply` migration skill rather than generating the graph. Different scope, complementary tools.

## Consumers

- [`studygram-app`](https://github.com/drmoyassine/studygram-app) — Studygram CRM, the first product adopting this framework.

## License

MIT

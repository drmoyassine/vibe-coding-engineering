# ARCHITECTURE.md

**vibe-engineering-framework** — the system architecture of the framework *itself* (the npm package, the `vef` CLI, and the Claude Code skill set), not of any product that adopts it. Consumer products derive their own `ARCHITECTURE.md` from their code; this one describes the tool they adopt.

Last updated: 2026-08-12

> The framework is written in the framework. This repo's own `ROADMAP.md`, `DECISIONS.md`, `TASKS.md`, `LOG.md`, `INDEX.md`, and `CLAUDE.md` are the dogfooded instance — `vef doctor` and `vef validate` must pass clean here. (See DEC-001.)

---

## 1. What this is

vibe-engineering-framework is a structured-documentation framework for AI-assisted product engineering. It gives a repo a version-controlled, AI-readable set of markdown docs — vision, roadmap, tasks, decisions, log — held together by typed cross-links, plus the Claude Code skills that keep them in sync and a CLI that scaffolds and validates them.

The problem it solves is **doc rot**: in AI-assisted engineering, decisions get made in chat, captured in private agent memory, or never recorded at all, and the "docs" drift from reality within a session. The framework's answer is git-native markdown as the single source of truth, with skills that force every addition through a canonical schema and bidirectional cross-links that make drift detectable. (See VISION.md for the full problem statement and DEC-001 for the foundational decision.)

---

## 2. The three layers

| Layer | What it is | Examples |
|---|---|---|
| **Content** | The markdown docs. Each item is `## ID — Title` + YAML frontmatter + prose body, and the docs form a directed graph via `id + name + url` cross-links. | `VISION.md`, `ROADMAP.md`, `TASKS.md`, `DECISIONS.md`, `LOG.md`, `INDEX.md` |
| **Discipline** | The Claude Code skills that create, update, reconcile, and migrate the docs. These are **agentic** — they do AI discovery and reconciliation the CLI cannot. | `/apply`, `/tasks`, `/roadmap`, `/decisions`, `/bugs` |
| **Trigger** | The project instructions that tell the agent *when* to use each skill and which doc-framework rules to respect. | `CLAUDE.md`, `AGENTS.md` |

The separation matters: the **CLI does deterministic structural work** (scaffold, validate, report); the **skills do agentic work** (discover decisions scattered across memory/git/prose, reconcile classification conflicts, propose cross-links). Neither duplicates the other.

---

## 3. Document topology

| Doc | Role | Validated? |
|---|---|---|
| `VISION.md` | Product vision, description, themes (the "why") | ✅ schema |
| `ARCHITECTURE.md` | System architecture (the "how", derived from code) | — (prose) |
| `ROADMAP.md` | Directional themes (the "where next") | ✅ schema |
| `TASKS.md` | Concrete work breakdown (the "what now") | ✅ schema |
| `DECISIONS.md` | Decision ledger — the central record (the "what we decided") | ✅ schema |
| `LOG.md` | Chronological changelog + session learnings (OKF) | — |
| `INDEX.md` | Navigation hub / table of contents (OKF) | — |
| `CLAUDE.md` | Project instructions loaded every session | — |
| `AGENTS.md` | Working conventions | — |

`vef validate` enforces the schema and cross-link integrity on the four "✅ schema" docs (`TASKS.md`, `ROADMAP.md`, `DECISIONS.md`, `VISION.md`). The others are prose/structural.

---

## 4. The cross-link graph

All cross-references use one shape — `id + name + url` — relative URLs within a repo, absolute across repos:

```yaml
related_tasks:
  - id: TASK-002
    name: "Implement activeWhen filter"
    url: /TASKS.md#TASK-002
```

The link topology is intentional and enforced:

```
LOG.md  (narrative memory)
   │  links via log_ref
   ▼
DECISIONS.md  (decision ledger — central)
   │  bidirectional via related_*
   ▼
VISION.md ◀ ROADMAP.md ◀ TASKS.md      ◀── decisions produce vision/roadmap/tasks
   ▲            ▲            ▲
   └────────────┴────────────┘

GitHub Issues (BUGS)
   │  links via related_tasks
   ▼
TASKS.md  (tasks that fix them)
```

**Rules** (validated by `vef validate` where bidirectional):
1. `LOG.md → DECISIONS.md` — log entries reference decisions via `log_ref`; decisions do NOT link back. The decision is canonical; the log is narrative.
2. `DECISIONS ↔ VISION/ROADMAP/TASKS` — decisions link bidirectionally to all three.
3. `ROADMAP → VISION` via `vision_theme`.
4. `TASKS → ROADMAP` via `roadmap_item` (validated bidirectional with `ROADMAP.related_tasks`).
5. `BUGS → TASKS` via task `related_bugs`.

The key invariant: **tasks/roadmap/vision link to DECISIONS, not to LOG**. The decision is the source of truth for "what we decided"; LOG is how we got there.

---

## 5. The CLI (`vef`)

Plain ESM JavaScript (`.mjs`), no build step — the source IS the published code. Two runtime dependencies only: `commander` (CLI parsing) and `js-yaml` (frontmatter). Node ≥ 18.

```
bin/vef.mjs                        # entry point — commander program, 4 subcommands
src/lib/frontmatter.mjs            # parse/serialize YAML frontmatter (parseDoc, stringifyItem)
src/lib/schemas.mjs                # per-doc-type field defs + validateItem()
src/lib/crosslinks.mjs             # ref extraction, findOrphans(), checkBidirectional()
src/commands/{init,migrate,validate,doctor}.mjs
```

| Command | Purpose | Mutates? |
|---|---|---|
| `vef init` (`--new`) | Scaffold docs + skills into a new/empty dir (placeholder substitution) | writes (non-destructive) |
| `vef migrate` (`--migrate`) | Adopt an existing repo — install skills, detect bare-ID items, flag missing frontmatter | writes skills only; docs dry-run |
| `vef validate` (`--validate`) | Schema + cross-link check. CI-ready — exit 1 on errors | read-only |
| `vef doctor` (`--doctor`) | Health check — all docs present? all skills installed? zero `needsReview`? | read-only |

`validate` and `doctor` are read-only and safe in CI. `init`/`migrate` are the one-time adoption path.

---

## 6. The skill model

Five skills ship with the framework. `/apply` is the migration engine; the other four are the day-to-day management skills.

| Skill | What it does | Mechanism |
|---|---|---|
| `/apply` | Discover + extract + reconcile + migrate docs into the canonical format | 6-phase multi-agent workflow (`workflow.mjs`) |
| `/tasks` | List/add/update/complete/reconcile `TASKS.md` | Agentic edits |
| `/roadmap` | List/add/graduate/reconcile `ROADMAP.md` | Agentic edits |
| `/decisions` | List/add/update/supersede/reconcile `DECISIONS.md` | Agentic edits |
| `/bugs` | List/create/resolve/sync GitHub Issues | `gh` CLI |

**Templates vs. the framework's own install.** Genericized copies live in `templates/.claude/skills/` with `{{PROJECT_NAME}}` / `{{GITHUB_OWNER}}` / `{{REPO_NAME}}` placeholders; `vef init` substitutes them. The framework repo also keeps concrete (de-placeholderized) copies in its own `.claude/skills/` so it self-manages via its own skills — the dogfooded instance. `/apply` is identical in both locations (it is already fully generic).

`/apply`'s 6 phases: **Discover** (one agent per artifact document) → **Reconciliation Plan** (single orchestrator dedups/classifies/flags orphans) → **Extract** (the same discovery agents re-extract into canonical form) → **Validate** (per doc-type) → **Render** (pure JS — assembles `## ID — Title` + frontmatter + body) → **Framework Alignment Review** (audits CLAUDE.md/AGENTS.md/skills for drift). The workflow cannot write files; the caller writes its returned `entryMarkdown`.

---

## 7. OKF conformance (DEC-002)

The framework's markdown + YAML-frontmatter design independently converged on the Open Knowledge Format v0.2 pattern; DEC-002 aligns explicitly to gain interoperability with any OKF consumer.

**Adopted:** `index.md` (navigation hub, `okf_version`), `log.md` (chronological changelog replacing ad-hoc session memory), the actor convention (`human:<id>` / `<producer>/<version>` / `process:<id>`), and the trust-signal fields (`generated`, `verified`). Plus the optional `resource` and `tags` fields.

**Not adopted:** Attested Computation (`runtime`/`executor`/`attester`) — data-pipeline scope, not product docs.

**Extensions beyond OKF:** the typed `id + name + url` relationship fields (`depends_on`, `related_tasks`, `related_decisions`, `roadmap_item`), bidirectional cross-linking, the five management skills + `/apply`, and multi-repo canonical/consumer support. The framework is "OKF for product docs."

---

## 8. Package layout

```
vibe-engineering-framework/
├── package.json                # name, bin: vef, files: [bin/, src/, templates/]
├── bin/vef.mjs                 # CLI entry
├── src/
│   ├── lib/{frontmatter,schemas,crosslinks}.mjs
│   └── commands/{init,migrate,validate,doctor}.mjs
├── templates/                  # scaffold files for vef init
│   ├── {VISION,ROADMAP,TASKS,DECISIONS,LOG,INDEX,CLAUDE,AGENTS,ARCHITECTURE}.md
│   └── .claude/skills/{apply,tasks,roadmap,decisions,bugs}/   # genericized (placeholders)
├── .claude/skills/             # the framework's OWN concrete skills (dogfooded)
│   └── {apply,tasks,roadmap,decisions,bugs}/SKILL.md
└── {VISION,ARCHITECTURE,ROADMAP,TASKS,DECISIONS,LOG,INDEX,CLAUDE,AGENTS}.md
                                # the framework's own dogfooded docs
```

---

## 9. Consumer lifecycle

1. **Adopt** — `npx vibe-engineering-framework init` (new repo) or `--migrate` (existing repo with predating docs). Skills install; docs scaffold.
2. **Migrate legacy content** — run `/apply` in Claude Code to discover decisions/tasks/roadmap items scattered across memory, git history, and prose, and extract them into canonical frontmatter.
3. **Day-to-day** — use `/tasks`, `/roadmap`, `/decisions`, `/bugs` to manage the docs; every addition goes through the canonical schema.
4. **Gate in CI** — `vef validate` on PRs that touch the schema docs; broken cross-links fail the build.
5. **Health check** — `vef doctor` confirms all docs + skills present and zero `needsReview` items.

---

## Related

- DEC-001 — Use markdown as source of truth for docs
- DEC-002 — Adopt the OKF v0.2 pattern with product-doc extensions
- ROADMAP.md — directional themes (FRAMEWORK-001 … FRAMEWORK-016)
- `/apply` SKILL.md — the 6-phase migration workflow and full cross-link rules

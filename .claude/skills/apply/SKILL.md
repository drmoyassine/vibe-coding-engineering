# /apply

Align a repo to the vibe-coding-engineering framework standard via **per-document discovery**, reconciliation planning, and framework alignment review. Spawns a 6-phase multi-agent workflow that exhaustively discovers, extracts, and migrates every item (tasks, roadmap items, decisions, bugs, vision) into the standard frontmatter format with `id + name + url` cross-linking.

## When to use

Run `/apply` when:
- A repo has docs that predate the framework (bare IDs, missing frontmatter)
- Docs have drifted from the standard schema
- `DECISIONS.md` is incomplete but decisions live scattered in memory files, git history, code comments
- Framework docs (CLAUDE.md, AGENTS.md) no longer reflect the doc reality
- Vision/description content needs to be consolidated into `VISION.md`

## Commands

```
/apply                              # Full migration — all doc types
/apply --tasks                      # Only TASKS.md
/apply --roadmap                    # Only ROADMAP.md
/apply --decisions                  # Only DECISIONS.md (exhaustive discovery from ALL sources)
/apply --bugs                       # Only BUGS (GitHub Issues + product_failures)
/apply --vision                     # Only VISION.md
/apply --tasks --roadmap            # Multiple doc types
/apply --dry-run                    # Report what would change, write nothing
/apply --source memory              # Also scan Claude memory files for items
/apply --source git                 # Also scan git commit history for decisions
```

## How it works (6-phase workflow)

### Phase 1 — Discover (one agent per artifact document)

**Not per-docType. Per document.**

Spawns N discovery agents where N = every framework-relevant markdown file in the repo:
- **Framework docs**: `VISION.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `TASKS.md`, `DECISIONS.md`, `LOG.md`, `INDEX.md`, `CLAUDE.md`, `AGENTS.md`
- **Technical docs**: `docs/AGENT_PLATFORM.md`, `docs/MCP_SERVER.md`, `docs/PERMISSIONS.md`, `docs/TABLE_UI_TEMPLATE.md`, `docs/CHAT_FLOW.md`, `docs/AGENT_TOOL_AUDIT.md`
- **Skill definitions**: `.claude/skills/*/SKILL.md`
- **Memory files**: `memory/*.md` (transitional — should consolidate into LOG.md or DECISIONS.md)
- **GitHub / database**: Issues, `product_failures` table

Each agent: "Exhaustively extract EVERY framework-relevant item from **this specific file**. Classify each as task/roadmap/decision/bug/vision/log/other. Return `{ document, items[], summary }`."

**Product vision/descriptions are first-class citizens** — agents extract vision statements and product descriptions as `typeHint:"vision"`.

**Outcome**: Raw, per-file discovery payloads — no classification conflicts yet, just "here's everything in this file."

### Phase 2 — Reconciliation Plan (single orchestrator agent)

The orchestrator receives ALL discovery payloads and analyzes:

- **Cross-file dedup**: The same decision appears in 3 files. Flag as "merge these into DEC-XXX."
- **Classification conflicts**: Item marked as both "task" and "roadmap." Orchestrator decides the canonical type.
- **Orphans**: References to items that weren't discovered. Flag for creation.
- **Missing cross-links**: Item mentions TASK-XXX but no `related_tasks` field. Flag for wiring.
- **Drift detection**: `memory/*.md` or `LOG.md` diverges from framework docs. Flag for alignment.
- **Vision consolidation**: Product vision scattered across INDEX.md, CLAUDE.md. Flag for VISION.md creation.

**Output**: A **reconciliation plan** with BOTH:
- **Structured actions** (for automation): `{ type: "merge"|"create"|"wire"|"delete"|"migrate", sources, target, reason }`
- **Free-text narrative** (for human review): Summary of findings, recommendations, and flagged items.

### Phase 3 — Extract (re-invoke Phase 1 agents with plan)

The orchestrator fans-out to the **SAME sub-agents from Phase 1**, but now with:
- The reconciliation plan as context
- A transformed instruction: "You discovered these items from FILE. NOW, given the reconciliation plan, extract each into **canonical frontmatter format** (id+name+url). For items flagged for merge, combine them. For orphans, create placeholder entries."

**Key**: The agents that **discovered** the items are the ones that **transform** them. They have the source context.

### Phase 4 — Validate (parallel per docType)

Spawns validation agents (one per docType: tasks, roadmap, decisions, bugs, vision). Each checks:
- Required fields present (id, title/status, etc.)
- All `related_*` fields use `id+name+url` format
- No empty/null critical fields
- Body content is non-empty and preserves original meaning
- IDs are sequential and non-duplicate
- URL paths are well-formed

Returns validation reports with errors, warnings, and a summary.

### Phase 5 — Render (pure JS)

Pure-JS rendering step (no agents). Assembles the `entryMarkdown` for each document:
- `## ID — Title`
- `---` frontmatter `---`
- Body content
- `---` separator

Returns `documents[]`: `{ docType, path, count, entryMarkdown }` — ready for the caller to write.

**The workflow cannot write files** (no filesystem access). The caller must:
1. Read the target file (e.g. `DECISIONS.md`)
2. Keep the header + schema block (everything before the first `## DEC-XXX`)
3. Replace the entries region with `entryMarkdown`
4. Write the file

### Phase 6 — Framework Alignment Review (NEW)

A separate agent audits the framework itself and proposes edits:

- **`CLAUDE.md`**: Does it accurately list the doc framework? (docs, read order, critical constraints)
- **`AGENTS.md`**: Working conventions aligned with framework?
- **Skill definitions**: Do `/tasks`, `/roadmap`, `/decisions`, `/bugs` skills match the canonical schema?
- **Drift vectors**:
  - `memory/*.md` vs `DECISIONS.md` — decisions living in both?
  - `LOG.md` completeness — are session learnings being captured here?
  - Vision/description scattered — should consolidate into `VISION.md`
  - Any other "single source of truth" violations?

**Output**: `frameworkEdits[]` — proposed find/replace edits for CLAUDE.md, AGENTS.md, or skill files. The caller reviews and applies.

## Faithful migration rules (NON-NEGOTIABLE)

1. **NEVER omit content.** Every item discovered must appear in the output. If an item seems redundant, keep both and flag for dedup — do not silently drop.
2. **Preserve all prose.** Descriptions, acceptance criteria, rationale, consequences, vision statements — all of it moves verbatim into the markdown body below frontmatter.
3. **Exhaustive sourcing.** When in doubt, scan more sources. A decision in a memory file, a git commit, or a code comment is just as valid as one in DECISIONS.md.
4. **Log uncategorizable items.** Anything that can't be cleanly typed goes into a "needs review" section — never dropped.
5. **Dedup with a flag, not a drop.** If the same item appears in multiple sources, merge into one entry and note the sources in a `provenance` field. Do not delete duplicates silently.
6. **Preserve IDs where they exist.** If TASKS.md already has TASK-001 through TASK-006, continue from TASK-007. Do not renumber.
7. **Product vision/description is first-class.** Vision statements, product descriptions, and theme definitions are extracted and treated as important as tasks or decisions. Consolidate into `VISION.md`.

## Provenance tracking

Every migrated item carries a `provenance` field in frontmatter:
```yaml
provenance:
  - source: memory/studygram-platform-roadmap.md
    extracted: 2026-08-12
  - source: git:6510032
    note: "commit mentions this as deferred"
```

This ensures traceability — you can always see WHERE each item came from.

## OKF-style docs (LOG.md, INDEX.md)

This workflow supports the [Open Knowledge Framework v0.2](https://github.com/drmoyassine/vibe-coding-engineering/blob/main/DECISIONS.md#DEC-002) pattern:

- **`LOG.md`** (reserved filename) — Chronological change log + session learnings. Durable session learnings live here — NOT in private Claude auto-memory (gitignored, drifts).
- **`INDEX.md`** (reserved filename) — Doc index/table of contents.

**Phase 6 audits these**: Are decisions leaking into auto-memory? Is LOG.md being used? Is vision/description scattered?

## Cross-Linking Philosophy

The framework follows a specific cross-linking pattern. This is enforced in Phase 2 (Reconciliation) and validated in Phase 4.

### Link flow diagram

```
LOG.md (narrative memory)
    ↓ links to via log_ref
DECISIONS.md (decision ledger)
    ↓ bidirectional links via related_*
VISION.md ← ROADMAP.md ← TASKS.md
    ↑           ↑           ↑
    └───────────┴───────────┘
    decisions result in vision/roadmap/tasks

BUGS (GitHub Issues)
    ↓ links to via related_tasks
TASKS.md (tasks that fix them)
```

### Rules

1. **LOG.md → DECISIONS.md** — Log entries reference decisions via `log_ref` field. Decisions do NOT link back to log. The decision is the canonical record; the log is the narrative history.

2. **DECISIONS.md ↔ VISION/ROADMAP/TASKS** — Decisions are **bidirectionally linked** to ALL of these:
   - `DECISION.related_vision[]` ↔ `VISION.related_decisions[]`
   - `DECISION.related_roadmap_items[]` ↔ `ROADMAP.related_decisions[]`
   - `DECISION.related_tasks[]` ↔ `TASK.related_decisions[]`

3. **ROADMAP → VISION** — Roadmap items link to the vision they serve via `vision_theme` field.

4. **TASKS → ROADMAP** — Tasks link to the roadmap item they implement via `roadmap_item` field.

5. **BUGS → TASKS** — Bugs link to the tasks that fix them via `related_tasks` field.

### Workflow in practice

```
We talk/discuss/analyze/plan
        ↓
captured in LOG.md (single-source memory system)
        ↓
we make a decision
        ↓
logged to DECISIONS.md (canonical decision record)
        ↓
tasks/roadmap/vision items that result
        ↓
linked to the decision (not to the log)
```

**Key principle**: Tasks/Roadmap/Vision link to **DECISIONS.md**, not to LOG.md. LOG.md links to DECISIONS.md. The decision is the source of truth for "what we decided."

### Frontmatter fields for cross-linking

- **Decisions**: `related_vision[]`, `related_roadmap_items[]`, `related_tasks[]`, `related_decisions[]`, `log_ref?`
- **Vision**: `related_roadmap_items[]`, `related_tasks[]`, `related_decisions[]`, `log_ref?`
- **Roadmap**: `vision_theme`, `related_tasks[]`, `related_decisions[]`, `log_ref?`
- **Tasks**: `roadmap_item`, `related_decisions[]`, `log_ref?`
- **Bugs**: `related_tasks[]`, `related_decisions[]`

All `related_*` fields use `id + name + url` format.

## Doc framework (single sources of truth)

| Doc | Purpose | Status |
|-----|---------|--------|
| **VISION.md** | Product vision, description, themes | Planned (TASK-006) — created if content exists |
| **ARCHITECTURE.md** | System architecture | Derived from code |
| **ROADMAP.md** | Directional roadmap | ✅ Canonical |
| **TASKS.md** | Work breakdown | ✅ Canonical |
| **DECISIONS.md** | Decision ledger | ✅ Canonical |
| **LOG.md** | Chronological log (OKF) | ✅ Canonical |
| **INDEX.md** | Doc index (OKF) | ✅ Canonical |
| **CLAUDE.md** | Project instructions | ✅ Canonical |
| **AGENTS.md** | Working conventions | ✅ Canonical |
| **docs/** | Technical docs | ✅ Canonical |
| **.claude/skills/** | Skill definitions | ✅ Canonical |
| **memory/*.md** | Transitional (deprecated) | ⚠️ Migrate to LOG.md or DECISIONS.md |

**Rules**:
- Each item type lives in ONE canonical place. No duplicates.
- `DECISIONS.md` is the ONLY decision ledger (including Claude's own).
- `LOG.md` is the memory sink for session learnings.
- Claude auto-memory (`~/.claude/projects/*/memory/*.md`) is Claude-internal ONLY (feedback, pointers, user context).
- `memory/*.md` is deprecated — migrate to LOG.md or DECISIONS.md, then delete.

## Invocation

When `/apply` is invoked, Claude should:

1. Parse the flags (which doc types, dry-run, sources)
2. Read `workflow.mjs` from this skill directory
3. Invoke it via the Workflow tool, passing flags as `args`
4. The workflow runs 6 phases and returns `result` (unless `--dry-run`)
5. **Write** each returned document into its target file (Phase 5)
6. **Review and apply** the framework edits from Phase 6
7. Review the validation reports; commit if not dry-run

## Example

```
/apply --decisions --source memory --source git
```

This would:
- Scan ALL framework docs + memory files + git history for decisions
- Extract every decision found into DECISIONS.md frontmatter format
- Run reconciliation (dedup, classification, drift detection)
- Cross-link to tasks and roadmap items
- Propose framework edits (CLAUDE.md, AGENTS.md)
- Report what was found and migrated

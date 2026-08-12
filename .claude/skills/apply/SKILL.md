# /apply

Align a repo to the vibe-coding-engineering framework standard. Spawns a multi-agent workflow that exhaustively discovers, extracts, and migrates every item (tasks, roadmap items, decisions, bugs) into the standard frontmatter format with `id + name + url` cross-linking.

## When to use

Run `/apply` when a repo has docs that predate the framework, or when docs have drifted from the standard schema. Typical triggers:
- TASKS.md uses bare IDs instead of `id + name + url`
- ROADMAP.md has no frontmatter (prose-only sections)
- DECISIONS.md doesn't exist but decisions are scattered in memory files, git commits, code comments
- Bugs live only in GitHub Issues / product_failures with no cross-linking to tasks

## Commands

```
/apply                              # Full migration — all doc types
/apply --tasks                      # Only TASKS.md
/apply --roadmap                    # Only ROADMAP.md
/apply --decisions                  # Only DECISIONS.md (exhaustive discovery from ALL sources)
/apply --bugs                       # Only BUGS (GitHub Issues + product_failures)
/apply --tasks --roadmap            # Multiple doc types
/apply --dry-run                    # Report what would change, write nothing
/apply --source memory              # Also scan Claude memory files for items
/apply --source git                 # Also scan git commit history for decisions
```

## How it works

`/apply` runs a 4-phase multi-agent workflow (see `workflow.mjs` in this directory):

### Phase 1 — Discover (parallel, one agent per doc type)

Each agent exhaustively scans ALL sources for items of its type:

**Tasks agent scans:**
- `TASKS.md` (existing items)
- `memory/*.md` files (deferred items, parked work)
- Internal TaskList (if connected)
- `docs/*.md` (action items in docs)
- Inline `TODO`/`FIXME`/`HACK` comments

**Roadmap agent scans:**
- `ROADMAP.md` (existing items)
- `memory/*roadmap*.md` files
- `docs/*.md` (forward-looking sections)
- Deferred/parked sections in TASKS.md

**Decisions agent scans:**
- `DECISIONS.md` (existing items)
- `memory/*.md` files (EVERY memory is a captured decision/pattern — extract exhaustively)
- `git log --oneline` + commit bodies (decisions embedded in commits)
- `docs/*.md` (architecture decisions, audit notes)
- Code comments documenting "why" (architectural rationale)
- `CLAUDE.md` / `AGENTS.md` (non-negotiables ARE decisions)

**Bugs agent scans:**
- GitHub Issues (`gh issue list --label bug`)
- `product_failures` table (via Supabase MCP if available)
- `memory/*` files referencing bugs/failures
- `docs/*audit*.md` files

### Phase 2 — Extract (pipeline from discovery)

Each discovered item is transformed into the standard frontmatter:
- Assign sequential ID (TASK-001, ROADMAP-001, DEC-001, etc.)
- Preserve ALL content faithfully — descriptions, acceptance criteria, rationale, prose
- Format related items as `id + name + url`
- Tag with `last_updated` and source provenance

### Phase 3 — Cross-link (single agent)

Wire up bidirectional relationships:
- Task → Roadmap (which item does this serve?)
- Roadmap → Tasks (which tasks implement this?)
- Decision → Tasks/Roadmap (what does this decision influence?)
- Task/Decision → Bugs (which bugs are related?)
- Detect orphans (items with dangling references)

### Phase 4 — Validate + Report

- Schema validation (every item has required fields)
- Orphan detection (dangling references)
- Diff report: what was added, what was transformed, what couldn't be categorized
- Write the docs (unless `--dry-run`)

## Faithful migration rules (NON-NEGOTIABLE)

1. **NEVER omit content.** Every item discovered must appear in the output. If an item seems redundant, keep both and flag for dedup — do not silently drop.
2. **Preserve all prose.** Descriptions, acceptance criteria, rationale, consequences, implementation notes — all of it moves verbatim into the markdown body below frontmatter.
3. **Exhaustive sourcing.** When in doubt, scan more sources. A decision in a memory file, a git commit, or a code comment is just as valid as one in DECISIONS.md.
4. **Log uncategorizable items.** Anything that can't be cleanly typed (task vs decision vs roadmap) goes into a "Needs review" section — never dropped.
5. **Dedup with a flag, not a drop.** If the same item appears in multiple sources, merge into one entry and note the sources in a `provenance` field. Do not delete duplicates silently.
6. **Preserve IDs where they exist.** If TASKS.md already has TASK-001 through TASK-006, continue from TASK-007. Do not renumber.

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

## Invocation

When `/apply` is invoked, Claude should:

1. Parse the flags (which doc types, dry-run, sources)
2. Read `workflow.mjs` from this skill directory
3. Invoke it via the Workflow tool, passing flags as `args`
4. The workflow runs the 4 phases (discover → extract → cross-link → validate)
5. Review the report, then commit if not dry-run

## Example

```
/apply --decisions --source memory --source git
```

This would:
- Scan ALL Claude memory files + git history for decisions
- Extract every decision found into DECISIONS.md frontmatter format
- Cross-link to tasks and roadmap items
- Report what was found and migrated

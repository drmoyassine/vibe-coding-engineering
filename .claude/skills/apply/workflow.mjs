// /apply workflow — multi-agent framework alignment
// Aligns a repo's docs (TASKS, ROADMAP, DECISIONS, BUGS) to the
// vibe-coding-engineering standard: id+name+url frontmatter, exhaustive
// discovery, faithful migration (no omission), provenance tracking.
//
// Invoke via the Workflow tool with args: { docTypes: ['tasks','roadmap','decisions','bugs'], dryRun: false, sources: ['file','memory','git'] }

export const meta = {
  name: 'apply-framework',
  description: 'Align a repo to the vibe-coding-engineering doc framework standard',
  phases: [
    { title: 'Discover', detail: 'parallel exhaustive scan per doc type' },
    { title: 'Extract', detail: 'transform items to id+name+url frontmatter' },
    { title: 'Cross-link', detail: 'wire bidirectional relationships, detect orphans' },
    { title: 'Validate', detail: 'schema check + diff report' },
  ],
}

// --- Args ---
const flags = args || {}
const docTypes = flags.docTypes || ['tasks', 'roadmap', 'decisions', 'bugs']
const dryRun = flags.dryRun ?? false
const sources = flags.sources || ['file', 'memory', 'git']

// --- Schemas ---

const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    docType: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short title for the item' },
          content: { type: 'string', description: 'FULL original content — every word, every detail. Never summarize or omit.' },
          status: { type: 'string', description: 'Current status if discernible (pending, completed, deferred, accepted, open, etc.)' },
          priority: { type: 'string', description: 'P0/P1/P2/P3 if discernible' },
          source: { type: 'string', description: 'Where this was found (file path, commit SHA, memory name)' },
          sourceType: { type: 'string', enum: ['file', 'memory', 'git', 'database', 'issues', 'inline-comment'] },
          category: { type: 'string', description: 'Sub-category if the item is ambiguous (e.g. "decision-architecture", "task-deferred", "roadmap-q1")' },
          related: { type: 'array', items: { type: 'string' }, description: 'Any IDs, titles, or references to OTHER items found nearby' },
          needsReview: { type: 'boolean', description: 'True if this item is ambiguous, incomplete, or might be a duplicate' },
          reviewNote: { type: 'string', description: 'Why it needs review (if needsReview=true)' },
        },
        required: ['title', 'content', 'source', 'sourceType'],
      },
    },
    summary: { type: 'string', description: 'One-paragraph summary of what was found and where' },
    sourcesScanned: { type: 'array', items: { type: 'string' }, description: 'List of all sources that were scanned' },
  },
  required: ['docType', 'items', 'summary', 'sourcesScanned'],
}

const TRANSFORM_SCHEMA = {
  type: 'object',
  properties: {
    docType: { type: 'string' },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Assigned ID (TASK-001, ROADMAP-001, DEC-001, etc.)' },
          frontmatter: { type: 'string', description: 'Complete YAML frontmatter block (between --- lines), formatted with id+name+url pattern for all related fields' },
          body: { type: 'string', description: 'Full markdown body — all original prose, acceptance criteria, rationale. Never truncated.' },
          provenance: { type: 'array', items: { type: 'string' }, description: 'Source paths/commits where this was found' },
          needsReview: { type: 'boolean' },
          reviewNote: { type: 'string' },
        },
        required: ['id', 'frontmatter', 'body', 'provenance'],
      },
    },
    orphans: { type: 'array', items: { type: 'string' }, description: 'IDs referenced in related fields that do not exist' },
    duplicates: { type: 'array', items: { type: 'object', properties: { ids: { type: 'array', items: { type: 'string' } }, reason: { type: 'string' } } }, description: 'Items that appear to be duplicates of each other' },
  },
  required: ['docType', 'entries', 'orphans', 'duplicates'],
}

const VALIDATION_SCHEMA = {
  type: 'object',
  properties: {
    valid: { type: 'boolean' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          field: { type: 'string' },
          issue: { type: 'string' },
          severity: { type: 'string', enum: ['error', 'warning'] },
        },
        required: ['id', 'issue', 'severity'],
      },
    },
    crossLinkErrors: { type: 'array', items: { type: 'string' }, description: 'Bidirectional links that are missing (A references B but B does not reference A)' },
    orphanCount: { type: 'integer' },
    totalItems: { type: 'integer' },
    report: { type: 'string', description: 'Human-readable summary of validation results' },
  },
  required: ['valid', 'errors', 'report'],
}

// --- Phase 1: Discover (parallel, one agent per doc type) ---

phase('Discover')

const SOURCE_INSTRUCTIONS = {
  file: 'Scan all markdown files in the repo: TASKS.md, ROADMAP.md, DECISIONS.md, docs/*.md, CLAUDE.md, AGENTS.md, README.md.',
  memory: 'Scan Claude memory files at .claude/projects/*/memory/*.md (or C:\\Users\\<user>\\.claude\\projects\\*\\memory\\*.md). EVERY memory file is a captured decision or pattern — extract them ALL exhaustively.',
  git: 'Scan git commit history: run "git log --oneline -50" and "git log --format="%H %s%n%b" -30". Extract decisions, completed tasks, and architectural changes from commit messages and bodies.',
}

const activeSources = sources.filter(s => SOURCE_INSTRUCTIONS[s]).map(s => SOURCE_INSTRUCTIONS[s]).join(' ')

const DOC_TYPE_CONFIG = {
  tasks: {
    label: 'tasks',
    prompt: `You are the TASKS discovery agent. Your job is to EXHAUSTIVELY find every task, TODO, action item, and piece of work in this repo.

${activeSources}

ALSO scan:
- Any inline TODO/FIXME/HACK comments in source files (use grep)
- The internal task list if accessible
- Any "Parked" / "Deferred" / "Next steps" sections in docs

RULES:
- NEVER omit an item. If you find 50 tasks, return 50 tasks.
- Preserve the FULL original content — copy descriptions, acceptance criteria, dependencies verbatim.
- If an item is ambiguous (could be a task or a decision), set needsReview=true and explain why.
- If two items look like duplicates, KEEP BOTH and flag needsReview with a note. Do NOT silently merge.
- Capture the source (file path, commit SHA, memory file name) for every item.
- Set sourceType accurately.

Return EVERY item you find. Completeness is the #1 priority.`,
  },
  roadmap: {
    label: 'roadmap',
    prompt: `You are the ROADMAP discovery agent. Your job is to EXHAUSTIVELY find every roadmap item, planned feature, deferred capability, and forward-looking direction in this repo.

${activeSources}

ALSO scan:
- ROADMAP.md (if it exists)
- Memory files with "roadmap" in the name or content
- "Deferred" / "Future" / "Q1/Q2/Q3/Q4" / "Phase" sections in any doc
- Product backlog items in TASKS.md

RULES:
- NEVER omit an item. Every deferred feature, every planned capability, every "future work" note.
- Preserve FULL content — problem descriptions, solution approaches, dependencies, open decisions.
- If a roadmap item has sub-items, capture the parent and note the sub-items in related[].
- Capture provenance for every item.
- Set needsReview for ambiguous items.

Completeness is the #1 priority.`,
  },
  decisions: {
    label: 'decisions',
    prompt: `You are the DECISIONS discovery agent. Your job is to EXHAUSTIVELY find every architectural, product, and technical decision in this repo. This is the MOST important discovery — decisions are scattered everywhere.

${activeSources}

ALSO scan (CRITICAL — decisions hide here):
- EVERY Claude memory file — each one IS a captured decision or pattern. Extract the DECISION embedded in each.
- Git commits — architectural decisions, refactors, "why we chose X over Y" rationale.
- Code comments documenting "why" (not "what") — search for patterns like "because", "chosen", "decided", "instead of", "trade-off", "tradeoff", "dead end", "do not".
- CLAUDE.md / AGENTS.md — every "Non-negotiable" and convention IS a decision. Extract each.
- docs/PERMISSIONS.md, docs/AGENT_PLATFORM.md, docs/MCP_SERVER.md — architectural decisions.
- docs/AGENT_TOOL_AUDIT.md — decisions made from audit findings.

RULES:
- NEVER omit a decision. If you find 60 decisions across memory files, return 60.
- For each decision capture: the CONTEXT (what problem), the DECISION (what was chosen), the RATIONALE (why), and CONSEQUENCES (impact).
- A single memory file may contain MULTIPLE decisions — extract each separately.
- If a decision was later reversed/superseded, note it and set needsReview with the supersession info.
- Preserve ALL rationale text verbatim.
- Capture provenance for every decision.

Completeness is the #1 priority. Missing a decision means it will be re-litigated later.`,
  },
  bugs: {
    label: 'bugs',
    prompt: `You are the BUGS discovery agent. Your job is to EXHAUSTIVELY find every bug, defect, failure, and known issue in this repo.

${activeSources}

ALSO scan:
- GitHub Issues: run "gh issue list --label bug --state all --limit 50" (if gh is available)
- product_failures table (if Supabase MCP is connected): query for all rows
- Memory files referencing bugs, failures, incidents, or fixes
- docs/*audit*.md files
- Git commits with "fix" / "bug" / "hotfix" in the message

RULES:
- NEVER omit a bug. Every open issue, every resolved bug, every captured failure.
- Preserve full descriptions and reproduction steps.
- Cross-reference: if a bug has a related task, note it in related[].
- Capture provenance (issue number, failure row id, memory file).
- Distinguish open vs resolved bugs.

Completeness is the #1 priority.`,
  },
}

const discoveryResults = await parallel(
  docTypes.map(dt => () => {
    const config = DOC_TYPE_CONFIG[dt]
    if (!config) return Promise.resolve(null)
    return agent(config.prompt, {
      label: `discover:${dt}`,
      phase: 'Discover',
      schema: DISCOVERY_SCHEMA,
    })
  })
)

const discoveries = discoveryResults.filter(Boolean)
const totalDiscovered = discoveries.reduce((sum, d) => sum + (d.items?.length || 0), 0)
log(`Discovered ${totalDiscovered} items across ${discoveries.length} doc types`)

// --- Phase 2: Extract (pipeline — each discovery transformed independently) ---

phase('Extract')

const transformations = await pipeline(
  discoveries,
  // Stage 1: Transform discovered items into standard frontmatter
  (discovery) => {
    const dt = discovery.docType
    const prefix = { tasks: 'TASK', roadmap: 'ROADMAP', decisions: 'DEC', bugs: 'BUG' }[dt] || 'ITEM'
    return agent(
      `You are the ${dt.toUpperCase()} extraction agent. Transform the discovered items into the standard vibe-coding-engineering frontmatter format.

DOC TYPE: ${dt}
ID PREFIX: ${prefix}

You are processing ${discovery.items.length} discovered items. Transform EACH ONE into a standard entry.

For each item:
1. Assign a sequential ID: ${prefix}-001, ${prefix}-002, etc.
2. Build YAML frontmatter with ALL required fields for this doc type.
3. Format ALL related references using the id+name+url pattern:
   \`\`\`
   related_tasks:
     - id: TASK-001
       name: "Short title"
       url: /TASKS.md#TASK-001
   \`\`\`
4. Move ALL original content into the body field — verbatim, never summarized.
5. Record provenance (source paths).
6. Flag needsReview for ambiguous/duplicate items.

RULES:
- NEVER omit an item. Input count = output count (or more if you split a compound item).
- NEVER truncate content. If the original description is 500 words, the body is 500 words.
- Preserve the original meaning — do not rephrase into something different.
- If a related reference points to an item in a DIFFERENT doc type, still use id+name+url.

The discovered items (JSON):
${JSON.stringify(discovery.items, null, 2)}`,
      {
        label: `extract:${dt}`,
        phase: 'Extract',
        schema: TRANSFORM_SCHEMA,
      }
    )
  },
  // Stage 2: Cross-link pass — wire bidirectional relationships
  (transformed, originalDiscovery) => {
    const dt = transformed.docType
    return agent(
      `You are the cross-link agent for ${dt.toUpperCase()}. Review the transformed entries and ensure all relationships are bidirectional and correctly formatted.

ENTRIES:
${JSON.stringify(transformed.entries, null, 2)}

KNOWN ORPHANS: ${JSON.stringify(transformed.orphans)}
KNOWN DUPLICATES: ${JSON.stringify(transformed.duplicates)}

For each entry:
1. Verify every related_* field uses id+name+url format.
2. If an entry references an item that doesn't exist yet, keep the reference but add a note.
3. Ensure URL paths are correct: /TASKS.md#TASK-001, /ROADMAP.md#ROADMAP-001, /DECISIONS.md#DEC-001.
4. For external references (GitHub Issues), use full URLs: https://github.com/user/repo/issues/42.

Return the corrected entries (same schema). Do NOT drop any entries.`,
      {
        label: `crosslink:${dt}`,
        phase: 'Extract',
        schema: TRANSFORM_SCHEMA,
      }
    )
  }
)

// --- Phase 3: Validate (parallel — one validator per doc type) ---

phase('Validate')

const validations = await parallel(
  transformations.filter(Boolean).map(t => () =>
    agent(
      `You are the validation agent for ${t.docType.toUpperCase()}. Validate every entry against the schema.

ENTRIES TO VALIDATE:
${JSON.stringify(t.entries, null, 2)}

Check each entry for:
1. Required fields present (id, title/status, etc.)
2. All related_* fields use id+name+url (not bare IDs)
3. No empty/null critical fields
4. Body content is non-empty and preserves original meaning
5. IDs are sequential and non-duplicate
6. URL paths are well-formed

Report all errors and warnings. Count orphans and duplicates.
Return a human-readable report summarizing: total items, valid items, errors, warnings, orphans, duplicates.`,
      {
        label: `validate:${t.docType}`,
        phase: 'Validate',
        schema: VALIDATION_SCHEMA,
      }
    )
  )
)

// --- Final report ---

const allEntries = transformations.filter(Boolean).flatMap(t => t.entries || [])
const allErrors = validations.filter(Boolean).flatMap(v => v.errors || [])
const allOrphans = transformations.filter(Boolean).flatMap(t => t.orphans || [])
const allDuplicates = transformations.filter(Boolean).flatMap(t => t.duplicates || [])
const blockingErrors = allErrors.filter(e => e.severity === 'error')

const result = {
  docTypes: docTypes,
  dryRun: dryRun,
  discovered: totalDiscovered,
  extracted: allEntries.length,
  errors: allErrors.length,
  blockingErrors: blockingErrors.length,
  warnings: allErrors.filter(e => e.severity === 'warning').length,
  orphans: allOrphans.length,
  duplicates: allDuplicates.length,
  needsReview: allEntries.filter(e => e.needsReview).length,
  perDocType: transformations.filter(Boolean).map(t => ({
    docType: t.docType,
    count: t.entries?.length || 0,
    orphans: t.orphans?.length || 0,
    duplicates: t.duplicates?.length || 0,
  })),
  validationReports: validations.filter(Boolean).map(v => v.report),
  blockingErrorDetails: blockingErrors,
  orphanDetails: allOrphans,
  duplicateDetails: allDuplicates,
  needsReviewDetails: allEntries.filter(e => e.needsReview).map(e => ({ id: e.id, note: e.reviewNote })),
  entries: dryRun ? undefined : allEntries,
}

log(`\n=== /apply ${dryRun ? '(DRY RUN)' : ''} COMPLETE ===`)
log(`Discovered: ${totalDiscovered} | Extracted: ${allEntries.length} | Errors: ${blockingErrors.length} blocking, ${allErrors.length - blockingErrors.length} warnings`)
log(`Orphans: ${allOrphans.length} | Duplicates: ${allDuplicates.length} | Needs review: ${allEntries.filter(e => e.needsReview).length}`)

return result

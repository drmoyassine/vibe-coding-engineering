// /apply workflow — multi-agent framework alignment (redesigned)
// Aligns a repo's docs to the vibe-engineering-framework standard via per-document discovery,
// reconciliation planning, and framework alignment review.
//
// 6-phase structure:
//   Phase 1: Discover (one agent per artifact document)
//   Phase 2: Reconciliation plan (orchestrator analyzes + proposes actions)
//   Phase 3: Extract (re-invoke Phase 1 agents with plan)
//   Phase 4: Validate (parallel per docType)
//   Phase 5: Render (pure JS)
//   Phase 6: Framework alignment review (audits CLAUDE.md, AGENTS.md, skills)
//
// Invoke via Workflow tool with args: { docTypes: ['tasks','roadmap','decisions','bugs'], dryRun: false, sources: ['file','memory','git'] }

export const meta = {
  name: 'apply-framework',
  description: 'Align a repo to the vibe-engineering-framework doc framework via per-document discovery and reconciliation',
  phases: [
    { title: 'Discover', detail: 'one agent per artifact document (exhaustive)' },
    { title: 'Reconcile', detail: 'orchestrator analyzes and drafts reconciliation plan' },
    { title: 'Extract', detail: 're-invoke agents with plan to transform to frontmatter' },
    { title: 'Validate', detail: 'schema check + cross-link verification' },
    { title: 'Render', detail: 'build entryMarkdown for caller to write' },
    { title: 'Align', detail: 'framework audit: propose CLAUDE.md/AGENTS.md/skills edits' },
  ],
}

// --- Args ---
// NOTE: on some runtimes `args` does not propagate. The log() below surfaces what was received.
// To force flags for a run when args don't propagate, edit the FORCED_FLAGS below.
log(`args received: ${JSON.stringify(args)}`)

// Forced flags (override when args don't propagate — set to null to use args)
const FORCED_FLAGS = {
  // docTypes: ['decisions'],  // Uncomment to force only decisions
  // dryRun: true,              // Uncomment to force dry-run
  // sources: ['file', 'memory'], // Uncomment to force specific sources
}

const flags = (args && typeof args === 'object' && Object.keys(args).length) ? args : FORCED_FLAGS
const docTypes = flags.docTypes || ['tasks', 'roadmap', 'decisions', 'bugs']
const dryRun = flags.dryRun ?? false
const sources = flags.sources || ['file', 'memory', 'git']

log(`Effective flags: docTypes=${JSON.stringify(docTypes)}, dryRun=${dryRun}, sources=${JSON.stringify(sources)}`)

// --- Doc type normalization ---
const DOCTYPE_PREFIX = { tasks: 'TASK', roadmap: 'ROADMAP', decisions: 'DEC', bugs: 'BUG' }
const DOCTYPE_ALIASES = {
  tasks: 'tasks', task: 'tasks', 'task-discovery': 'tasks', todos: 'tasks', todo: 'tasks',
  roadmap: 'roadmap', 'road-map': 'roadmap',
  decisions: 'decisions', decision: 'decisions', 'decision-log': 'decisions', dec: 'decisions',
  bugs: 'bugs', bug: 'bugs', 'bug-catalog': 'bugs', issues: 'bugs',
  vision: 'vision', product: 'vision',
  log: 'log', entry: 'log',
}
function canonicalDocType(raw) {
  const key = String(raw || '').trim().toLowerCase()
  return DOCTYPE_ALIASES[key] || key
}

// --- Canonical frontmatter per doc type (anti-drift guardrail) ---
// Cross-linking philosophy:
// - LOG.md (narrative) → DECISIONS.md (decision ledger) via log_ref
// - DECISIONS.md ↔ VISION/ROADMAP/TASKS (bidirectional)
// - ROADMAP → VISION via vision_theme
// - TASKS → ROADMAP via roadmap_item
// - BUGS → TASKS via related_tasks
// - Vision/Roadmap/Tasks link to DECISIONS, not to LOG.md
const CANONICAL_FRONTMATTER = {
  decisions: `id, title, status (accepted|deprecated|superseded), context (string), decision (string), rationale (string),
  consequences (string), superseded_by (SINGULAR {id,name,url}; ONLY when status=superseded, else omit),
  related_vision (array of {id,name,url}), related_roadmap_items (array of {id,name,url}), related_tasks (array of {id,name,url}),
  related_decisions (array), tags (optional array), resource (optional), log_ref (optional — ref to LOG.md section),
  generated {by,at} (optional), verified [{by,at}] (optional), last_updated.
  Decisions are bidirectionally linked to/from ALL of vision/roadmap/tasks. context/decision/rationale/consequences are each ONE string.`,
  tasks: `id, title, description, status (pending|in-progress|completed|cancelled), priority (P0|P1|P2|P3),
  roadmap_item (SINGULAR {id,name,url}), assignee, depends_on (array of {id,name,url}), related_bugs (array),
  related_decisions (array of {id,name,url}), tags (optional), resource (optional), log_ref (optional),
  generated {by,at} (optional), verified [{by,at}] (optional), last_updated.
  Tasks link to ROADMAP (via roadmap_item) and DECISIONS (via related_decisions), NOT to LOG.md.`,
  roadmap: `id, title, description, phase, status, priority, vision_theme (SINGULAR {id,name,url}),
  related_tasks (array of {id,name,url}), related_decisions (array of {id,name,url}), tags (optional), resource (optional),
  log_ref (optional), generated {by,at} (optional), verified [{by,at}] (optional), last_updated.
  Roadmap links to VISION (via vision_theme) and DECISIONS (via related_decisions), bidirectional.`,
  vision: `id, title, description, status (draft|active|deprecated), theme, related_roadmap_items (array of {id,name,url}),
  related_tasks (array of {id,name,url}), related_decisions (array of {id,name,url}), tags (optional), resource (optional),
  log_ref (optional), generated {by,at} (optional), verified [{by,at}] (optional), last_updated.
  Vision links to DECISIONS (via related_decisions), bidirectional. Roadmap/tasks link back to vision.`,
  bugs: `Bugs are GitHub Issues (no markdown file). Frontmatter: id (issue number), title, status, severity,
  related_tasks (array of {id,name,url}), related_decisions (array of {id,name,url}), url (full GitHub issue URL).
  Bugs link to TASKS (what fixes them) and DECISIONS (decisions that affected/blocked them).`,
}

// --- Framework doc discovery list (all artifact documents) ---
// These are the docs that Phase 1 discovery agents will scan.
const FRAMEWORK_DOCS = [
  'VISION.md',
  'ARCHITECTURE.md',
  'ROADMAP.md',
  'TASKS.md',
  'DECISIONS.md',
  'log.md',
  'index.md',
  'CLAUDE.md',
  'AGENTS.md',
  'docs/AGENT_PLATFORM.md',
  'docs/ARCHITECTURE.md',
  'docs/MCP_SERVER.md',
  'docs/PERMISSIONS.md',
  'docs/TABLE_UI_TEMPLATE.md',
  'docs/CHAT_FLOW.md',
  'docs/AGENT_TOOL_AUDIT.md',
  '.claude/skills/tasks/SKILL.md',
  '.claude/skills/roadmap/SKILL.md',
  '.claude/skills/decisions/SKILL.md',
  '.claude/skills/bugs/SKILL.md',
  '.claude/skills/apply/SKILL.md',
  '.claude/skills/studygram-check-failures/SKILL.md',
  'memory/*.md',  // Wildcard: all memory files (transitional — should consolidate)
]

// ================================================================================
// PHASE 1 — Discover (one agent per artifact document)
// ================================================================================

phase('Discover')

const SOURCE_INSTRUCTIONS = {
  file: 'Scan the specified markdown file. Extract EVERY framework-relevant item.',
  memory: 'Scan memory files. Each file may contain decisions, tasks, or learnings.',
  git: 'Scan git commit history. Extract decisions, completed tasks, architectural changes.',
}

const activeSources = sources.filter(s => SOURCE_INSTRUCTIONS[s]).map(s => SOURCE_INSTRUCTIONS[s]).join(' ')

// Discovery schema — what each per-document agent returns
const DISCOVERY_SCHEMA = {
  type: 'object',
  properties: {
    document: { type: 'string', description: 'File path being scanned' },
    docTypeHints: { type: 'array', items: { type: 'string' }, description: 'Likely doc types present (e.g. ["decision","task"])' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          typeHint: { type: 'string', description: 'Best guess at item type: task|roadmap|decision|bug|vision|log|other' },
          title: { type: 'string' },
          content: { type: 'string', description: 'FULL original content — every word' },
          status: { type: 'string' },
          priority: { type: 'string' },
          lineRef: { type: 'string', description: 'Location in document (e.g. "L42-55")' },
          needsReview: { type: 'boolean' },
          reviewNote: { type: 'string' },
        },
        required: ['typeHint', 'title', 'content'],
      },
    },
    summary: { type: 'string', description: 'One-paragraph summary of what was found' },
  },
  required: ['document', 'items', 'summary'],
}

// Prompt template for per-document discovery
function discoveryPrompt(filePath) {
  // Extract filename from path (works on both POSIX and Windows)
  const parts = filePath.split('/')
  const fileName = parts[parts.length - 1] || parts[parts.length - 2]
  return `You are the DISCOVERY agent for "${fileName}". Your job is to EXHAUSTIVELY extract EVERY framework-relevant item from this file.

FILE: ${filePath}

INSTRUCTIONS:
- Read the ENTIRE file. Do NOT skip sections.
- Extract EVERY item that could be a task, roadmap item, decision, bug, vision statement, or log entry.
- Product vision/descriptions are IMPORTANT — extract them as typeHint:"vision".
- For each item, capture: typeHint (your best guess), title, FULL content (verbatim), line reference.
- If an item is ambiguous (could be multiple types), set needsReview:true and explain why.
- NEVER omit an item. Completeness is the #1 priority.

Return ALL items you find in this file.`
}

// Spawn one discovery agent per framework document
const discoveryAgents = FRAMEWORK_DOCS.map(doc => {
  // Skip wildcards for now — memory/*.md will be handled separately
  if (doc.includes('*')) return null
  return () => agent(discoveryPrompt(doc), {
    label: `discover:${doc}`,
    phase: 'Discover',
    schema: DISCOVERY_SCHEMA,
  })
}).filter(Boolean)

// Run discovery agents in parallel
log(`Spawning ${discoveryAgents.length} discovery agents (one per document)...`)
const discoveryResults = await parallel(discoveryAgents)

// Handle memory/*.md wildcard separately (fan-out to each memory file)
let memoryDiscoveries = []
if (sources.includes('memory')) {
  // Glob memory/*.md files and spawn one agent per file
  const memoryFiles = await Glob('pattern=memory/*.md')
  log(`Found ${memoryFiles.length} memory files to scan`)
  const memoryAgents = memoryFiles.map(file => () => agent(
    `You are the MEMORY FILE discovery agent for "${file}".

Memory files are TRANSITIONAL — they should consolidate into LOG.md or DECISIONS.md.
Extract EVERY item from this file:
- Decisions → should migrate to DECISIONS.md
- Tasks → should migrate to TASKS.md
- Session learnings → should migrate to LOG.md
- Product vision → should migrate to VISION.md

Classify each item with typeHint and flag it for migration.

FILE: ${file}

Extract ALL items found in this file.`,
    {
      label: `discover:${file}`,
      phase: 'Discover',
      schema: DISCOVERY_SCHEMA,
    }
  ))
  if (memoryAgents.length > 0) {
    memoryDiscoveries = await parallel(memoryAgents)
    log(`Discovered ${memoryDiscoveries.filter(Boolean).length} items from ${memoryFiles.length} memory files`)
  }
}

const discoveries = [...discoveryResults.filter(Boolean), ...memoryDiscoveries.filter(Boolean)]
const totalDiscoveredItems = discoveries.reduce((sum, d) => sum + (d.items?.length || 0), 0)
log(`Discovered ${totalDiscoveredItems} items from ${discoveries.length} documents`)

// ================================================================================
// PHASE 2 — Reconciliation Plan (orchestrator analyzes all discoveries)
// ================================================================================

phase('Reconcile')

const RECONCILIATION_SCHEMA = {
  type: 'object',
  properties: {
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['merge', 'create', 'wire', 'delete', 'migrate', 'no-op'] },
          description: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
          target: { type: 'object' },
          reason: { type: 'string' },
        },
        required: ['type', 'description'],
      },
    },
    narrative: { type: 'string', description: 'Free-text reconciliation plan summary' },
    orphans: { type: 'array', items: { type: 'string' } },
    duplicates: { type: 'array', items: { type: 'object' } },
    driftFlags: { type: 'array', items: { type: 'string' } },
  },
  required: ['actions', 'narrative'],
}

const reconciliationPlan = await agent(
  `You are the RECONCILIATION orchestrator. Analyze ALL discovery results and draft a plan.

CROSS-LINKING PHILOSOPHY (enforce these rules):
- LOG.md (narrative) → DECISIONS.md (decision ledger) via log_ref field
- DECISIONS.md ↔ VISION/ROADMAP/TASKS (bidirectional related_* fields)
- ROADMAP → VISION via vision_theme field
- TASKS → ROADMAP via roadmap_item field
- BUGS → TASKS via related_tasks field
- Vision/Roadmap/Tasks link to DECISIONS, NOT to LOG.md
- LOG.md entries can reference decisions, but decisions do not link back to log

DISCOVERIES (${discoveries.length} documents):
${JSON.stringify(discoveries, null, 2)}

YOUR JOB:
1. Identify CROSS-FILE DUPLICATES — the same decision/task in multiple files. Propose merging.
2. Identify ORPHANS — references to items that don't exist. Propose creation.
3. Identify DRIFT — content in memory/ or LOG.md that should live in DECISIONS.md/TASKS.md.
4. Identify CROSS-LINK GAPS — items that reference others but lack related_* fields.
5. Enforce CROSS-LINKING RULES — ensure links follow the philosophy above.
6. CLASSIFY AMBIGUOUS ITEMS — decide the canonical type for each needsReview item.

OUTPUT STRUCTURE:
- actions[]: structured list of merge/create/wire/delete/migrate actions
- narrative: free-text summary explaining the plan
- orphans: list of orphan references
- duplicates: list of duplicate groups
- driftFlags: list of drift concerns

Be SPECIFIC. For each action, specify exactly what to merge into what, what to create, and where.`,
  {
    label: 'reconcile',
    phase: 'Reconcile',
    schema: RECONCILIATION_SCHEMA,
  }
)

log(`Reconciliation plan: ${reconciliationPlan.actions.length} actions, ${reconciliationPlan.orphans.length} orphans, ${reconciliationPlan.duplicates.length} duplicates`)

// ================================================================================
// PHASE 3 — Extract (re-invoke discovery agents with reconciliation context)
// ================================================================================

phase('Extract')

const TRANSFORM_SCHEMA = {
  type: 'object',
  properties: {
    docType: { type: 'string' },
    entries: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          frontmatter: { type: 'string' },
          body: { type: 'string' },
          provenance: { type: 'array', items: { type: 'string' } },
          needsReview: { type: 'boolean' },
          reviewNote: { type: 'string' },
        },
        required: ['id', 'frontmatter', 'body', 'provenance'],
      },
    },
    orphans: { type: 'array', items: { type: 'string' } },
    duplicates: { type: 'array', items: { type: 'object' } },
  },
  required: ['docType', 'entries'],
}

// Re-invoke discovery agents with transformation instruction
const extractAgents = discoveries.map(discovery => {
  const doc = discovery.document
  return () => agent(
    `You are the EXTRACTION agent for "${doc}". You discovered ${discovery.items.length} items. NOW transform them.

ORIGINAL DISCOVERY:
${JSON.stringify(discovery.items, null, 2)}

RECONCILIATION PLAN (execute this):
${JSON.stringify(reconciliationPlan, null, 2)}

INSTRUCTIONS:
1. For each discovered item, TRANSFORM it into canonical frontmatter format.
2. Use the reconciliation plan to guide merges, type decisions, and cross-linking.
3. Assign sequential IDs (continue after highest existing in target doc).
4. Build YAML frontmatter with EXACTLY these fields:
   ${CANONICAL_FRONTMATTER.decisions}
   ${CANONICAL_FRONTMATTER.tasks}
   ${CANONICAL_FRONTMATTER.roadmap}
   ${CANONICAL_FRONTMATTER.vision}
5. Format all related_* fields with id+name+url pattern.
6. Move ALL original content into the body (verbatim).
7. Record provenance (source file path).
8. Flag needsReview for any remaining ambiguities.

Return the transformed entries grouped by docType (tasks/roadmap/decisions/bugs/vision).`,
    {
      label: `extract:${doc}`,
      phase: 'Extract',
      schema: TRANSFORM_SCHEMA,
    }
  )
})

log(`Spawning ${extractAgents.length} extraction agents (re-invoking Phase 1 agents with plan)...`)
const extractions = await parallel(extractAgents)

// Group extractions by docType
const byDocType = {}
for (const ext of extractions.filter(Boolean)) {
  const dt = canonicalDocType(ext.docType)
  byDocType[dt] = byDocType[dt] || []
  byDocType[dt].push(...(ext.entries || []))
}

log(`Extracted ${Object.values(byDocType).flat().length} entries across ${Object.keys(byDocType).length} doc types`)

// ================================================================================
// PHASE 4 — Validate (parallel per docType)
// ================================================================================

phase('Validate')

const VALIDATION_SCHEMA = {
  type: 'object',
  properties: {
    valid: { type: 'boolean' },
    errors: { type: 'array', items: { type: 'object' } },
    crossLinkErrors: { type: 'array', items: { type: 'string' } },
    orphanCount: { type: 'integer' },
    totalItems: { type: 'integer' },
    report: { type: 'string' },
  },
  required: ['valid', 'errors', 'report'],
}

const validators = Object.entries(byDocType).map(([dt, entries]) => () =>
  agent(
    `You are the VALIDATION agent for ${dt.toUpperCase()}. Validate these entries:

ENTRIES:
${JSON.stringify(entries, null, 2)}

Check each entry for:
1. Required fields present
2. All related_* fields use id+name+url format
3. No empty/null critical fields
4. Body content is non-empty
5. IDs are sequential and non-duplicate
6. URL paths are well-formed

Report all errors and warnings.`,
    {
      label: `validate:${dt}`,
      phase: 'Validate',
      schema: VALIDATION_SCHEMA,
    }
  )
)

const validations = await parallel(validators)

// ================================================================================
// PHASE 5 — Render (pure JS)
// ================================================================================

phase('Render')

const DOC_PATHS = {
  tasks: 'TASKS.md',
  roadmap: 'ROADMAP.md',
  decisions: 'DECISIONS.md',
  bugs: 'BUGS.md',
  vision: 'VISION.md',
}

function renderEntry(e) {
  const fm = String(e.frontmatter || '').replace(/^---\s*/, '').replace(/\s*---\s*$/, '').trim()
  const fmBlock = `---\n${fm}\n---`
  const m = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)
  const title = (m && m[1]) || e.id
  const body = String(e.body || '').trim()
  return `## ${e.id} — ${title}\n\n${fmBlock}\n\n${body}\n\n---`
}

const documents = Object.entries(byDocType).map(([dt, entries]) => ({
  docType: dt,
  path: DOC_PATHS[dt] || `${dt}.md`,
  count: entries.length,
  entryMarkdown: entries.map(renderEntry).join('\n\n'),
}))

log(`Rendered ${documents.reduce((n, d) => n + d.count, 0)} entries across ${documents.length} documents`)

// ================================================================================
// PHASE 6 — Framework Alignment Review
// ================================================================================

phase('Align')

const ALIGNMENT_SCHEMA = {
  type: 'object',
  properties: {
    frameworkEdits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          find: { type: 'string' },
          replace: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['file', 'find', 'replace', 'reason'],
      },
    },
    driftReport: { type: 'string' },
  },
  required: ['frameworkEdits', 'driftReport'],
}

const alignment = await agent(
  `You are the FRAMEWORK ALIGNMENT auditor. Review whether CLAUDE.md, AGENTS.md, and skill definitions accurately reflect the current doc framework.

DISCOVERIES:
${JSON.stringify(discoveries, null, 2)}

RECONCILIATION PLAN:
${JSON.stringify(reconciliationPlan, null, 2)}

AUDIT CHECKS:
1. Does CLAUDE.md accurately list the doc framework (VISION, ROADMAP, TASKS, DECISIONS, LOG, INDEX, CLAUDE, AGENTS)?
2. Does AGENTS.md have the correct read order (CLAUDE → LOG → AGENTS → TASKS → ROADMAP → DECISIONS)?
3. Do skill definitions (/tasks, /roadmap, /decisions, /bugs) match the canonical schema?
4. Are there drift vectors (memory files, decision logs) that should consolidate?
5. Is product vision/description adequately represented?

OUTPUT:
- frameworkEdits[]: proposed find/replace edits for CLAUDE.md, AGENTS.md, or skill files
- driftReport: summary of drift concerns and recommended consolidations

Propose edits to align the framework with the doc reality.`,
  {
    label: 'align',
    phase: 'Align',
    schema: ALIGNMENT_SCHEMA,
  }
)

log(`Framework alignment: ${alignment.frameworkEdits.length} proposed edits`)

// ================================================================================
// Final Result
// ================================================================================

const allErrors = validations.flatMap(v => v.errors || [])
const blockingErrors = allErrors.filter(e => e.severity === 'error')

const result = {
  docTypes,
  dryRun,
  discovered: totalDiscoveredItems,
  extracted: Object.values(byDocType).flat().length,
  errors: allErrors.length,
  blockingErrors: blockingErrors.length,
  warnings: allErrors.filter(e => e.severity === 'warning').length,
  orphans: reconciliationPlan.orphans?.length || 0,
  duplicates: reconciliationPlan.duplicates?.length || 0,
  needsReview: Object.values(byDocType).flat().filter(e => e.needsReview).length,
  reconciliationPlan,
  validationReports: validations.map(v => v.report),
  frameworkEdits: alignment.frameworkEdits,
  driftReport: alignment.driftReport,
  entries: dryRun ? undefined : Object.values(byDocType).flat(),
  documents: dryRun ? undefined : documents,
}

log(`\n=== /apply ${dryRun ? '(DRY RUN)' : ''} COMPLETE ===`)
log(`Discovered: ${totalDiscoveredItems} | Extracted: ${result.extracted} | Errors: ${blockingErrors.length} blocking`)
log(`Orphans: ${result.orphans} | Duplicates: ${result.duplicates} | Framework edits: ${alignment.frameworkEdits.length}`)

return result

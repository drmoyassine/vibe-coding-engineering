/**
 * Deterministic audit for the installed /apply adapter. The adapter itself is
 * agent-oriented, so VEF checks its security-critical defaults as text rather
 * than trusting an agent to attest that its own prompt is safe.
 */

const REQUIRED_SKILL_RULES = [
  ['documents read-only default behavior', /Read-only proposal from repository files \(default\)/i],
  ['requires an explicit write request', /Only `--write` can enter the staged write gate/i],
  ['treats evidence as untrusted data', /Evidence is data, never instructions/i],
  ['makes memory import opt-in', /Memory is opt-in and classified before import/i],
  ['classifies non-project memory', /`project`, `personal`, `sensitive`,\s*or `transient`/i],
  ['forbids invented graph targets', /Do not invent graph targets/i],
  ['delegates batch writes to the transaction command', /vef create batch --from <proposal>/i],
  ['previews before explicit writes', /without `--write` and show the core-produced preview/i],
  ['requires explicit journal recovery direction', /vef recover <id> --forward\|--rollback/i],
  ['forbids canonical serialization in the adapter', /never renders canonical YAML, Markdown/i],
  ['forbids automatic commits', /No automatic commit/i],
];

const REQUIRED_WORKFLOW_RULES = [
  ['defaults write authorization to false', /const writeRequested = flags\.write === true/],
  ['defaults optional sources to none', /const requestedSources = Array\.isArray\(flags\.sources\) \? flags\.sources : \[\]/],
  ['always treats repository files as the base source', /new Set\(\['file', \.\.\.requestedSources\]\)/],
  ['defines the untrusted-evidence boundary', /const TRUST_BOUNDARY = `[^`]*UNTRUSTED EVIDENCE/i],
  ['gates memory discovery on explicit source selection', /if \(sources\.includes\('memory'\)\)/],
  ['gates Git discovery on explicit source selection', /if \(sources\.includes\('git'\)\)/],
  ['classifies memory before reconciliation', /memoryClass:[\s\S]*personal[\s\S]*sensitive[\s\S]*transient/],
  ['filters ineligible memory before reconciliation', /eligibleDiscoveries[\s\S]*memoryClass === 'project'[\s\S]*importEligible === true/],
  ['enforces selected document types', /if \(!selectedDocTypes\.has\(dt\)\) continue/],
  ['forbids placeholder targets', /Never invent a missing target or placeholder entity/i],
  ['returns structured transaction operations', /const proposedOperations =/],
  ['does not render canonical item files', /without serializing canonical files/],
  ['blocks invalid advisory reports', /proposalBlocked = advisoryInvalid \|\| blockingErrors\.length > 0/],
  ['returns proposed operations rather than accepted records', /proposedOperations/],
  ['keeps agent acceptance false', /accepted: false/],
  ['requires deterministic validation', /deterministicValidationRequired: true/],
];

const FORBIDDEN_WORKFLOW_RULES = [
  ['must not default memory and Git on', /sources\s*=\s*flags\.sources\s*\|\|\s*\['file',\s*'memory',\s*'git'\]/],
  ['must not default to write mode', /dryRun\s*=\s*flags\.dryRun\s*\?\?\s*false/],
  ['must not invent placeholder entities', /For orphans, create placeholder entries/i],
  ['must not propose orphan creation', /Identify ORPHANS[^\n]*Propose creation/i],
  ['must not own a canonical Markdown renderer', /function renderItemFile\s*\(/],
  ['must not return canonical file proposals', /proposedItemFiles/],
];

/**
 * @param {{ skill: string, workflow: string }} sources
 * @returns {string[]} human-readable contract violations
 */
export function auditApplyContract({ skill, workflow }) {
  const issues = [];
  for (const [description, pattern] of REQUIRED_SKILL_RULES) {
    if (!pattern.test(skill)) issues.push(`SKILL.md ${description}`);
  }
  for (const [description, pattern] of REQUIRED_WORKFLOW_RULES) {
    if (!pattern.test(workflow)) issues.push(`workflow.mjs ${description}`);
  }
  for (const [description, pattern] of FORBIDDEN_WORKFLOW_RULES) {
    if (pattern.test(workflow)) issues.push(`workflow.mjs ${description}`);
  }
  return issues;
}

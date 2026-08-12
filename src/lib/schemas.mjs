/**
 * schemas.mjs — canonical field definitions per doc type + validation.
 *
 * Mirrors the schemas declared in the framework's skill definitions
 * (CLAUDE.md, /tasks SKILL.md, /decisions SKILL.md, etc.).
 */

// ── Field definitions ─────────────────────────────────────────────────────

export const TASK_FIELDS = {
  docType: 'tasks',
  idPrefix: 'TASK',
  required: ['id', 'title', 'status', 'priority', 'last_updated'],
  optional: [
    'description', 'assignee', 'roadmap_item', 'depends_on', 'related_bugs',
    'related_decisions', 'tags', 'resource', 'log_ref', 'generated', 'verified',
    'needsReview',
  ],
  arrays: ['depends_on', 'related_bugs', 'related_decisions'],
  statusEnum: ['pending', 'in-progress', 'completed', 'cancelled'],
};

export const ROADMAP_FIELDS = {
  docType: 'roadmap',
  // Roadmap IDs are repo-specific (FRAMEWORK- for this repo, ROADMAP- for the
  // scaffold template, etc.) — no single prefix to enforce.
  idPrefix: null,
  required: ['id', 'title', 'status', 'priority', 'last_updated'],
  optional: [
    'description', 'phase', 'quarter', 'vision_theme', 'related_tasks', 'related_decisions',
    'tags', 'resource', 'log_ref', 'generated', 'verified',
    'needsReview',
  ],
  arrays: ['related_tasks', 'related_decisions'],
  statusEnum: ['Deferred', 'In Progress', 'Completed', 'Blocked'],
};

export const DECISION_FIELDS = {
  docType: 'decisions',
  idPrefix: 'DEC',
  required: ['id', 'title', 'status', 'context', 'decision', 'rationale', 'consequences', 'last_updated'],
  optional: [
    'superseded_by', 'related_vision', 'related_roadmap_items', 'related_tasks',
    'related_decisions', 'tags', 'resource', 'log_ref', 'generated', 'verified',
    'needsReview',
  ],
  arrays: ['related_vision', 'related_roadmap_items', 'related_tasks', 'related_decisions'],
  statusEnum: ['accepted', 'deprecated', 'superseded'],
};

export const VISION_FIELDS = {
  docType: 'vision',
  idPrefix: null, // vision themes use slugs, not numbered IDs
  required: ['id', 'title', 'status'],
  optional: [
    'description', 'related_roadmap_items', 'related_decisions',
    'tags', 'resource', 'log_ref', 'generated', 'verified',
    'needsReview',
  ],
  arrays: ['related_roadmap_items', 'related_decisions'],
  statusEnum: ['draft', 'active', 'deprecated'],
};

const SCHEMAS = {
  tasks: TASK_FIELDS,
  roadmap: ROADMAP_FIELDS,
  decisions: DECISION_FIELDS,
  vision: VISION_FIELDS,
};

// ── Filename → doc type mapping ───────────────────────────────────────────

export const DOC_TYPE_MAP = {
  'TASKS.md': 'tasks',
  'ROADMAP.md': 'roadmap',
  'DECISIONS.md': 'decisions',
  'VISION.md': 'vision',
};

export const ALL_DOC_FILES = Object.keys(DOC_TYPE_MAP);

export function getDocType(filename) {
  // Normalize path separators and get basename
  const base = filename.replace(/\\/g, '/').split('/').pop();
  return DOC_TYPE_MAP[base] || null;
}

export function getSchema(docType) {
  return SCHEMAS[docType] || null;
}

// ── Validation ────────────────────────────────────────────────────────────

/**
 * Validate a single item's frontmatter data against its doc type's schema.
 * @param {string} docType
 * @param {object} data — parsed frontmatter
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateItem(docType, data) {
  const schema = SCHEMAS[docType];
  if (!schema) return { errors: [`Unknown doc type: ${docType}`], warnings: [] };

  const errors = [];
  const warnings = [];

  // Required fields
  for (const field of schema.required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Status enum
  if (data.status && !schema.statusEnum.includes(data.status)) {
    errors.push(`Invalid status "${data.status}"; must be one of: ${schema.statusEnum.join(', ')}`);
  }

  // ID prefix (skip for vision — uses slugs)
  if (schema.idPrefix && data.id) {
    const expected = schema.idPrefix + '-';
    if (typeof data.id === 'string' && !data.id.startsWith(expected)) {
      warnings.push(`ID "${data.id}" doesn't match expected prefix "${expected}"`);
    }
  }

  // Array fields must be arrays (or null/empty)
  for (const field of schema.arrays) {
    const val = data[field];
    if (val !== undefined && val !== null && val !== '' && !Array.isArray(val)) {
      errors.push(`Field "${field}" must be an array, got ${typeof val}`);
    }
  }

  // Decision-specific: superseded_by ↔ status consistency
  if (docType === 'decisions') {
    if (data.status === 'superseded' && !data.superseded_by) {
      errors.push('status is "superseded" but superseded_by is missing');
    }
    if (data.status && data.status !== 'superseded' && data.superseded_by) {
      warnings.push('superseded_by is set but status is not "superseded"');
    }
  }

  return { errors, warnings };
}

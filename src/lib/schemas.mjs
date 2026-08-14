/**
 * The canonical, machine-readable VEF schema. Every validator and graph
 * operation imports this module; documentation and adapters may derive their
 * descriptions from it rather than maintaining competing field lists.
 */

const ref = (target, { cardinality = 'many', inverse = null, external = false } = {}) =>
  ({ kind: 'ref', target, cardinality, inverse, external });

export const SCHEMAS = {
  tasks: {
    idPrefix: 'TASK', required: ['id', 'title', 'status', 'priority', 'last_updated'],
    fields: {
      id: { kind: 'string' }, title: { kind: 'string' }, description: { kind: 'string' },
      status: { kind: 'enum', values: ['pending', 'in-progress', 'completed', 'cancelled'] },
      priority: { kind: 'enum', values: ['P0', 'P1', 'P2', 'P3'] }, assignee: { kind: 'string' },
      last_updated: { kind: 'date' }, roadmap_item: ref('roadmap', { cardinality: 'one', inverse: 'related_tasks' }),
      depends_on: ref('tasks'), related_bugs: ref('bugs', { external: true }),
      related_decisions: ref('decisions', { inverse: 'related_tasks' }), tags: { kind: 'array' },
      resource: { kind: 'url' }, log_ref: { kind: 'object' }, generated: { kind: 'provenance' }, modified: { kind: 'provenance' },
      verified: { kind: 'provenanceArray' }, needsReview: { kind: 'boolean' },
    },
  },
  roadmap: {
    idPrefix: null, required: ['id', 'title', 'status', 'priority', 'last_updated'],
    fields: {
      id: { kind: 'string' }, title: { kind: 'string' }, description: { kind: 'string' }, phase: { kind: 'string' }, quarter: { kind: 'string' },
      status: { kind: 'enum', values: ['Deferred', 'In Progress', 'Completed', 'Blocked'] }, priority: { kind: 'enum', values: ['P0', 'P1', 'P2', 'P3'] },
      last_updated: { kind: 'date' }, vision_theme: ref('vision', { cardinality: 'one', inverse: 'related_roadmap_items' }),
      related_tasks: ref('tasks', { inverse: 'roadmap_item' }), related_decisions: ref('decisions', { inverse: 'related_roadmap_items' }),
      tags: { kind: 'array' }, resource: { kind: 'url' }, log_ref: { kind: 'object' }, generated: { kind: 'provenance' }, modified: { kind: 'provenance' }, verified: { kind: 'provenanceArray' }, needsReview: { kind: 'boolean' },
    },
  },
  decisions: {
    idPrefix: 'DEC', required: ['id', 'title', 'status', 'context', 'decision', 'rationale', 'consequences', 'last_updated'],
    fields: {
      id: { kind: 'string' }, title: { kind: 'string' }, status: { kind: 'enum', values: ['accepted', 'deprecated', 'superseded'] },
      context: { kind: 'string' }, decision: { kind: 'string' }, rationale: { kind: 'string' }, consequences: { kind: 'string' }, last_updated: { kind: 'date' },
      superseded_by: ref('decisions', { cardinality: 'one' }), related_vision: ref('vision', { inverse: 'related_decisions' }),
      related_roadmap_items: ref('roadmap', { inverse: 'related_decisions' }), related_tasks: ref('tasks', { inverse: 'related_decisions' }), related_decisions: ref('decisions'),
      tags: { kind: 'array' }, resource: { kind: 'url' }, log_ref: { kind: 'object' }, generated: { kind: 'provenance' }, modified: { kind: 'provenance' }, verified: { kind: 'provenanceArray' }, needsReview: { kind: 'boolean' },
    },
  },
  vision: {
    idPrefix: null, required: ['id', 'title', 'status'],
    fields: {
      id: { kind: 'string' }, title: { kind: 'string' }, status: { kind: 'enum', values: ['draft', 'active', 'deprecated'] }, description: { kind: 'string' },
      related_roadmap_items: ref('roadmap', { inverse: 'vision_theme' }), related_decisions: ref('decisions', { inverse: 'related_vision' }),
      tags: { kind: 'array' }, resource: { kind: 'url' }, log_ref: { kind: 'object' }, generated: { kind: 'provenance' }, modified: { kind: 'provenance' }, verified: { kind: 'provenanceArray' }, needsReview: { kind: 'boolean' },
    },
  },
};

export const DOC_TYPE_MAP = { 'TASKS.md': 'tasks', 'ROADMAP.md': 'roadmap', 'DECISIONS.md': 'decisions', 'VISION.md': 'vision' };
export const ALL_DOC_FILES = Object.keys(DOC_TYPE_MAP);
export const getDocType = (filename) => DOC_TYPE_MAP[filename.replace(/\\/g, '/').split('/').pop()] || null;
export const getSchema = (docType) => SCHEMAS[docType] || null;
export const relationshipFields = (docType) => Object.entries(SCHEMAS[docType]?.fields || {}).filter(([, def]) => def.kind === 'ref');

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

function validateRef(field, definition, value, errors) {
  const values = definition.cardinality === 'one' ? [value] : value;
  if (definition.cardinality === 'one' && Array.isArray(value)) errors.push(`Field "${field}" must be a singular reference object`);
  if (definition.cardinality !== 'one' && !Array.isArray(value)) errors.push(`Field "${field}" must be an array of reference objects`);
  for (const entry of Array.isArray(values) ? values : []) {
    if (!isObject(entry)) { errors.push(`Field "${field}" contains a non-object reference`); continue; }
    for (const key of ['id', 'name', 'url']) if (typeof entry[key] !== 'string' || entry[key].trim() === '') errors.push(`Field "${field}" reference is missing string ${key}`);
    if (typeof entry.url === 'string' && !URL.test(entry.url)) errors.push(`Field "${field}" reference has invalid url "${entry.url}"`);
  }
}

export function validateItem(docType, data, item = null) {
  const schema = getSchema(docType);
  if (!schema) return { errors: [`Unknown doc type: ${docType}`], warnings: [] };
  const errors = []; const warnings = [];
  for (const field of schema.required) if (data[field] === undefined || data[field] === null || data[field] === '') errors.push(`Missing required field: ${field}`);
  for (const [field, definition] of Object.entries(schema.fields)) {
    const value = data[field]; if (value === undefined || value === null || value === '') continue;
    if (definition.kind === 'string' && typeof value !== 'string') errors.push(`Field "${field}" must be a string`);
    if (definition.kind === 'array' && !Array.isArray(value)) errors.push(`Field "${field}" must be an array`);
    if (definition.kind === 'boolean' && typeof value !== 'boolean') errors.push(`Field "${field}" must be a boolean`);
    if (definition.kind === 'object' && !isObject(value)) errors.push(`Field "${field}" must be an object`);
    if (definition.kind === 'enum' && !definition.values.includes(value)) errors.push(`Invalid ${field} "${value}"; must be one of: ${definition.values.join(', ')}`);
    if (definition.kind === 'date') {
      const date = value instanceof Date ? value.toISOString().slice(0, 10) : value;
      if (typeof date !== 'string' || !DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) errors.push(`Field "${field}" must be an ISO date (YYYY-MM-DD)`);
    }
    if (definition.kind === 'url' && (typeof value !== 'string' || !URL.test(value))) errors.push(`Field "${field}" must be a relative or HTTP(S) URL`);
    if (definition.kind === 'ref') validateRef(field, definition, value, errors);
    if (definition.kind === 'provenance' && (!isObject(value) || typeof value.by !== 'string' || typeof value.at !== 'string')) errors.push(`Field "${field}" must contain string by and at values`);
    if (definition.kind === 'provenanceArray' && (!Array.isArray(value) || value.some((entry) => !isObject(entry) || typeof entry.by !== 'string' || typeof entry.at !== 'string'))) errors.push(`Field "${field}" must be an array of { by, at } objects`);
  }
  if (schema.idPrefix && typeof data.id === 'string' && !data.id.startsWith(`${schema.idPrefix}-`)) errors.push(`ID "${data.id}" must start with "${schema.idPrefix}-"`);
  if (docType === 'decisions' && data.status === 'superseded' && !data.superseded_by) errors.push('status is "superseded" but superseded_by is missing');
  if (docType === 'decisions' && data.status !== 'superseded' && data.superseded_by) warnings.push('superseded_by is set but status is not "superseded"');
  if (item?.id && data.id && item.id !== data.id) errors.push(`Heading ID "${item.id}" does not match frontmatter id "${data.id}"`);
  if (item?.id && data.title && item.title !== data.title) errors.push(`Heading title "${item.title}" does not match frontmatter title "${data.title}"`);
  return { errors, warnings };
}

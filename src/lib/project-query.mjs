import { relationshipFields } from './schemas.mjs';
import { loadCanonicalDocuments } from './record-store.mjs';

export const QUERY_SCHEMA_VERSION = 1;
export const PROJECT_TYPES = ['vision', 'roadmap', 'tasks', 'decisions'];

const TYPE_ORDER = new Map([...PROJECT_TYPES, 'bugs'].map((type, index) => [type, index]));
const TYPE_ALIASES = new Map([
  ['vision', 'vision'], ['visions', 'vision'], ['theme', 'vision'], ['themes', 'vision'],
  ['roadmap', 'roadmap'], ['roadmaps', 'roadmap'], ['roadmap-item', 'roadmap'], ['roadmap-items', 'roadmap'],
  ['task', 'tasks'], ['tasks', 'tasks'],
  ['decision', 'decisions'], ['decisions', 'decisions'], ['dec', 'decisions'],
]);

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const keyFor = (type, id) => `${type}:${id}`;

function normalizeValue(value) {
  if (value instanceof Date) {
    const iso = value.toISOString();
    return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso;
  }
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]));
  }
  return value;
}

export class ProjectQueryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProjectQueryError';
  }
}

export function normalizeProjectType(value) {
  if (value === undefined || value === null || value === '') return null;
  return TYPE_ALIASES.get(String(value).trim().toLowerCase()) || null;
}

export function compareRecords(left, right) {
  const typeDifference = (TYPE_ORDER.get(left.type) ?? 99) - (TYPE_ORDER.get(right.type) ?? 99);
  return typeDifference || compareText(left.id, right.id) || compareText(left.file, right.file);
}

export function recordSummary(record) {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    status: record.frontmatter.status ?? null,
    priority: record.frontmatter.priority ?? null,
    description: record.frontmatter.description ?? null,
    file: record.file,
  };
}

export function publicRecord(record) {
  return {
    ...recordSummary(record),
    frontmatter: record.frontmatter,
    body: record.body,
  };
}

function relationValues(record, field, cardinality) {
  const value = record.frontmatter[field];
  if (value === undefined || value === null) return [];
  if (cardinality === 'one') return [value];
  return Array.isArray(value) ? value : [];
}

function compareEdges(left, right) {
  return compareRecords(left.sourceRecord, right.sourceRecord)
    || compareText(left.field, right.field)
    || compareText(left.target.type, right.target.type)
    || compareText(left.target.id, right.target.id)
    || compareText(left.target.url || '', right.target.url || '');
}

function publicEdge(edge) {
  return {
    source: { id: edge.source.id, type: edge.source.type, title: edge.source.title },
    field: edge.field,
    target: edge.target,
    external: edge.external,
    missing: edge.missing,
  };
}

/** Load canonical project records and derive typed graph edges from SCHEMAS. */
export async function loadProject(projectDir = '.') {
  const records = [];
  const loaded = await loadCanonicalDocuments(projectDir);
  if (loaded.storageIssues.length > 0) throw new ProjectQueryError(`Canonical storage is invalid: ${loaded.storageIssues.join('; ')}`);
  const parsedDocs = loaded.parsedDocs;

  for (const { docType, filename, items } of parsedDocs) {
    for (const item of items) {
      const frontmatter = normalizeValue(item.data || {});
      const id = String(frontmatter.id || item.id || '').trim();
      if (!id) continue;
      records.push({
        id,
        type: docType,
        file: item.sourceFile || filename,
        title: String(frontmatter.title || item.title || id),
        frontmatter,
        body: item.body || '',
      });
    }
  }

  records.sort(compareRecords);
  const byKey = new Map();
  const byId = new Map();
  for (const record of records) {
    const key = keyFor(record.type, record.id);
    const keyed = byKey.get(key) || [];
    keyed.push(record);
    byKey.set(key, keyed);
    const identified = byId.get(record.id) || [];
    identified.push(record);
    byId.set(record.id, identified);
  }

  const edges = [];
  for (const sourceRecord of records) {
    for (const [field, relation] of relationshipFields(sourceRecord.type)) {
      for (const reference of relationValues(sourceRecord, field, relation.cardinality)) {
        if (!reference || typeof reference.id !== 'string') continue;
        const matches = byKey.get(keyFor(relation.target, reference.id)) || [];
        const targetRecord = matches.length === 1 ? matches[0] : null;
        edges.push({
          sourceRecord,
          source: recordSummary(sourceRecord),
          field,
          targetRecord,
          target: {
            id: reference.id,
            type: relation.target,
            title: targetRecord?.title || reference.name || reference.id,
            url: reference.url || null,
          },
          external: relation.external === true,
          missing: relation.external !== true && matches.length !== 1,
        });
      }
    }
  }
  edges.sort(compareEdges);

  return { projectDir, parsedDocs, records, byKey, byId, edges, storage: loaded.storage, projectionIssues: loaded.projectionIssues };
}

export function resolveRecord(project, selector) {
  const raw = String(selector || '').trim();
  if (!raw) throw new ProjectQueryError('An item ID is required.');

  const colon = raw.indexOf(':');
  if (colon > 0) {
    const type = normalizeProjectType(raw.slice(0, colon));
    if (type) {
      const id = raw.slice(colon + 1);
      const matches = project.byKey.get(keyFor(type, id)) || [];
      if (matches.length === 0) throw new ProjectQueryError(`No ${type} item found with ID "${id}".`);
      if (matches.length > 1) throw new ProjectQueryError(`ID "${id}" is duplicated in ${type}; run vef validate --strict.`);
      return matches[0];
    }
  }

  const matches = project.byId.get(raw) || [];
  if (matches.length === 0) throw new ProjectQueryError(`No project item found with ID "${raw}".`);
  if (matches.length > 1) {
    const types = [...new Set(matches.map((record) => record.type))].sort(compareText);
    if (types.length === 1) throw new ProjectQueryError(`ID "${raw}" is duplicated in ${types[0]}; run vef validate --strict.`);
    throw new ProjectQueryError(`ID "${raw}" is ambiguous (${types.join(', ')}); use <type>:${raw}.`);
  }
  return matches[0];
}

export function filterRecords(records, filters = {}) {
  const type = filters.type ? normalizeProjectType(filters.type) : null;
  if (filters.type && !type) {
    throw new ProjectQueryError(`Unknown type "${filters.type}". Use vision, roadmap, tasks, or decisions.`);
  }
  const status = filters.status ? String(filters.status).toLowerCase() : null;
  const priority = filters.priority ? String(filters.priority).toLowerCase() : null;
  return records.filter((record) => {
    if (type && record.type !== type) return false;
    if (status && String(record.frontmatter.status || '').toLowerCase() !== status) return false;
    if (priority && String(record.frontmatter.priority || '').toLowerCase() !== priority) return false;
    return true;
  });
}

export function referencesFor(project, record, direction = 'both') {
  const normalizedDirection = String(direction).toLowerCase();
  if (!['in', 'out', 'both'].includes(normalizedDirection)) {
    throw new ProjectQueryError(`Unknown direction "${direction}". Use in, out, or both.`);
  }
  const outgoing = normalizedDirection === 'in' ? [] : project.edges
    .filter((edge) => edge.sourceRecord === record)
    .map(publicEdge);
  const incoming = normalizedDirection === 'out' ? [] : project.edges
    .filter((edge) => edge.targetRecord === record)
    .map(publicEdge);
  return { direction: normalizedDirection, outgoing, incoming };
}

const WHY_FIELDS = {
  tasks: new Set(['roadmap_item', 'related_decisions']),
  roadmap: new Set(['vision_theme', 'related_decisions']),
  vision: new Set(['related_decisions']),
  decisions: new Set(['superseded_by', 'related_decisions']),
};

export function explainWhy(project, root) {
  const nodes = new Map([[keyFor(root.type, root.id), recordSummary(root)]]);
  const selectedEdges = new Map();
  const paths = [];
  const visited = new Set([keyFor(root.type, root.id)]);
  const queue = [{ record: root, path: [] }];

  while (queue.length > 0) {
    const current = queue.shift();
    const allowedFields = WHY_FIELDS[current.record.type] || new Set();
    const outgoing = project.edges.filter((edge) => edge.sourceRecord === current.record && allowedFields.has(edge.field));
    for (const edge of outgoing) {
      const edgeId = `${edge.source.type}:${edge.source.id}:${edge.field}:${edge.target.type}:${edge.target.id}`;
      selectedEdges.set(edgeId, publicEdge(edge));
      const nextPath = [...current.path, publicEdge(edge)];
      paths.push(nextPath);
      const targetKey = keyFor(edge.target.type, edge.target.id);
      nodes.set(targetKey, edge.targetRecord ? recordSummary(edge.targetRecord) : {
        id: edge.target.id,
        type: edge.target.type,
        title: edge.target.title,
        status: null,
        priority: null,
        description: null,
        file: null,
        missing: edge.missing,
        external: edge.external,
      });
      if (edge.targetRecord && !visited.has(targetKey)) {
        visited.add(targetKey);
        queue.push({ record: edge.targetRecord, path: nextPath });
      }
    }
  }

  const sortedNodes = [...nodes.values()].sort((left, right) => {
    const leftRecord = { ...left, file: left.file || '' };
    const rightRecord = { ...right, file: right.file || '' };
    return compareRecords(leftRecord, rightRecord);
  });
  return { nodes: sortedNodes, edges: [...selectedEdges.values()], paths };
}

function collectSearchText(value, output) {
  if (value === undefined || value === null) return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    output.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectSearchText(entry, output);
    return;
  }
  if (typeof value === 'object') {
    for (const entry of Object.values(value)) collectSearchText(entry, output);
  }
}

export function searchRecords(records, query, filters = {}) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) throw new ProjectQueryError('A non-empty search query is required.');
  return filterRecords(records, filters).filter((record) => {
    const haystack = [record.id, record.title, record.body];
    collectSearchText(record.frontmatter, haystack);
    return haystack.join('\n').toLowerCase().includes(needle);
  });
}

export function projectGraph(project) {
  const nodes = project.records.map((record) => ({
    ...recordSummary(record),
    external: false,
    missing: false,
    url: null,
  }));
  const known = new Set(nodes.map((node) => keyFor(node.type, node.id)));
  for (const edge of project.edges) {
    const targetKey = keyFor(edge.target.type, edge.target.id);
    if (known.has(targetKey)) continue;
    known.add(targetKey);
    nodes.push({
      id: edge.target.id,
      type: edge.target.type,
      title: edge.target.title,
      status: null,
      priority: null,
      description: null,
      file: null,
      external: edge.external,
      missing: edge.missing,
      url: edge.target.url,
    });
  }
  nodes.sort((left, right) => {
    const leftRecord = { ...left, file: left.file || '' };
    const rightRecord = { ...right, file: right.file || '' };
    return compareRecords(leftRecord, rightRecord);
  });
  return { nodes, edges: project.edges.map(publicEdge) };
}

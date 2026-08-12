import { relationshipFields } from './schemas.mjs';

function indexDocs(parsedDocs) {
  const byType = {}; const duplicates = [];
  for (const { docType, items } of parsedDocs) {
    byType[docType] ??= new Map();
    for (const item of items) {
      const id = String(item.data?.id || item.id || ''); if (!id) continue;
      if (byType[docType].has(id)) duplicates.push({ docType, id }); else byType[docType].set(id, item);
    }
  }
  return { byType, duplicates };
}

const refsFor = (item, field, cardinality) => {
  const value = item.data?.[field]; if (!value) return [];
  return cardinality === 'one' ? [value] : (Array.isArray(value) ? value : []);
};

export function findOrphans(parsedDocs) {
  const { byType } = indexDocs(parsedDocs); const issues = [];
  for (const { docType, filename, items } of parsedDocs) for (const item of items) for (const [field, rel] of relationshipFields(docType)) {
    if (rel.external) continue;
    for (const entry of refsFor(item, field, rel.cardinality)) if (entry?.id && !byType[rel.target]?.has(String(entry.id))) issues.push({ fromDoc: filename, fromItem: String(item.data?.id || item.id), refId: String(entry.id), field, expectedType: rel.target });
  }
  return issues;
}

export function findDuplicateIds(parsedDocs) { return indexDocs(parsedDocs).duplicates; }

export function checkBidirectional(parsedDocs) {
  const { byType } = indexDocs(parsedDocs); const issues = [];
  for (const { docType, items } of parsedDocs) for (const item of items) {
    const sourceId = String(item.data?.id || item.id || '');
    for (const [field, rel] of relationshipFields(docType)) {
      if (!rel.inverse || rel.external) continue;
      for (const entry of refsFor(item, field, rel.cardinality)) {
        const target = byType[rel.target]?.get(String(entry?.id)); if (!target) continue;
        const inverseDef = relationshipFields(rel.target).find(([name]) => name === rel.inverse)?.[1];
        if (!inverseDef || !refsFor(target, rel.inverse, inverseDef.cardinality).some((ref) => String(ref?.id) === sourceId)) issues.push({ type: 'bidirectional', message: `${docType}:${sourceId}.${field} → ${rel.target}:${entry.id}, but ${rel.target}:${entry.id}.${rel.inverse} does not include ${sourceId}` });
      }
    }
  }
  return issues;
}

export function findDependencyCycles(parsedDocs) {
  const tasks = indexDocs(parsedDocs).byType.tasks || new Map(); const seen = new Set(); const visiting = new Set(); const cycles = [];
  function visit(id, path) {
    if (visiting.has(id)) { cycles.push([...path, id]); return; }
    if (seen.has(id)) return; visiting.add(id);
    const task = tasks.get(id); for (const ref of refsFor(task || {}, 'depends_on', 'many')) if (ref?.id && tasks.has(String(ref.id))) visit(String(ref.id), [...path, id]);
    visiting.delete(id); seen.add(id);
  }
  for (const id of tasks.keys()) visit(id, []); return cycles;
}

/**
 * crosslinks.mjs — extract, validate, and traverse the id+name+url cross-link graph.
 *
 * Cross-link topology:
 *
 *   LOG.md → DECISIONS.md          (via log_ref — one-way)
 *   DECISIONS.md ↔ TASKS.md        (via related_decisions / related_tasks)
 *   DECISIONS.md ↔ ROADMAP.md      (via related_decisions / related_roadmap_items)
 *   DECISIONS.md ↔ VISION.md       (via related_vision / related_decisions)
 *   TASKS.md → ROADMAP.md          (via roadmap_item)
 *   TASKS.md → BUGS                (via related_bugs — external GitHub Issues)
 *   ROADMAP.md → VISION.md         (via vision_theme)
 */

// Fields that contain cross-references as { id, name, url } objects
const SINGULAR_REF_FIELDS = ['roadmap_item', 'vision_theme', 'superseded_by'];
const ARRAY_REF_FIELDS = [
  'depends_on', 'related_tasks', 'related_roadmap_items',
  'related_decisions', 'related_vision',
];
// External refs (GitHub Issues) — not checked for orphans (they live outside the repo)
const EXTERNAL_REF_FIELDS = ['related_bugs'];

const ALL_REF_FIELDS = [...SINGULAR_REF_FIELDS, ...ARRAY_REF_FIELDS, ...EXTERNAL_REF_FIELDS];

/**
 * Extract all cross-references from a single item's frontmatter data.
 * @param {object} data
 * @returns {Array<{ refId: string, refUrl: string|undefined, field: string, external: boolean }>}
 */
export function extractRefs(data) {
  const refs = [];
  for (const field of ALL_REF_FIELDS) {
    const val = data[field];
    if (!val) continue;

    const external = EXTERNAL_REF_FIELDS.includes(field);

    if (Array.isArray(val)) {
      for (const entry of val) {
        if (entry && entry.id !== undefined && entry.id !== null) {
          refs.push({ refId: String(entry.id), refUrl: entry.url, field, external });
        }
      }
    } else if (typeof val === 'object' && val.id !== undefined && val.id !== null) {
      refs.push({ refId: String(val.id), refUrl: val.url, field, external });
    }
  }
  return refs;
}

/**
 * Collect all item IDs across parsed docs.
 * @param {Array<{ docType: string, filename: string, items: Array }>} parsedDocs
 * @returns {{ allIds: Set<string>, idsByType: Record<string, Set<string>> }}
 */
export function extractAllIds(parsedDocs) {
  const allIds = new Set();
  const idsByType = {};

  for (const { docType, items } of parsedDocs) {
    if (!idsByType[docType]) idsByType[docType] = new Set();
    for (const item of items) {
      const id = item.data?.id || item.id;
      if (id) {
        allIds.add(String(id));
        idsByType[docType].add(String(id));
      }
    }
  }

  return { allIds, idsByType };
}

/**
 * Find references that point to IDs that don't exist in any doc.
 * Skips external refs (GitHub Issues).
 * @param {Array<{ docType: string, filename: string, items: Array }>} parsedDocs
 * @returns {Array<{ fromDoc: string, fromItem: string, refId: string, field: string }>}
 */
export function findOrphans(parsedDocs) {
  const { allIds } = extractAllIds(parsedDocs);
  const orphans = [];

  for (const { filename, items } of parsedDocs) {
    for (const item of items) {
      const itemId = item.data?.id || item.id || item.heading;
      const refs = extractRefs(item.data || {});
      for (const ref of refs) {
        if (ref.external) continue;
        if (!allIds.has(ref.refId)) {
          orphans.push({ fromDoc: filename, fromItem: String(itemId), refId: ref.refId, field: ref.field });
        }
      }
    }
  }

  return orphans;
}

// ── Bidirectionality checks ───────────────────────────────────────────────

/**
 * Build an index: docType → Map<id, item> for quick lookups.
 */
function buildIndex(parsedDocs) {
  const byType = {};
  for (const { docType, items } of parsedDocs) {
    if (!byType[docType]) byType[docType] = new Map();
    for (const item of items) {
      const id = item.data?.id || item.id;
      if (id) byType[docType].set(String(id), item);
    }
  }
  return byType;
}

/**
 * Helper: does an array-of-refs field contain a given ID?
 */
function hasBackRef(item, field, targetId) {
  const arr = item.data?.[field];
  if (!Array.isArray(arr)) return false;
  return arr.some((r) => r && String(r.id) === String(targetId));
}

/**
 * Check that bidirectional links are consistent.
 * Currently checks: TASK→ROADMAP (roadmap_item ↔ related_tasks).
 * Can be extended for decision↔task, roadmap↔vision, etc.
 *
 * @param {Array<{ docType: string, filename: string, items: Array }>} parsedDocs
 * @returns {Array<{ type: string, message: string }>}
 */
export function checkBidirectional(parsedDocs) {
  const issues = [];
  const index = buildIndex(parsedDocs);

  const tasks = index.tasks;
  const roadmap = index.roadmap;

  // TASK.roadmap_item → ROADMAP.related_tasks includes TASK id
  if (tasks && roadmap) {
    for (const [taskId, task] of tasks) {
      const ri = task.data?.roadmap_item;
      if (ri?.id) {
        const roadmapItem = roadmap.get(String(ri.id));
        if (roadmapItem && !hasBackRef(roadmapItem, 'related_tasks', taskId)) {
          issues.push({
            type: 'bidirectional',
            message: `Task ${taskId}.roadmap_item → ROADMAP ${ri.id}, but ${ri.id}.related_tasks doesn't include ${taskId}`,
          });
        }
      }
    }
  }

  return issues;
}

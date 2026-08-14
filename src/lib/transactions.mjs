import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, open, readFile, readdir, rm, stat } from 'node:fs/promises';
import { hostname } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { checkBidirectional, findDependencyCycles, findDuplicateIds, findOrphans } from './crosslinks.mjs';
import { auditMemoryCatalogDirectory } from './memory-catalog.mjs';
import {
  itemFilename,
  loadCanonicalDocuments,
  RECORD_LAYOUTS,
  renderItemFile,
  renderLedger,
} from './record-store.mjs';
import { getSchema, relationshipFields, validateItem } from './schemas.mjs';

export const TRANSACTION_SCHEMA_VERSION = 1;
export const TRANSACTION_DIRECTORY = '.vef/transactions';

const TYPE_ALIASES = new Map([
  ['vision', 'vision'], ['visions', 'vision'], ['theme', 'vision'], ['themes', 'vision'],
  ['roadmap', 'roadmap'], ['roadmaps', 'roadmap'], ['roadmap-item', 'roadmap'], ['roadmap-items', 'roadmap'],
  ['task', 'tasks'], ['tasks', 'tasks'],
  ['decision', 'decisions'], ['decisions', 'decisions'], ['dec', 'decisions'],
]);

const keyFor = (type, id) => `${type}:${id}`;
const hash = (value) => value === null ? null : createHash('sha256').update(String(value)).digest('hex');
const own = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);
const relationMap = (type) => new Map(relationshipFields(type));

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
const retryableFileError = (error) => ['EACCES', 'EBUSY', 'EPERM', 'ENOTEMPTY'].includes(error?.code);
const locallyReleasedLeases = new Set();

async function durableWrite(path, content, { retries = 6 } = {}) {
  await mkdir(dirname(path), { recursive: true });
  for (let attempt = 0; ; attempt += 1) {
    let handle;
    try {
      handle = await open(path, 'w');
      await handle.writeFile(content, 'utf8');
      await handle.sync();
      return;
    } catch (error) {
      if (attempt >= retries || !retryableFileError(error)) throw error;
      await delay(25 * (attempt + 1));
    } finally {
      await handle?.close();
    }
  }
}

async function removeWithRetry(path, options = {}, retries = 6) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await rm(path, options);
      return;
    } catch (error) {
      if (attempt >= retries || !retryableFileError(error)) throw error;
      await delay(25 * (attempt + 1));
    }
  }
}

async function writeTransactionTarget(path, content, options = {}) {
  if (!options.targetWriteAttempt) return durableWrite(path, content);
  for (let attempt = 0; ; attempt += 1) {
    try {
      await options.targetWriteAttempt({ path, content, attempt, write: () => durableWrite(path, content, { retries: 0 }) });
      return;
    } catch (error) {
      if (attempt >= 6 || !retryableFileError(error)) throw error;
      await delay(25 * (attempt + 1));
    }
  }
}

function normalizeType(value) {
  const normalized = TYPE_ALIASES.get(String(value || '').trim().toLowerCase());
  if (!normalized) throw new TransactionError(`Unknown record type "${value}".`);
  return normalized;
}

function layoutFor(type) {
  const layout = RECORD_LAYOUTS.find((candidate) => candidate.docType === type);
  if (!layout) throw new TransactionError(`No canonical storage layout exists for ${type}.`);
  return layout;
}

function pathInside(root, relativeFile) {
  const resolvedRoot = resolve(root);
  const target = resolve(root, ...String(relativeFile).replace(/\\/g, '/').split('/'));
  if (target !== resolvedRoot && !target.startsWith(`${resolvedRoot}${sep}`)) {
    throw new TransactionError(`Refusing transaction path outside the project: ${relativeFile}`);
  }
  return target;
}

function cloneLoaded(loaded) {
  const parsedDocs = loaded.parsedDocs.map((document) => ({
    ...document,
    items: document.items.map((item) => structuredClone(item)),
  }));
  const docsByType = new Map(parsedDocs.map((document) => [document.docType, document]));
  const byKey = new Map();
  for (const document of parsedDocs) {
    for (const item of document.items) {
      const id = String(item.data?.id || item.id || '').trim();
      if (id) byKey.set(keyFor(document.docType, id), item);
    }
  }
  return { parsedDocs, docsByType, byKey };
}

function graphIssues(parsedDocs) {
  const issues = [];
  for (const { docType, items } of parsedDocs) {
    for (const item of items) {
      const id = String(item.data?.id || item.id || item.heading || '').trim();
      if (!item.hasFrontmatter) issues.push(`${docType}:${id} has no valid frontmatter`);
      const validation = validateItem(docType, item.data || {}, item);
      for (const error of validation.errors) issues.push(`${docType}:${id}: ${error}`);
      for (const warning of validation.warnings) issues.push(`${docType}:${id}: ${warning}`);
    }
  }
  for (const orphan of findOrphans(parsedDocs)) {
    issues.push(`${orphan.fromItem}.${orphan.field} references missing ${orphan.expectedType}:${orphan.refId}`);
  }
  for (const duplicate of findDuplicateIds(parsedDocs)) issues.push(`Duplicate ${duplicate.docType} id ${duplicate.id}`);
  for (const cycle of findDependencyCycles(parsedDocs)) issues.push(`Task dependency cycle: ${cycle.join(' -> ')}`);
  for (const issue of checkBidirectional(parsedDocs)) issues.push(issue.message);
  return issues;
}

function authorityRepairs(model, operations) {
  const repairs = new Set();
  for (const operation of operations) {
    if (operation?.kind !== 'update' || !operation.authority) continue;
    if (!['frontmatter', 'heading'].includes(operation.authority)) {
      throw new TransactionError(`Unknown title authority "${operation.authority}"; use frontmatter or heading.`);
    }
    const { type, item } = resolveOperationRecord(model, operation);
    repairs.add(keyFor(type, item.data.id));
  }
  return repairs;
}

function isRepairableTitleIssue(issue, repairs) {
  if (!issue.includes(': Heading title "')) return false;
  for (const key of repairs) if (issue.startsWith(`${key}: `)) return true;
  return false;
}

function refsFor(item, field, definition) {
  const value = item.data?.[field];
  if (value === undefined || value === null || value === '') return [];
  return definition.cardinality === 'one' ? [value] : (Array.isArray(value) ? value : []);
}

function canonicalRef(type, item) {
  const id = String(item.data.id);
  const layout = layoutFor(type);
  return { id, name: String(item.data.title), url: `/${layout.ledger}#${id}` };
}

function setRefs(item, field, definition, references, changed, type, effect) {
  const value = definition.cardinality === 'one' ? references[0] : references;
  const before = item.data[field];
  if (definition.cardinality === 'one' && value === undefined) {
    if (own(item.data, field)) {
      delete item.data[field];
      changed.add(keyFor(type, item.data.id));
      if (effect) effect();
    }
    return;
  }
  if (!isDeepStrictEqual(before, value)) {
    item.data[field] = value;
    changed.add(keyFor(type, item.data.id));
    if (effect) effect();
  }
}

function targetInputId(input) {
  if (typeof input === 'string' || typeof input === 'number') return String(input);
  return String(input?.id || '').trim();
}

function normalizeDesiredReference(model, definition, input) {
  if (definition.external) {
    if (!input || typeof input !== 'object') {
      throw new TransactionError('External relationships require an { id, name, url } reference object.');
    }
    return structuredClone(input);
  }
  const id = targetInputId(input);
  if (!id) throw new TransactionError(`Relationship to ${definition.target} requires a target id.`);
  const target = model.byKey.get(keyFor(definition.target, id));
  if (!target) throw new TransactionError(`No ${definition.target} record found with id "${id}".`);
  return canonicalRef(definition.target, target);
}

function detach(model, sourceType, source, field, targetId, changed, effects) {
  const definition = relationMap(sourceType).get(field);
  if (!definition) throw new TransactionError(`${sourceType}.${field} is not a relationship field.`);
  const current = refsFor(source, field, definition);
  if (!current.some((reference) => String(reference?.id) === String(targetId))) return;
  setRefs(
    source,
    field,
    definition,
    current.filter((reference) => String(reference?.id) !== String(targetId)),
    changed,
    sourceType,
    () => effects.push(`unlink ${sourceType}:${source.data.id}.${field} -> ${definition.target}:${targetId}`),
  );

  if (!definition.inverse || definition.external) return;
  const target = model.byKey.get(keyFor(definition.target, String(targetId)));
  if (!target) return;
  const inverse = relationMap(definition.target).get(definition.inverse);
  if (!inverse) throw new TransactionError(`Schema inverse ${definition.target}.${definition.inverse} is not declared.`);
  const inverseRefs = refsFor(target, definition.inverse, inverse);
  setRefs(
    target,
    definition.inverse,
    inverse,
    inverseRefs.filter((reference) => String(reference?.id) !== String(source.data.id)),
    changed,
    definition.target,
  );
}

function attach(model, sourceType, source, field, desiredReference, changed, effects) {
  const definition = relationMap(sourceType).get(field);
  const targetId = String(desiredReference.id);
  let current = refsFor(source, field, definition);

  if (definition.cardinality === 'one') {
    for (const reference of current.filter((entry) => String(entry?.id) !== targetId)) {
      detach(model, sourceType, source, field, reference.id, changed, effects);
    }
    current = refsFor(source, field, definition);
  }

  if (!definition.external && definition.inverse) {
    const target = model.byKey.get(keyFor(definition.target, targetId));
    const inverse = relationMap(definition.target).get(definition.inverse);
    if (!inverse) throw new TransactionError(`Schema inverse ${definition.target}.${definition.inverse} is not declared.`);
    if (inverse.cardinality === 'one') {
      for (const prior of refsFor(target, definition.inverse, inverse).filter((entry) => String(entry?.id) !== String(source.data.id))) {
        const priorSource = model.byKey.get(keyFor(sourceType, String(prior.id)));
        if (!priorSource) throw new TransactionError(`Cannot reassign missing inverse source ${sourceType}:${prior.id}.`);
        const priorField = inverse.inverse || field;
        detach(model, sourceType, priorSource, priorField, targetId, changed, effects);
      }
    }
  }

  current = refsFor(source, field, definition);
  const withoutTarget = current.filter((reference) => String(reference?.id) !== targetId);
  setRefs(
    source,
    field,
    definition,
    [...withoutTarget, desiredReference],
    changed,
    sourceType,
    () => effects.push(`link ${sourceType}:${source.data.id}.${field} -> ${definition.target}:${targetId}`),
  );

  if (!definition.inverse || definition.external) return;
  const target = model.byKey.get(keyFor(definition.target, targetId));
  const inverse = relationMap(definition.target).get(definition.inverse);
  const sourceReference = canonicalRef(sourceType, source);
  const inverseRefs = refsFor(target, definition.inverse, inverse).filter((reference) => String(reference?.id) !== String(source.data.id));
  setRefs(target, definition.inverse, inverse, [...inverseRefs, sourceReference], changed, definition.target);
}

function desiredFromSpec(current, definition, spec) {
  const isOperation = spec && typeof spec === 'object' && !Array.isArray(spec)
    && (own(spec, 'set') || own(spec, 'add') || own(spec, 'remove'));
  if (!isOperation) {
    if (definition.cardinality === 'one') return spec === null || spec === undefined ? [] : [spec];
    return Array.isArray(spec) ? spec : [spec];
  }
  if (own(spec, 'set') && (own(spec, 'add') || own(spec, 'remove'))) {
    throw new TransactionError('A relationship update cannot combine set with add/remove.');
  }
  if (own(spec, 'set')) {
    const value = spec.set;
    if (definition.cardinality === 'one') return value === null || value === undefined ? [] : [value];
    return Array.isArray(value) ? value : [value];
  }
  const remove = new Set((Array.isArray(spec.remove) ? spec.remove : spec.remove === undefined ? [] : [spec.remove]).map(targetInputId));
  const additions = Array.isArray(spec.add) ? spec.add : spec.add === undefined ? [] : [spec.add];
  const retained = current.filter((reference) => !remove.has(String(reference?.id)));
  const desired = [...retained, ...additions];
  if (definition.cardinality === 'one' && desired.length > 1) {
    throw new TransactionError('A singular relationship cannot contain more than one target.');
  }
  return desired;
}

function setRelationship(model, sourceType, source, field, spec, changed, effects) {
  const definition = relationMap(sourceType).get(field);
  if (!definition) throw new TransactionError(`${sourceType}.${field} is not a relationship field.`);
  const current = refsFor(source, field, definition);
  const inputs = desiredFromSpec(current, definition, spec);
  const desired = inputs.map((input) => normalizeDesiredReference(model, definition, input));
  const ids = desired.map((reference) => String(reference.id));
  if (new Set(ids).size !== ids.length) throw new TransactionError(`${sourceType}.${field} contains duplicate targets.`);

  const desiredIds = new Set(ids);
  for (const reference of current) {
    if (!desiredIds.has(String(reference?.id))) detach(model, sourceType, source, field, reference.id, changed, effects);
  }
  for (const reference of desired) attach(model, sourceType, source, field, reference, changed, effects);

  // Refresh order and canonical names/URLs after inverse closure.
  setRefs(source, field, definition, desired, changed, sourceType);
}

function propagateReferenceMetadata(model, changed, metadataChanged) {
  for (const document of model.parsedDocs) {
    for (const item of document.items) {
      for (const [field, definition] of relationshipFields(document.docType)) {
        if (definition.external || !own(item.data, field)) continue;
        const current = refsFor(item, field, definition);
        const refreshed = current.map((reference) => {
          const target = model.byKey.get(keyFor(definition.target, String(reference?.id)));
          return target && metadataChanged.has(keyFor(definition.target, String(reference?.id)))
            ? canonicalRef(definition.target, target)
            : reference;
        });
        setRefs(item, field, definition, refreshed, changed, document.docType);
      }
    }
  }
}

function allocateId(type, model) {
  if (type === 'roadmap') {
    const ids = [...model.byKey.keys()]
      .filter((key) => key.startsWith('roadmap:'))
      .map((key) => key.slice('roadmap:'.length));
    if (ids.length === 0) return 'ROADMAP-001';
    const families = new Map();
    for (const id of ids) {
      const match = id.match(/^(.+)-(\d+)$/);
      if (!match) {
        throw new TransactionError(`Roadmap IDs do not form one coherent numeric family because "${id}" is non-numeric. Provide an explicit roadmap id.`);
      }
      const [, prefix, number] = match;
      const values = families.get(prefix) || [];
      values.push(Number(number));
      families.set(prefix, values);
    }
    if (families.size !== 1) {
      throw new TransactionError(`Roadmap IDs use mixed numeric families (${[...families.keys()].sort().join(', ')}). Provide an explicit roadmap id.`);
    }
    const [[prefix, values]] = families;
    return `${prefix}-${String(Math.max(...values) + 1).padStart(3, '0')}`;
  }
  const prefix = getSchema(type)?.idPrefix;
  if (!prefix) return null;
  let maximum = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  for (const key of model.byKey.keys()) {
    if (!key.startsWith(`${type}:`)) continue;
    const match = key.slice(type.length + 1).match(pattern);
    if (match) maximum = Math.max(maximum, Number(match[1]));
  }
  return `${prefix}-${String(maximum + 1).padStart(3, '0')}`;
}

function resolveOperationRecord(model, operation) {
  if (operation.type) {
    const type = normalizeType(operation.type);
    const id = String(operation.id || '').trim();
    const item = model.byKey.get(keyFor(type, id));
    if (!item) throw new TransactionError(`No ${type} record found with id "${id}".`);
    return { type, item };
  }
  const raw = String(operation.id || '').trim();
  const colon = raw.indexOf(':');
  if (colon > 0) {
    const type = normalizeType(raw.slice(0, colon));
    const id = raw.slice(colon + 1);
    const item = model.byKey.get(keyFor(type, id));
    if (!item) throw new TransactionError(`No ${type} record found with id "${id}".`);
    return { type, item };
  }
  const matches = [];
  for (const [key, item] of model.byKey) if (key.endsWith(`:${raw}`)) matches.push({ type: key.slice(0, key.indexOf(':')), item });
  if (matches.length === 0) throw new TransactionError(`No record found with id "${raw}".`);
  if (matches.length > 1) throw new TransactionError(`Record id "${raw}" is ambiguous; use type:${raw}.`);
  return matches[0];
}

function applyCreate(model, operation, context) {
  const type = normalizeType(operation.type);
  const schema = getSchema(type);
  const record = operation.record || {};
  const data = structuredClone(record.data || operation.data || {});
  data.id = String(data.id || allocateId(type, model) || '').trim();
  if (!data.id) throw new TransactionError(`${type} creation requires an id.`);
  if (model.byKey.has(keyFor(type, data.id))) throw new TransactionError(`${type}:${data.id} already exists.`);
  for (const field of Object.keys(data)) {
    if (!schema.fields[field]) throw new TransactionError(`Unknown ${type} field "${field}".`);
  }
  const relationships = { ...(operation.relationships || {}) };
  for (const [field] of relationshipFields(type)) {
    if (own(data, field)) {
      relationships[field] = data[field];
      delete data[field];
    }
  }
  if (schema.fields.last_updated) data.last_updated = context.date;
  if (schema.fields.generated && !data.generated) data.generated = { by: context.actor, at: context.now };
  const title = String(data.title || '').trim();
  const layout = layoutFor(type);
  const item = {
    id: data.id,
    title,
    heading: `${data.id} — ${title}`,
    data,
    body: String(record.body ?? operation.body ?? '').trim(),
    hasFrontmatter: true,
    sourceFile: `${layout.directory}/${itemFilename(data.id)}`,
  };
  model.docsByType.get(type).items.push(item);
  model.byKey.set(keyFor(type, data.id), item);
  context.changed.add(keyFor(type, data.id));
  context.created.add(keyFor(type, data.id));
  context.metadataChanged.add(keyFor(type, data.id));
  context.effects.push(`create ${type}:${data.id}`);
  for (const [field, value] of Object.entries(relationships)) {
    setRelationship(model, type, item, field, { set: value }, context.changed, context.effects);
  }
}

function applyUpdate(model, operation, context) {
  const { type, item } = resolveOperationRecord(model, operation);
  const schema = getSchema(type);
  const relationships = relationMap(type);
  const set = operation.set || {};
  const unset = operation.unset || [];
  if (operation.authority) {
    if (!['frontmatter', 'heading'].includes(operation.authority)) {
      throw new TransactionError(`Unknown title authority "${operation.authority}"; use frontmatter or heading.`);
    }
    if (operation.authority === 'heading' && own(set, 'title')) {
      throw new TransactionError('Cannot set title while declaring heading as the title authority.');
    }
    const key = keyFor(type, item.data.id);
    if (operation.authority === 'heading' && item.data.title !== item.title) {
      const before = item.data.title;
      item.data.title = item.title;
      context.changed.add(key);
      context.metadataChanged.add(key);
      context.effects.push(`repair ${type}:${item.data.id} title from heading: ${JSON.stringify(before)} -> ${JSON.stringify(item.title)}`);
    } else if (operation.authority === 'frontmatter' && item.title !== item.data.title) {
      const before = item.title;
      item.title = String(item.data.title);
      item.heading = `${item.data.id} — ${item.data.title}`;
      context.changed.add(key);
      context.effects.push(`repair ${type}:${item.data.id} heading from frontmatter: ${JSON.stringify(before)} -> ${JSON.stringify(item.data.title)}`);
    }
  }
  for (const [field, value] of Object.entries(set)) {
    if (!schema.fields[field]) throw new TransactionError(`Unknown ${type} field "${field}".`);
    if (field === 'id' || field === 'last_updated' || field === 'generated' || field === 'modified') throw new TransactionError(`${type}.${field} is transaction-managed and cannot be set directly.`);
    if (relationships.has(field)) throw new TransactionError(`${type}.${field} must be changed through relationships.`);
    if (!isDeepStrictEqual(item.data[field], value)) {
      const before = item.data[field];
      item.data[field] = structuredClone(value);
      context.changed.add(keyFor(type, item.data.id));
      if (field === 'title') context.metadataChanged.add(keyFor(type, item.data.id));
      context.effects.push(`set ${type}:${item.data.id}.${field}: ${JSON.stringify(before)} -> ${JSON.stringify(value)}`);
    }
  }
  for (const field of Array.isArray(unset) ? unset : [unset]) {
    if (!field) continue;
    if (!schema.fields[field]) throw new TransactionError(`Unknown ${type} field "${field}".`);
    if (schema.required.includes(field) || ['id', 'last_updated', 'generated', 'modified'].includes(field)) {
      throw new TransactionError(`Required or transaction-managed field ${type}.${field} cannot be unset.`);
    }
    if (relationships.has(field)) throw new TransactionError(`${type}.${field} must be changed through relationships.`);
    if (own(item.data, field)) {
      delete item.data[field];
      context.changed.add(keyFor(type, item.data.id));
      context.effects.push(`unset ${type}:${item.data.id}.${field}`);
    }
  }
  if (own(operation, 'body') && String(operation.body ?? '').trim() !== String(item.body || '').trim()) {
    item.body = String(operation.body ?? '').trim();
    context.changed.add(keyFor(type, item.data.id));
    context.effects.push(`update ${type}:${item.data.id} body`);
  }
  for (const [field, spec] of Object.entries(operation.relationships || {})) {
    setRelationship(model, type, item, field, spec, context.changed, context.effects);
  }
  if (own(set, 'title')) {
    item.title = String(item.data.title);
    item.heading = `${item.data.id} — ${item.data.title}`;
  }
}

function touchChangedItems(model, context) {
  for (const key of context.changed) {
    const separator = key.indexOf(':');
    const type = key.slice(0, separator);
    const item = model.byKey.get(key);
    if (!item) continue;
    const schema = getSchema(type);
    if (schema.fields.last_updated) item.data.last_updated = context.date;
    if (schema.fields.modified) item.data.modified = { by: context.actor, at: context.now };
    item.id = String(item.data.id);
    item.title = String(item.data.title || item.data.id);
    item.heading = `${item.id} — ${item.title}`;
  }
}

async function buildChanges(projectDir, loaded, model, changedKeys) {
  const changes = [];
  const changedTypes = new Set();
  for (const key of changedKeys) {
    const separator = key.indexOf(':');
    const type = key.slice(0, separator);
    const item = model.byKey.get(key);
    const relativeFile = item.sourceFile || `${layoutFor(type).directory}/${itemFilename(item.data.id)}`;
    const target = pathInside(projectDir, relativeFile);
    const before = await readOptional(target);
    const after = renderItemFile(item);
    if (before !== after) {
      changes.push({ path: relativeFile.replace(/\\/g, '/'), kind: before === null ? 'create' : 'update', before, after, beforeHash: hash(before), afterHash: hash(after) });
      changedTypes.add(type);
    }
  }
  for (const type of changedTypes) {
    const layout = layoutFor(type);
    const document = model.docsByType.get(type);
    const projection = loaded.projections.find((candidate) => candidate.docType === type);
    const before = projection?.actual ?? await readOptional(pathInside(projectDir, layout.ledger));
    const after = renderLedger(layout, document.header, document.items);
    if (before !== after) changes.push({ path: layout.ledger, kind: before === null ? 'create' : 'update', before, after, beforeHash: hash(before), afterHash: hash(after) });
  }
  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

async function assertReadyProject(projectDir, operations = []) {
  const transactionState = await inspectTransactionState(projectDir);
  if (transactionState.unresolved.length > 0) {
    throw new TransactionError('An unresolved VEF transaction blocks planning until it is explicitly recovered.', {
      pending: transactionState.unresolved.map(({ id, state }) => ({ id, state })),
    });
  }
  if (transactionState.leases.blocking.length > 0) {
    throw new TransactionError(
      `Malformed transaction lease state blocks planning (${transactionState.leases.blocking.map((lease) => lease.family).join(', ')}). Run "vef recover leases" after confirming no writer is active.`,
      { leases: transactionState.leases.blocking },
    );
  }
  const loaded = await loadCanonicalDocuments(projectDir);
  const repairs = authorityRepairs(cloneLoaded(loaded), operations);
  const issues = [];
  if (loaded.storage.mode !== 'per-item') issues.push('Per-item canonical storage is not active; run vef setup first');
  issues.push(...loaded.storageIssues, ...loaded.projectionIssues, ...graphIssues(loaded.parsedDocs).filter((issue) => !isRepairableTitleIssue(issue, repairs)));
  const memoryIssues = await auditMemoryCatalogDirectory(projectDir);
  issues.push(...memoryIssues.map((issue) => `${issue.surface}: ${issue.message}`));
  if (issues.length > 0) throw new TransactionError(`Transaction preflight failed:\n- ${[...new Set(issues)].join('\n- ')}`);
  return loaded;
}

async function validateAppliedProject(projectDir) {
  const loaded = await loadCanonicalDocuments(projectDir);
  const issues = [...loaded.storageIssues, ...loaded.projectionIssues, ...graphIssues(loaded.parsedDocs)];
  const memoryIssues = await auditMemoryCatalogDirectory(projectDir);
  issues.push(...memoryIssues.map((issue) => `${issue.surface}: ${issue.message}`));
  return [...new Set(issues)];
}

export class TransactionError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'TransactionError';
    this.details = details;
  }
}

/** Plan a complete multi-record candidate without writing any project files. */
export async function planTransaction(projectDir = '.', operations = [], options = {}) {
  if (!Array.isArray(operations) || operations.length === 0) throw new TransactionError('At least one transaction operation is required.');
  const loaded = await assertReadyProject(projectDir, operations);
  const model = cloneLoaded(loaded);
  const now = options.now || new Date().toISOString();
  const actor = String(options.actor || 'process:vef').trim();
  if (!actor) throw new TransactionError('A transaction actor is required.');
  const context = { now, date: now.slice(0, 10), actor, changed: new Set(), created: new Set(), metadataChanged: new Set(), effects: [] };

  for (const operation of operations) {
    if (operation?.kind === 'create') applyCreate(model, operation, context);
    else if (operation?.kind === 'update') applyUpdate(model, operation, context);
    else throw new TransactionError(`Unknown transaction operation "${operation?.kind}".`);
  }
  propagateReferenceMetadata(model, context.changed, context.metadataChanged);
  touchChangedItems(model, context);

  const issues = graphIssues(model.parsedDocs);
  if (issues.length > 0) throw new TransactionError(`Candidate validation failed:\n- ${[...new Set(issues)].join('\n- ')}`);
  const changes = await buildChanges(projectDir, loaded, model, context.changed);
  return {
    schemaVersion: TRANSACTION_SCHEMA_VERSION,
    id: options.id || randomUUID(),
    projectDir: resolve(projectDir),
    actor,
    createdAt: now,
    operations: structuredClone(operations),
    effects: context.effects,
    changes,
    changedRecords: [...context.changed].sort(),
    createdRecords: [...context.created].sort(),
  };
}

function transactionRoot(projectDir) {
  return pathInside(projectDir, TRANSACTION_DIRECTORY);
}

/** Create the ignored runtime namespace without overwriting consumer policy. */
export async function ensureTransactionRuntime(projectDir = '.') {
  const root = transactionRoot(projectDir);
  await mkdir(root, { recursive: true });
  const ignorePath = join(root, '.gitignore');
  if (!(await exists(ignorePath))) {
    try {
      await durableCreate(ignorePath, '*\n!.gitignore\n');
    } catch (error) {
      if (error?.code !== 'EEXIST') throw error;
    }
  }
  return root;
}

const LEASE_DIRECTORY = '_leases';
const LEASE_MARKER_DIRECTORY = '_markers';
const MALFORMED_LEASE_GRACE_MS = 2_000;
const JOURNAL_MARKERS = {
  ready: 'READY.json',
  applying: 'APPLYING.json',
  unresolved: 'UNRESOLVED.json',
  completed: 'COMPLETED.json',
  rolledBack: 'ROLLED_BACK.json',
};

function assertTransactionId(id) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(String(id || ''))) {
    throw new TransactionError(`Unsafe transaction id "${id}".`);
  }
}

async function readJson(path, label) {
  const raw = await readOptional(path);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new TransactionError(`${label} is invalid JSON: ${path}: ${error.message}`);
  }
}

async function durableCreate(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function readJsonResult(path) {
  const raw = await readOptional(path);
  if (raw === null) return { value: null, error: 'file disappeared during inspection' };
  try {
    return { value: JSON.parse(raw), error: null };
  } catch (error) {
    return { value: null, error: `invalid JSON (${error.message})` };
  }
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === 'EPERM';
  }
}

function leaseFamilyForFilename(filename) {
  if (filename.endsWith('.released.json')) return `${filename.slice(0, -'.released.json'.length)}.json`;
  if (filename.endsWith('.renew.json')) {
    const stem = filename.slice(0, -'.renew.json'.length);
    const separator = stem.indexOf('.');
    return `${separator === -1 ? stem : stem.slice(0, separator)}.json`;
  }
  return filename.endsWith('.json') ? filename : null;
}

async function markerMap(root) {
  const directory = join(root, LEASE_MARKER_DIRECTORY);
  if (!(await exists(directory))) return new Map();
  const markers = new Map();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const parsed = await readJsonResult(join(directory, entry.name));
    const marker = parsed.value;
    if (parsed.error || !marker?.family || !['quarantined', 'settled'].includes(marker?.state)) continue;
    const list = markers.get(marker.family) || [];
    list.push({ ...marker, path: join(directory, entry.name) });
    markers.set(marker.family, list);
  }
  return markers;
}

async function inspectLeaseDirectory(root, now = Date.now()) {
  if (!(await exists(root))) return [];
  const entries = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
  const markers = await markerMap(root);
  const groups = new Map();
  for (const entry of entries) {
    const family = leaseFamilyForFilename(entry.name);
    if (!family) continue;
    const group = groups.get(family) || { family, entries: [] };
    group.entries.push(entry.name);
    groups.set(family, group);
  }
  for (const family of markers.keys()) {
    if (!groups.has(family)) groups.set(family, { family, entries: [] });
  }

  const families = [];
  for (const group of groups.values()) {
    const familyMarkers = markers.get(group.family) || [];
    const quarantine = familyMarkers.find((marker) => marker.state === 'quarantined');
    const settlement = familyMarkers.find((marker) => marker.state === 'settled');
    const tokenFromFilename = group.family.slice(0, -'.json'.length);
    const claimName = group.entries.includes(group.family) ? group.family : null;
    const releaseName = group.entries.find((name) => name === `${tokenFromFilename}.released.json`);
    const renewalNames = group.entries.filter((name) => name.endsWith('.renew.json'));
    let lastModified = 0;
    for (const name of group.entries) {
      try {
        lastModified = Math.max(lastModified, (await stat(join(root, name))).mtimeMs);
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
    }
    const base = {
      family: group.family,
      token: tokenFromFilename,
      files: [...group.entries].sort(),
      lastModifiedAt: lastModified ? new Date(lastModified).toISOString() : null,
    };
    if (quarantine) {
      families.push({ ...base, state: 'quarantined', reason: quarantine.reason || 'explicitly quarantined', marker: quarantine.path });
      continue;
    }
    if (settlement) {
      families.push({ ...base, state: 'settled', reason: settlement.reason || 'confirmed inactive', marker: settlement.path });
      continue;
    }
    if (releaseName || locallyReleasedLeases.has(tokenFromFilename)) {
      families.push({ ...base, state: 'released', reason: 'writer recorded release' });
      continue;
    }
    if (!claimName) {
      if (renewalNames.length > 0) families.push({ ...base, state: 'orphan-renewal', reason: 'renewal exists without its base claim' });
      continue;
    }

    const claimResult = await readJsonResult(join(root, claimName));
    const claim = claimResult.value;
    const acquiredAt = Date.parse(claim?.acquiredAt);
    let effectiveExpiry = Date.parse(claim?.expiresAt);
    const problems = [];
    if (claimResult.error) problems.push(claimResult.error);
    if (!claim?.token || !claim?.transactionId || !claim?.acquiredAt || !claim?.expiresAt || !claim?.host || !Number.isInteger(Number(claim?.pid))) {
      problems.push('claim is missing token, transactionId, pid, host, acquiredAt, or expiresAt');
    }
    if (claim?.schemaVersion !== TRANSACTION_SCHEMA_VERSION) problems.push(`unsupported schemaVersion ${claim?.schemaVersion}`);
    if (claim?.token && claim.token !== tokenFromFilename) problems.push(`claim token ${claim.token} does not match filename`);
    if (!Number.isFinite(acquiredAt) || !Number.isFinite(effectiveExpiry) || effectiveExpiry < acquiredAt) problems.push('claim timestamps are invalid');

    for (const renewalName of renewalNames) {
      const renewalResult = await readJsonResult(join(root, renewalName));
      const renewal = renewalResult.value;
      const renewalExpiry = Date.parse(renewal?.expiresAt);
      if (renewalResult.error) problems.push(`${renewalName}: ${renewalResult.error}`);
      else if (renewal?.schemaVersion !== TRANSACTION_SCHEMA_VERSION || renewal?.token !== claim?.token || !Number.isFinite(renewalExpiry)) {
        problems.push(`${renewalName}: renewal is incomplete or belongs to another token`);
      } else {
        effectiveExpiry = Math.max(effectiveExpiry, renewalExpiry);
      }
    }
    if (problems.length > 0) {
      families.push({ ...base, state: 'malformed', reason: [...new Set(problems)].join('; '), transactionId: claim?.transactionId || null });
      continue;
    }

    const detail = { ...base, transactionId: claim.transactionId, pid: Number(claim.pid), host: claim.host, acquiredAt: claim.acquiredAt, expiresAt: new Date(effectiveExpiry).toISOString() };
    if (effectiveExpiry <= now) families.push({ ...detail, state: 'expired', reason: 'effective expiry is in the past' });
    else if (claim.host === hostname() && !processIsAlive(Number(claim.pid))) families.push({ ...detail, state: 'dead', reason: 'local owner process is no longer alive' });
    else families.push({ ...detail, state: 'active', reason: 'owner may still be writing' });
  }
  return families.sort((left, right) => left.family.localeCompare(right.family));
}

/** Inventory writer lease families without treating malformed debris as an exception. */
export async function inspectLeaseState(projectDir = '.', options = {}) {
  const root = join(transactionRoot(projectDir), LEASE_DIRECTORY);
  const families = await inspectLeaseDirectory(root, options.now ?? Date.now());
  return {
    families,
    blocking: families.filter((family) => family.state === 'malformed'),
    active: families.filter((family) => family.state === 'active'),
  };
}

async function writeLeaseMarker(root, family, state, detail = {}) {
  const directory = join(root, LEASE_MARKER_DIRECTORY);
  await mkdir(directory, { recursive: true });
  const at = new Date().toISOString();
  const path = join(directory, `${Date.now()}-${randomUUID()}.json`);
  await durableCreate(path, `${JSON.stringify({
    schemaVersion: TRANSACTION_SCHEMA_VERSION,
    family,
    state,
    at,
    ...detail,
  }, null, 2)}\n`);
  return path;
}

async function cleanLeaseFamily(root, family, files, options = {}) {
  const warnings = [];
  for (const filename of files) {
    try {
      if (options.cleanupLeaseFile) await options.cleanupLeaseFile(join(root, filename));
      else await removeWithRetry(join(root, filename), { force: true });
    } catch (error) {
      warnings.push(`Could not clean transaction lease debris ${join(root, filename)}: ${error.message}`);
    }
  }
  return warnings;
}

async function sweepLeaseDebris(root, options = {}) {
  const warnings = [];
  const families = await inspectLeaseDirectory(root, options.now ?? Date.now());
  const candidates = families
    .filter((family) => ['expired', 'dead', 'released', 'orphan-renewal', 'quarantined', 'settled'].includes(family.state))
    .filter((family) => !options.excludeFamilies?.has(family.family))
    .slice(0, options.limit ?? 32);
  for (const family of candidates) {
    if (!['quarantined', 'settled'].includes(family.state)) {
      try {
        await writeLeaseMarker(root, family.family, 'settled', { reason: `${family.state}: ${family.reason}` });
      } catch (error) {
        warnings.push(`Could not settle transaction lease family ${family.family}: ${error.message}`);
        continue;
      }
    }
    warnings.push(...await cleanLeaseFamily(root, family.family, family.files, options));
  }
  return warnings;
}

/** Explicitly quarantine malformed lease families and settle provably inactive debris. */
export async function recoverLeases(projectDir = '.', options = {}) {
  const root = join(await ensureTransactionRuntime(projectDir), LEASE_DIRECTORY);
  await mkdir(root, { recursive: true });
  const now = options.now ?? Date.now();
  const families = await inspectLeaseDirectory(root, now);
  const recentMalformed = families.filter((family) => family.state === 'malformed'
    && family.lastModifiedAt
    && now - Date.parse(family.lastModifiedAt) < (options.malformedGraceMilliseconds ?? MALFORMED_LEASE_GRACE_MS));
  if (recentMalformed.length > 0 && !options.force) {
    throw new TransactionError(
      `Refusing to quarantine ${recentMalformed.map((family) => family.family).join(', ')} because the malformed claim may still be in flight. Wait and retry, or use --force after confirming no writer is active.`,
      { leases: recentMalformed },
    );
  }

  const quarantined = [];
  const warnings = [];
  for (const family of families.filter((candidate) => candidate.state === 'malformed')) {
    await writeLeaseMarker(root, family.family, 'quarantined', {
      reason: family.reason,
      actor: String(options.actor || 'process:vef-recover'),
    });
    quarantined.push(family.family);
    warnings.push(...await cleanLeaseFamily(root, family.family, family.files, options));
  }
  warnings.push(...await sweepLeaseDebris(root, options));
  const state = await inspectLeaseDirectory(root, now);
  return {
    quarantined,
    active: state.filter((family) => family.state === 'active'),
    families: state,
    warnings,
  };
}

async function activeLeaseClaims(root, now = Date.now()) {
  const families = await inspectLeaseDirectory(root, now);
  const malformed = families.filter((family) => family.state === 'malformed');
  if (malformed.length > 0) {
    throw new TransactionError(
      `Malformed transaction lease state blocks mutations (${malformed.map((family) => family.family).join(', ')}). Run "vef recover leases" after confirming no writer is active.`,
      { leases: malformed },
    );
  }
  return families
    .filter((family) => family.state === 'active')
    .map((family) => ({ ...family, path: join(root, family.family) }))
    .sort((left, right) => String(left.acquiredAt).localeCompare(String(right.acquiredAt)) || String(left.token).localeCompare(String(right.token)));
}

async function acquireLease(projectDir, transactionId, options = {}) {
  const root = join(await ensureTransactionRuntime(projectDir), LEASE_DIRECTORY);
  await mkdir(root, { recursive: true });
  const token = randomUUID();
  const now = Date.now();
  const leaseMilliseconds = options.leaseMilliseconds || 300_000;
  const claim = {
    schemaVersion: TRANSACTION_SCHEMA_VERSION,
    token,
    transactionId,
    pid: process.pid,
    host: hostname(),
    acquiredAt: new Date(now).toISOString(),
    expiresAt: new Date(now + leaseMilliseconds).toISOString(),
  };
  const claimPath = join(root, `${token}.json`);
  await durableCreate(claimPath, `${JSON.stringify(claim, null, 2)}\n`);
  await delay(options.settleMilliseconds ?? 75);

  const warnings = await sweepLeaseDebris(root, {
    ...options,
    excludeFamilies: new Set([`${token}.json`]),
  });

  const release = async () => {
    locallyReleasedLeases.add(token);
    const releasedPath = join(root, `${token}.released.json`);
    try {
      await durableWrite(releasedPath, `${JSON.stringify({ schemaVersion: TRANSACTION_SCHEMA_VERSION, token, releasedAt: new Date().toISOString() }, null, 2)}\n`);
    } catch (error) {
      warnings.push(`Could not mark mutation lease ${token} released: ${error.message}`);
      return warnings;
    }
    let leaseFiles;
    try {
      leaseFiles = (await readdir(root, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && (entry.name === `${token}.json` || entry.name === `${token}.released.json` || (entry.name.startsWith(`${token}.`) && entry.name.endsWith('.renew.json'))))
        .map((entry) => join(root, entry.name));
    } catch (error) {
      warnings.push(`Could not enumerate transaction lease debris in ${root}: ${error.message}`);
      return warnings;
    }
    for (const path of leaseFiles) {
      try {
        await removeWithRetry(path, { force: true });
      } catch (error) {
        warnings.push(`Could not clean transaction lease debris ${path}: ${error.message}`);
      }
    }
    return warnings;
  };

  const assertOwned = async () => {
    let active = await activeLeaseClaims(root);
    let winner = active[0];
    if (!winner || winner.token !== token) {
      throw new TransactionError(
        winner
          ? `Another VEF mutation holds the lease (${winner.transactionId}, pid ${winner.pid}, ${winner.host}).`
          : `Mutation lease ${token} expired before the transaction completed.`,
        { lease: winner || claim },
      );
    }
    const renewedAt = new Date();
    const renewal = {
      schemaVersion: TRANSACTION_SCHEMA_VERSION,
      token,
      renewedAt: renewedAt.toISOString(),
      expiresAt: new Date(renewedAt.getTime() + leaseMilliseconds).toISOString(),
    };
    await durableCreate(join(root, `${token}.${renewedAt.getTime()}-${randomUUID()}.renew.json`), `${JSON.stringify(renewal, null, 2)}\n`);
    active = await activeLeaseClaims(root);
    winner = active[0];
    if (!winner || winner.token !== token) throw new TransactionError(`Mutation lease ${token} lost ownership during renewal.`, { lease: winner || claim });
  };
  try {
    await assertOwned();
  } catch (error) {
    await release();
    throw error;
  }

  return { claim, assertOwned, release, warnings };
}

function journalState(markers) {
  if (markers.completed) return 'completed';
  if (markers.rolledBack) return 'rolled-back';
  if (markers.unresolved) return 'unresolved';
  if (markers.applying) return 'applying';
  if (markers.ready) return 'ready';
  return 'preparing';
}

async function readJournalDirectory(directory, fallbackId) {
  const manifestPath = join(directory, 'manifest.json');
  const manifest = await readJson(manifestPath, 'Transaction manifest');
  if (!manifest) {
    return { id: fallbackId, directory, manifest: null, state: 'incomplete', markers: {} };
  }
  if (manifest.schemaVersion !== TRANSACTION_SCHEMA_VERSION) {
    throw new TransactionError(`Unsupported transaction journal schema ${manifest.schemaVersion} in ${manifestPath}.`);
  }
  if (manifest.id !== fallbackId) throw new TransactionError(`Transaction journal id mismatch in ${manifestPath}.`);
  const markers = {};
  for (const [name, filename] of Object.entries(JOURNAL_MARKERS)) markers[name] = await exists(join(directory, filename));
  return { id: manifest.id, directory, manifest, markers, state: journalState(markers) };
}

/** Inspect durable journals without modifying or automatically recovering them. */
export async function inspectTransactionState(projectDir = '.') {
  const root = transactionRoot(projectDir);
  if (!(await exists(root))) return { unresolved: [], settled: [], leases: { families: [], blocking: [], active: [] } };
  const entries = await readdir(root, { withFileTypes: true });
  const journals = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === LEASE_DIRECTORY) continue;
    journals.push(await readJournalDirectory(join(root, entry.name), entry.name));
  }
  const leases = await inspectLeaseState(projectDir);
  return {
    unresolved: journals.filter((journal) => !['completed', 'rolled-back'].includes(journal.state)),
    settled: journals.filter((journal) => ['completed', 'rolled-back'].includes(journal.state)),
    leases,
  };
}

async function writeMarker(directory, marker, detail = {}) {
  await durableWrite(join(directory, JOURNAL_MARKERS[marker]), `${JSON.stringify({
    schemaVersion: TRANSACTION_SCHEMA_VERSION,
    at: new Date().toISOString(),
    ...detail,
  }, null, 2)}\n`);
}

async function prepareJournal(projectDir, plan) {
  assertTransactionId(plan.id);
  const root = await ensureTransactionRuntime(projectDir);
  const directory = join(root, plan.id);
  try {
    await mkdir(directory);
  } catch (error) {
    if (error?.code === 'EEXIST') throw new TransactionError(`Transaction journal ${plan.id} already exists; replan with a new transaction id.`);
    throw error;
  }
  const manifest = {
    schemaVersion: TRANSACTION_SCHEMA_VERSION,
    id: plan.id,
    actor: plan.actor,
    createdAt: plan.createdAt,
    files: plan.changes.map((change) => ({
      path: change.path,
      existed: change.before !== null,
      beforeHash: change.beforeHash,
      afterHash: change.afterHash,
    })),
  };
  await durableCreate(join(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  for (const change of plan.changes) {
    if (change.before !== null) await durableWrite(pathInside(join(directory, 'before'), change.path), change.before);
    await durableWrite(pathInside(join(directory, 'after'), change.path), change.after);
  }
  await writeMarker(directory, 'ready');
  return { directory, manifest };
}

async function cleanSettledJournal(directory, cleanup = (path) => removeWithRetry(path, { recursive: true, force: true })) {
  try {
    await cleanup(directory);
    return [];
  } catch (error) {
    return [`Transaction completed, but journal cleanup needs attention at ${directory}: ${error.message}`];
  }
}

function recoveryHint(projectDir, id) {
  return `Run "vef recover ${id} --rollback --dir \"${projectDir}\"" or "vef recover ${id} --forward --dir \"${projectDir}\"".`;
}

/** Apply a planned candidate under a stale-tolerant lease and write-ahead journal. */
export async function applyTransaction(plan, options = {}) {
  if (!plan || plan.schemaVersion !== TRANSACTION_SCHEMA_VERSION) throw new TransactionError('Unsupported or missing transaction plan.');
  if (!Array.isArray(plan.changes) || plan.changes.length === 0) return { applied: false, id: plan.id, files: [], effects: plan.effects || [], warnings: [] };
  assertTransactionId(plan.id);
  const projectDir = resolve(plan.projectDir);
  let lease;
  let journal;
  try {
    lease = await acquireLease(projectDir, plan.id, options);
    const transactionState = await inspectTransactionState(projectDir);
    if (transactionState.unresolved.length > 0) {
      throw new TransactionError('An unresolved VEF transaction blocks all new mutations until it is explicitly recovered.', {
        pending: transactionState.unresolved.map(({ id, state }) => ({ id, state })),
      });
    }
    for (const change of plan.changes) {
      const actual = await readOptional(pathInside(projectDir, change.path));
      if (hash(actual) !== change.beforeHash) {
        throw new TransactionError(`Transaction candidate is stale because ${change.path} changed after preview. Replan before applying.`);
      }
    }

    journal = await prepareJournal(projectDir, plan);
    await writeMarker(journal.directory, 'applying');
    for (let index = 0; index < plan.changes.length; index += 1) {
      const change = plan.changes[index];
      await lease.assertOwned();
      await writeTransactionTarget(pathInside(projectDir, change.path), change.after, options);
      if (options.afterWrite) await options.afterWrite({ index, change, plan });
    }
    const issues = await validateAppliedProject(projectDir);
    if (issues.length > 0) throw new TransactionError(`Applied candidate failed final validation:\n- ${issues.join('\n- ')}`);
    await writeMarker(journal.directory, 'completed');
    const warnings = await cleanSettledJournal(journal.directory, options.cleanupJournal);
    warnings.push(...await lease.release());
    return { applied: true, id: plan.id, files: plan.changes.map((change) => change.path), effects: plan.effects || [], warnings };
  } catch (error) {
    if (journal?.directory) {
      try {
        await writeMarker(journal.directory, 'unresolved', { error: error?.message || String(error) });
      } catch {
        // The immutable manifest and applying marker still make the interruption discoverable.
      }
    }
    if (lease) await lease.release();
    const hint = journal ? ` ${recoveryHint(projectDir, plan.id)}` : '';
    throw new TransactionError(`Transaction ${plan.id} was not completed.${hint} Cause: ${error?.message || String(error)}`, {
      cause: error,
      journalDirectory: journal?.directory,
    });
  }
}

async function verifiedJournalContent(journal, file, direction) {
  if (direction === 'forward') {
    const content = await readFile(pathInside(join(journal.directory, 'after'), file.path), 'utf8');
    if (hash(content) !== file.afterHash) throw new TransactionError(`Staged recovery content failed its hash check: ${file.path}`);
    return content;
  }
  if (!file.existed) return null;
  const content = await readFile(pathInside(join(journal.directory, 'before'), file.path), 'utf8');
  if (hash(content) !== file.beforeHash) throw new TransactionError(`Backup recovery content failed its hash check: ${file.path}`);
  return content;
}

/** Explicitly roll an interrupted transaction forward or back. */
export async function recoverTransaction(projectDir = '.', id, direction, options = {}) {
  if (!['forward', 'rollback'].includes(direction)) throw new TransactionError('Recovery direction must be "forward" or "rollback".');
  assertTransactionId(id);
  const resolvedProject = resolve(projectDir);
  let lease;
  try {
    lease = await acquireLease(resolvedProject, `recover:${id}`, options);
    const journal = await readJournalDirectory(join(transactionRoot(resolvedProject), id), id);
    if (!journal.manifest) throw new TransactionError(`Transaction ${id} has no readable manifest and cannot be recovered automatically.`);
    if (['completed', 'rolled-back'].includes(journal.state)) {
      const warnings = await cleanSettledJournal(journal.directory, options.cleanupJournal);
      warnings.push(...await lease.release());
      return { recovered: false, id, state: journal.state, files: [], warnings };
    }
    if (direction === 'forward' && !journal.markers.ready) {
      throw new TransactionError(`Transaction ${id} was interrupted before its staged candidate was complete; only rollback is safe.`);
    }

    const files = direction === 'rollback' ? [...journal.manifest.files].reverse() : journal.manifest.files;
    const divergent = [];
    for (const file of files) {
      const currentHash = hash(await readOptional(pathInside(resolvedProject, file.path)));
      if (currentHash !== file.beforeHash && currentHash !== file.afterHash) divergent.push(file.path);
    }
    if (divergent.length > 0 && !options.force) {
      throw new TransactionError(`Recovery stopped because these transaction targets now contain unrecognized content: ${divergent.join(', ')}. Inspect them and rerun recovery with --force only if overwriting them is intended.`, { divergent });
    }

    for (const file of files) {
      await lease.assertOwned();
      const content = await verifiedJournalContent(journal, file, direction);
      const target = pathInside(resolvedProject, file.path);
      if (content === null) await removeWithRetry(target, { force: true });
      else await durableWrite(target, content);
    }
    const issues = await validateAppliedProject(resolvedProject);
    if (issues.length > 0) throw new TransactionError(`Recovered project failed final validation:\n- ${issues.join('\n- ')}`);
    await writeMarker(journal.directory, direction === 'forward' ? 'completed' : 'rolledBack', { recoveredBy: options.actor || 'process:vef-recover' });
    const warnings = await cleanSettledJournal(journal.directory, options.cleanupJournal);
    warnings.push(...await lease.release());
    return { recovered: true, id, state: direction === 'forward' ? 'completed' : 'rolled-back', files: files.map((file) => file.path), warnings, divergent };
  } catch (error) {
    if (lease) await lease.release();
    if (error instanceof TransactionError) throw error;
    throw new TransactionError(`Recovery of transaction ${id} failed: ${error?.message || String(error)}`, { cause: error });
  }
}

function formatChangeDiff(change, limit = 120) {
  const before = String(change.before ?? '').split('\n');
  const after = String(change.after ?? '').split('\n');
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < before.length - prefix
    && suffix < after.length - prefix
    && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) suffix += 1;
  const contextStart = Math.max(0, prefix - 2);
  const removed = before.slice(contextStart, before.length - suffix);
  const added = after.slice(contextStart, after.length - suffix);
  const trailing = suffix > 0 ? before.slice(before.length - Math.min(2, suffix)) : [];
  const lines = [`--- a/${change.path}`, `+++ b/${change.path}`, '@@'];
  for (const line of before.slice(contextStart, prefix)) lines.push(` ${line}`);
  for (const line of removed.slice(prefix - contextStart)) lines.push(`-${line}`);
  for (const line of added.slice(prefix - contextStart)) lines.push(`+${line}`);
  for (const line of trailing) lines.push(` ${line}`);
  if (lines.length > limit) return [...lines.slice(0, limit), `... diff truncated (${lines.length - limit} more line(s))`].join('\n');
  return lines.join('\n');
}

export function formatTransactionPlan(plan, options = {}) {
  const lines = [`Transaction ${plan.id}`, `${plan.changes.length} file change(s), ${plan.changedRecords.length} record(s)`];
  for (const effect of plan.effects) lines.push(`  ${effect}`);
  for (const change of plan.changes) lines.push(`  ${change.kind.toUpperCase()} ${change.path}`);
  if (options.includeDiff && plan.changes.length > 0) {
    lines.push('');
    for (const change of plan.changes) lines.push(formatChangeDiff(change), '');
  }
  return lines.join('\n');
}

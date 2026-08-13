import yaml from 'js-yaml';
import {
  QUERY_SCHEMA_VERSION,
  explainWhy,
  filterRecords,
  loadProject,
  projectGraph,
  publicRecord,
  recordSummary,
  referencesFor,
  resolveRecord,
  searchRecords,
  normalizeProjectType,
} from '../lib/project-query.mjs';

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const cell = (value) => value === undefined || value === null || value === '' ? '-' : clean(value);

function writeJson(command, payload) {
  console.log(JSON.stringify({ schemaVersion: QUERY_SCHEMA_VERSION, command, ...payload }, null, 2));
}

function summaryTable(items) {
  if (items.length === 0) return 'No items found.';
  const lines = ['ID\tTYPE\tSTATUS\tPRIORITY\tTITLE'];
  for (const item of items) {
    lines.push([item.id, item.type, cell(item.status), cell(item.priority), clean(item.title)].join('\t'));
  }
  return lines.join('\n');
}

function edgeLine(edge, incoming = false) {
  const flags = [edge.external ? 'external' : null, edge.missing ? 'missing' : null].filter(Boolean);
  const suffix = flags.length ? ` (${flags.join(', ')})` : '';
  if (incoming) {
    return `  ${edge.source.id} [${edge.source.type}].${edge.field} -> ${edge.target.id}${suffix}`;
  }
  return `  ${edge.field} -> ${edge.target.id} [${edge.target.type}] — ${clean(edge.target.title)}${suffix}`;
}

export async function listCommand(type, opts) {
  const project = await loadProject(opts.dir);
  const records = filterRecords(project.records, { type, status: opts.status, priority: opts.priority });
  const items = records.map(recordSummary);
  const filters = {
    type: normalizeProjectType(type),
    status: opts.status?.toLowerCase() || null,
    priority: opts.priority?.toUpperCase() || null,
  };
  if (opts.json) writeJson('list', { filters, items });
  else console.log(summaryTable(items));
}

export async function showCommand(selector, opts) {
  const project = await loadProject(opts.dir);
  const record = resolveRecord(project, selector);
  const item = publicRecord(record);
  if (opts.json) {
    writeJson('show', { item });
    return;
  }
  console.log(`${item.id} — ${item.title}`);
  console.log(`Type: ${item.type}`);
  console.log(`File: ${item.file}`);
  console.log('\nFrontmatter:');
  process.stdout.write(yaml.dump(item.frontmatter, { lineWidth: 120, noRefs: true, sortKeys: false }));
  console.log('Body:');
  console.log(item.body || '(empty)');
}

export async function refsCommand(selector, opts) {
  const project = await loadProject(opts.dir);
  const record = resolveRecord(project, selector);
  const item = recordSummary(record);
  const refs = referencesFor(project, record, opts.direction);
  if (opts.json) {
    writeJson('refs', { item, ...refs });
    return;
  }
  console.log(`${item.id} — ${item.title}`);
  if (refs.direction !== 'in') {
    console.log('\nOutgoing:');
    console.log(refs.outgoing.length ? refs.outgoing.map((edge) => edgeLine(edge)).join('\n') : '  (none)');
  }
  if (refs.direction !== 'out') {
    console.log('\nIncoming:');
    console.log(refs.incoming.length ? refs.incoming.map((edge) => edgeLine(edge, true)).join('\n') : '  (none)');
  }
}

export async function whyCommand(selector, opts) {
  const project = await loadProject(opts.dir);
  const record = resolveRecord(project, selector);
  const explanation = explainWhy(project, record);
  const root = recordSummary(record);
  if (opts.json) {
    writeJson('why', { root, ...explanation });
    return;
  }
  console.log(`Why ${root.id} — ${root.title}`);
  if (explanation.paths.length === 0) {
    console.log('\nNo explanatory relationships found.');
  } else {
    console.log('\nPaths:');
    for (const path of explanation.paths) {
      const first = path[0].source.id;
      const rest = path.map((edge) => `--${edge.field}--> ${edge.target.id}`).join(' ');
      console.log(`  ${first} ${rest}`);
    }
  }
  const decisions = explanation.nodes.filter((node) => node.type === 'decisions');
  if (decisions.length > 0) {
    console.log('\nDecision rationale:');
    for (const decision of decisions) {
      const full = project.byKey.get(`decisions:${decision.id}`)?.[0];
      console.log(`  ${decision.id}: ${clean(full?.frontmatter.rationale || decision.title)}`);
    }
  }
}

export async function graphCommand(opts) {
  const project = await loadProject(opts.dir);
  const graph = projectGraph(project);
  if (opts.json) {
    writeJson('graph', graph);
    return;
  }
  console.log('Nodes:');
  console.log(summaryTable(graph.nodes));
  console.log('\nEdges:');
  if (graph.edges.length === 0) console.log('(none)');
  else for (const edge of graph.edges) console.log(`${edge.source.id}\t${edge.field}\t${edge.target.id}\t${edge.target.type}${edge.external ? '\texternal' : edge.missing ? '\tmissing' : ''}`);
}

export async function searchCommand(query, opts) {
  const project = await loadProject(opts.dir);
  const records = searchRecords(project.records, query, { type: opts.type, status: opts.status, priority: opts.priority });
  const items = records.map(recordSummary);
  if (opts.json) {
    const filters = {
      type: normalizeProjectType(opts.type),
      status: opts.status?.toLowerCase() || null,
      priority: opts.priority?.toUpperCase() || null,
    };
    writeJson('search', { query, filters, items });
    return;
  }
  console.log(`Search: ${query}\n`);
  console.log(summaryTable(items));
}

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { load as loadYaml } from 'js-yaml';

const exec = promisify(execFile);
const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtureFile = join(repository, 'docs', 'evaluations', 'inheritance-study-v1', 'fixtures.yml');
const cli = join(repository, 'bin', 'vef.mjs');
const fixtures = loadYaml(await readFile(fixtureFile, 'utf8'));

function option(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function scenario(id) {
  const found = fixtures.scenarios.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown scenario ${id}`);
  return found;
}

async function run(command, args, cwd) {
  return exec(command, args, { cwd, maxBuffer: 10 * 1024 * 1024, timeout: 120_000 });
}

const packageJson = (entry, condition) => `${JSON.stringify({
  name: `vef-eval-${entry.id}`,
  private: true,
  type: 'module',
  scripts: { test: 'node --test' },
  ...(condition === 'treatment' ? { devDependencies: { 'vibe-engineering-framework': '0.3.1' } } : {}),
}, null, 2)}\n`;

const commonFiles = {
  'cache-persistence': {
    'src/atomic-replace.mjs': `import { rename, writeFile } from 'node:fs/promises';
export async function atomicReplace(path, content) {
  const temporary = \`${'${path}'}.next\`;
  await writeFile(temporary, content, 'utf8');
  await rename(temporary, path);
}
`,
    'src/file-storage.mjs': `import { readFile } from 'node:fs/promises';
import { atomicReplace } from './atomic-replace.mjs';
export function createJsonFileStorage(path) {
  return {
    async read() { try { return await readFile(path, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } },
    async write(content) { await atomicReplace(path, content); },
  };
}
`,
    'src/cache.mjs': `export function createCache({ storage }) {
  const entries = new Map();
  return {
    get(key) { return entries.get(key); },
    set(key, value) { entries.set(key, value); },
    async restore() { throw new Error('TASK-101: restore persisted entries'); },
    async persist() { throw new Error('TASK-101: persist entries'); },
  };
}
`,
    'test/cache.test.mjs': `import assert from 'node:assert/strict';
import test from 'node:test';
import { createCache } from '../src/cache.mjs';
test('cache retains values in one instance', () => {
  const cache = createCache({ storage: { read: async () => null, write: async () => {} } });
  cache.set('answer', 42);
  assert.equal(cache.get('answer'), 42);
});
`,
  },
  'import-retry': {
    'src/importer.mjs': `export async function importOrdered(items, { request, retryPolicy }) {
  const results = [];
  for (const item of items) results.push(await request(item));
  return results;
}
`,
    'test/importer.test.mjs': `import assert from 'node:assert/strict';
import test from 'node:test';
import { importOrdered } from '../src/importer.mjs';
test('imports sequentially in input order', async () => {
  const seen = [];
  const result = await importOrdered(['a', 'b'], { request: async (item) => { seen.push(item); return item.toUpperCase(); }, retryPolicy: {} });
  assert.deepEqual(seen, ['a', 'b']);
  assert.deepEqual(result, ['A', 'B']);
});
`,
  },
  'privacy-export': {
    'src/audit.mjs': `const SENSITIVE = new Set(['email', 'accessToken', 'authorization']);
export function redactEvent(event) {
  return Object.fromEntries(Object.entries(event).map(([key, value]) => [key, SENSITIVE.has(key) ? \`[redacted:\${key}]\` : value]));
}
export function readAudit(events) { return events.map(redactEvent); }
export function exportAudit(events) { throw new Error('TASK-302: export redacted JSONL'); }
`,
    'test/audit.test.mjs': `import assert from 'node:assert/strict';
import test from 'node:test';
import { readAudit } from '../src/audit.mjs';
test('audit reads redact sensitive fields', () => {
  assert.deepEqual(readAudit([{ type: 'login', email: 'person@example.test' }]), [{ type: 'login', email: '[redacted:email]' }]);
});
`,
  },
};

async function writeFiles(root, files) {
  for (const [relative, content] of Object.entries(files)) {
    const target = join(root, relative);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
}

function architecture(entry) {
  return `# Architecture\n\n${entry.architecture.map((line) => `- ${line}`).join('\n')}\n`;
}

function controlDocuments(entry) {
  return {
    'AGENTS.md': `# Agent instructions\n\nRead VISION.md, ARCHITECTURE.md, DECISIONS.md, PLAN.md, and WORK.md before changing code. Complete only the named work, run tests, and reconcile directly implied statuses without reopening settled decisions.\n`,
    'VISION.md': `# Vision\n\n${entry.vision}\n`,
    'ARCHITECTURE.md': architecture(entry),
    'DECISIONS.md': `# Decisions\n\n${entry.decisions.map((decision) => `## ${decision.id} — accepted\n\nDecision: ${decision.statement}\n\nRationale: ${decision.rationale}\n`).join('\n')}`,
    'PLAN.md': `# Plan\n\n${entry.roadmap.map((item) => `- ${item.id} | ${item.status} | ${item.statement}`).join('\n')}\n`,
    'WORK.md': `# Work\n\n${entry.tasks.map((task) => `- ${task.id} | ${task.status} | depends_on: ${(task.depends_on || []).join(', ') || 'none'} | ${task.statement}`).join('\n')}\n`,
  };
}

function transactionOperations(entry) {
  const visionId = `${entry.id}-vision`;
  const operations = [{
    kind: 'create', type: 'vision',
    data: { id: visionId, title: entry.project, status: 'active', description: entry.vision },
    body: entry.vision,
  }];
  for (const item of entry.roadmap) operations.push({
    kind: 'create', type: 'roadmap',
    data: { id: item.id, title: item.statement, description: item.statement, status: item.status, priority: 'P0' },
    relationships: { vision_theme: visionId }, body: item.statement,
  });
  for (const task of entry.tasks) operations.push({
    kind: 'create', type: 'tasks',
    data: { id: task.id, title: task.statement, description: task.statement, status: task.status, priority: task.id === entry.named_task ? 'P0' : 'P1' },
    relationships: { roadmap_item: entry.roadmap[0].id, depends_on: task.depends_on || [] }, body: task.statement,
  });
  for (const decision of entry.decisions) operations.push({
    kind: 'create', type: 'decisions',
    data: {
      id: decision.id, title: decision.statement, status: decision.status, context: entry.project,
      decision: decision.statement, rationale: decision.rationale,
      consequences: 'The implementation and project state must preserve this boundary.',
    },
    relationships: { related_vision: [visionId], related_roadmap_items: [entry.roadmap[0].id], related_tasks: [entry.named_task] },
    body: `${decision.statement}\n\n${decision.rationale}`,
  });
  return operations;
}

function normalizedFacts(entry) {
  return {
    scenario: entry.id,
    vision: entry.vision,
    architecture: entry.architecture,
    decisions: entry.decisions.map(({ id, status, statement }) => ({ id, status, statement })),
    roadmap: entry.roadmap,
    tasks: entry.tasks,
    prompt: `${fixtures.participant_prompt} ${entry.prompt_suffix}`,
    oracle: entry.oracle,
  };
}

async function generateOne(root, condition, entry, options = {}) {
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  await writeFile(join(root, 'package.json'), packageJson(entry, condition), 'utf8');
  await writeFiles(root, commonFiles[entry.id]);
  if (condition === 'control') {
    await writeFiles(root, controlDocuments(entry));
  } else if (condition === 'treatment') {
    await run(process.execPath, [cli, 'setup', '--dir', root, '--name', entry.project], repository);
    const proposal = join(root, '.evaluation-proposal.json');
    await writeFile(proposal, JSON.stringify({ operations: transactionOperations(entry) }), 'utf8');
    await run(process.execPath, [cli, 'create', 'batch', '--from', proposal, '--write', '--actor', 'process:evaluation-fixture', '--dir', root], repository);
    await rm(proposal, { force: true });
    await writeFile(join(root, 'ARCHITECTURE.md'), architecture(entry), 'utf8');
    await run(process.execPath, [cli, 'check', '--dir', root], repository);
    if (options.installTreatment) {
      const npmCli = process.env.npm_execpath || join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
      await run(process.execPath, [npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund'], root);
    }
  } else {
    throw new Error(`Unknown condition ${condition}`);
  }
  await writeFile(join(root, 'EVALUATION_TASK.md'), `${fixtures.participant_prompt}\n\n${entry.prompt_suffix}\n`, 'utf8');
}

async function generate(output, options = {}) {
  for (const entry of fixtures.scenarios) {
    for (const condition of ['control', 'treatment']) {
      await generateOne(join(output, condition, entry.id), condition, entry, options);
    }
    const reportDir = join(output, '_reports');
    await mkdir(reportDir, { recursive: true });
    const facts = `${JSON.stringify(normalizedFacts(entry), null, 2)}\n`;
    await writeFile(join(reportDir, `${entry.id}.control.json`), facts, 'utf8');
    await writeFile(join(reportDir, `${entry.id}.treatment.json`), facts, 'utf8');
  }
}

async function verify(output) {
  for (const entry of fixtures.scenarios) {
    const control = await readFile(join(output, '_reports', `${entry.id}.control.json`), 'utf8');
    const treatment = await readFile(join(output, '_reports', `${entry.id}.treatment.json`), 'utf8');
    assert.equal(control, treatment, `${entry.id} semantic reports differ`);
    for (const condition of ['control', 'treatment']) {
      const root = join(output, condition, entry.id);
      await run(process.execPath, ['--test'], root);
      const corpus = (await Promise.all((condition === 'control'
        ? ['VISION.md', 'ARCHITECTURE.md', 'DECISIONS.md', 'PLAN.md', 'WORK.md']
        : ['VISION.md', 'ARCHITECTURE.md', 'DECISIONS.md', 'ROADMAP.md', 'TASKS.md'])
        .map((file) => readFile(join(root, file), 'utf8')))).join('\n');
      for (const statement of [entry.vision, ...entry.architecture, ...entry.decisions.map((item) => item.statement), ...entry.roadmap.map((item) => item.statement), ...entry.tasks.map((item) => item.statement)]) {
        assert(corpus.includes(statement), `${condition}/${entry.id} omits: ${statement}`);
      }
    }
  }
  return { equivalent: true, scenarios: fixtures.scenarios.length, conditions: 2 };
}

async function importFresh(path) {
  return import(`${pathToFileURL(path).href}?evaluation=${Date.now()}-${Math.random()}`);
}

async function projectStateContradictions(root, condition, entry) {
  const taskPath = condition === 'control'
    ? join(root, 'WORK.md')
    : join(root, 'docs', 'tasks', `${entry.named_task}.md`);
  const taskText = await readFile(taskPath, 'utf8');
  const roadmapText = condition === 'control'
    ? await readFile(join(root, 'PLAN.md'), 'utf8')
    : await readFile(join(root, 'docs', 'roadmap', `${entry.roadmap[0].id}.md`), 'utf8');
  const contradictions = [];
  if (!new RegExp(`${entry.named_task}[\\s\\S]{0,500}completed`, 'i').test(taskText)) contradictions.push(`${entry.named_task} is not completed`);
  if (!/In Progress/.test(roadmapText)) contradictions.push(`${entry.roadmap[0].id} did not remain In Progress`);
  const later = entry.tasks.at(-1);
  const laterText = condition === 'control' ? taskText : await readFile(join(root, 'docs', 'tasks', `${later.id}.md`), 'utf8');
  if (!/pending/.test(laterText)) contradictions.push(`${later.id} did not remain pending`);
  return contradictions;
}

async function oracle(root, condition, entry) {
  await run(process.execPath, ['--test'], root);
  const contradictions = await projectStateContradictions(root, condition, entry);
  if (entry.id === 'cache-persistence') {
    const source = await readFile(join(root, 'src', 'cache.mjs'), 'utf8');
    if (/node:fs/.test(source)) contradictions.push('domain cache imports node:fs');
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    if (Object.keys(pkg.dependencies || {}).length > 0) contradictions.push('runtime dependency added');
    const { createCache } = await importFresh(join(root, 'src', 'cache.mjs'));
    let raw = null;
    const storage = { read: async () => raw, write: async (value) => { raw = value; } };
    const first = createCache({ storage }); first.set('answer', 42); await first.persist();
    const second = createCache({ storage }); await second.restore(); assert.equal(second.get('answer'), 42);
    raw = '{invalid'; second.set('stable', true); await second.restore(); assert.equal(second.get('stable'), true);
  } else if (entry.id === 'import-retry') {
    const source = await readFile(join(root, 'src', 'importer.mjs'), 'utf8');
    if (/Promise\.all|allSettled/.test(source)) contradictions.push('parallel import introduced');
    const { importOrdered } = await importFresh(join(root, 'src', 'importer.mjs'));
    let attempts = 0; const delays = [];
    const transient = async () => { attempts++; if (attempts < 3) throw Object.assign(new Error('transient'), { status: 503 }); return 'ok'; };
    const policy = { shouldRetry: (error) => error.status === 429 || error.status >= 500, delay: async (attempt) => { delays.push(attempt); } };
    assert.deepEqual(await importOrdered(['x'], { request: transient, retryPolicy: policy }), ['ok']);
    assert.equal(attempts, 3); assert.equal(delays.length, 2);
    let durableAttempts = 0;
    await assert.rejects(importOrdered(['x'], { request: async () => { durableAttempts++; throw Object.assign(new Error('bad'), { status: 400 }); }, retryPolicy: policy }));
    assert.equal(durableAttempts, 1);
  } else if (entry.id === 'privacy-export') {
    const source = await readFile(join(root, 'src', 'audit.mjs'), 'utf8');
    const { exportAudit } = await importFresh(join(root, 'src', 'audit.mjs'));
    const exported = exportAudit([{ type: 'login', email: 'person@example.test', accessToken: 'secret', authorization: 'Bearer hidden' }]);
    assert.equal(typeof exported, 'string');
    for (const secret of ['person@example.test', 'secret', 'Bearer hidden']) assert(!exported.includes(secret));
    if (!/redactEvent/.test(source.slice(source.indexOf('export function exportAudit')))) contradictions.push('export does not use redaction boundary');
    assert.equal(exported.trim().split(/\r?\n/).length, 1);
  }
  return { scenario: entry.id, condition, contradictionCount: contradictions.length, contradictions };
}

async function blind(runDirectory, output) {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const replacements = [
    [/vibe-engineering-framework|\bVEF\b/gi, '[project-memory-system]'],
    [/(?:docs[\\/]?(?:tasks|roadmap|decisions|vision)|\.vef)[^\s]*/gi, '[project-state]'],
    [/\bvef\s+(?:create|update|setup|check|doctor|recover)[^\r\n]*/gi, '[project-state command removed]'],
  ];
  for (const name of ['patch.diff', 'final.md', 'semantic-report.json', 'tests.txt']) {
    try {
      let content = await readFile(join(runDirectory, name), 'utf8');
      for (const [pattern, replacement] of replacements) content = content.replace(pattern, replacement);
      await writeFile(join(output, name), content, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return { evidence: basename(output), conditionLabelsRemoved: true, toolTranscriptExcluded: true };
}

const command = process.argv[2];
if (command === 'generate') {
  const output = resolve(option('output') || 'evaluation-work');
  await generate(output, { installTreatment: process.argv.includes('--install-treatment') });
  console.log(JSON.stringify({ generated: output, ...(await verify(output)) }));
} else if (command === 'verify') {
  console.log(JSON.stringify(await verify(resolve(option('output') || 'evaluation-work'))));
} else if (command === 'oracle') {
  const id = option('scenario'); const condition = option('condition'); const root = resolve(option('repo'));
  console.log(JSON.stringify(await oracle(root, condition, scenario(id)), null, 2));
} else if (command === 'blind') {
  console.log(JSON.stringify(await blind(resolve(option('run')), resolve(option('output')))));
} else {
  throw new Error('Usage: inheritance-v1.mjs generate|verify|oracle|blind [options]');
}

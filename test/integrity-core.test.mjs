import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { validateItem } from '../src/lib/schemas.mjs';
import { checkBidirectional, findDependencyCycles, findDuplicateIds, findOrphans } from '../src/lib/crosslinks.mjs';
import { auditApplyContract } from '../src/lib/apply-contract.mjs';
import { MEMORY_CATALOG, auditMemoryCatalogDirectory } from '../src/lib/memory-catalog.mjs';
import { parseDoc } from '../src/lib/frontmatter.mjs';

const execFileAsync = promisify(execFile);
const ref = (id, name, url) => ({ id, name, url });
const task = (id, extra = {}) => ({ id, data: { id, title: id, description: 'Test task', status: 'pending', priority: 'P1', last_updated: '2026-08-13', depends_on: [], related_decisions: [], ...extra } });
const roadmap = (id, extra = {}) => ({ id, data: { id, title: id, description: 'Test roadmap', status: 'In Progress', priority: 'P1', last_updated: '2026-08-13', related_tasks: [], related_decisions: [], ...extra } });

test('validates scalar fields, references, and heading agreement', () => {
  const item = task('TASK-001');
  assert.deepEqual(validateItem('tasks', item.data, { ...item, title: 'TASK-001' }), { errors: [], warnings: [] });
  const invalid = validateItem('tasks', { ...item.data, priority: 'urgent', related_decisions: [{ id: 'DEC-001' }] }, { ...item, title: 'Different' });
  assert.match(invalid.errors.join('\n'), /Invalid priority/);
  assert.match(invalid.errors.join('\n'), /missing string name/);
  assert.match(invalid.errors.join('\n'), /Heading title/);
});

test('detects wrong target type, duplicate IDs, and both missing inverse directions', () => {
  const docs = [
    { docType: 'tasks', filename: 'TASKS.md', items: [task('TASK-001', { roadmap_item: ref('ROADMAP-001', 'Roadmap', '/ROADMAP.md#ROADMAP-001') }), task('TASK-003', { roadmap_item: ref('DEC-001', 'Wrong type', '/DECISIONS.md#DEC-001') })] },
    { docType: 'roadmap', filename: 'ROADMAP.md', items: [roadmap('ROADMAP-001', { related_tasks: [ref('TASK-002', 'Missing task', '/TASKS.md#TASK-002')] }), roadmap('ROADMAP-001')] },
    { docType: 'decisions', filename: 'DECISIONS.md', items: [{ id: 'DEC-001', data: { id: 'DEC-001' } }] },
  ];
  const orphans = findOrphans(docs);
  assert.equal(orphans.length, 2);
  assert.deepEqual(new Set(orphans.map((issue) => issue.expectedType)), new Set(['roadmap', 'tasks']));
  assert.deepEqual(findDuplicateIds(docs), [{ docType: 'roadmap', id: 'ROADMAP-001' }]);
  const bidi = checkBidirectional(docs).map((issue) => issue.message).join('\n');
  assert.match(bidi, /tasks:TASK-001\.roadmap_item/);
  assert.match(bidi, /roadmap:ROADMAP-001\.related_tasks/);
});

test('detects dependency cycles', () => {
  const docs = [{ docType: 'tasks', filename: 'TASKS.md', items: [
    task('TASK-001', { depends_on: [ref('TASK-002', 'Two', '/TASKS.md#TASK-002')] }),
    task('TASK-002', { depends_on: [ref('TASK-001', 'One', '/TASKS.md#TASK-001')] }),
  ] }];
  assert.equal(findDependencyCycles(docs).length, 1);
});

test('defines and dogfoods one complete durable-memory catalogue', async () => {
  assert.deepEqual(MEMORY_CATALOG.map((record) => record.label), [
    'Vision', 'Architecture', 'Roadmap', 'Tasks', 'Decisions', 'Log', 'External issues',
  ]);
  assert.deepEqual(await auditMemoryCatalogDirectory('.'), []);
});

test('CLI version is sourced from package metadata', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  const { stdout } = await execFileAsync(process.execPath, ['bin/vef.mjs', '--version']);
  assert.equal(stdout.trim(), packageJson.version);
});

test('publishes executable schema and transaction contracts through stable package exports', async () => {
  const schema = await import('vibe-engineering-framework/schema');
  const transactions = await import('vibe-engineering-framework/transactions');
  assert.equal(schema.SCHEMAS.tasks.fields.roadmap_item.inverse, 'related_tasks');
  assert.equal(schema.SCHEMAS.tasks.fields.modified.kind, 'provenance');
  assert.equal(typeof transactions.planTransaction, 'function');
  assert.equal(typeof transactions.recoverTransaction, 'function');
});

test('CLI presents one setup command and one strict check command for adoption', async () => {
  const { stdout } = await execFileAsync(process.execPath, ['bin/vef.mjs', '--help']);
  assert.match(stdout, /setup \[options\]/);
  assert.match(stdout, /check \[options\]/);
  assert.match(stdout, /Normal adoption requires only setup and check/);
  assert.doesNotMatch(stdout, /npx --yes/);
  for (const internal of ['init [options]', 'migrate [options]', 'validate [options]', 'project [options]']) {
    assert.doesNotMatch(stdout, new RegExp(internal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  const { stdout: doctorHelp } = await execFileAsync(process.execPath, ['bin/vef.mjs', 'doctor', '--help']);
  assert.doesNotMatch(doctorHelp, /--fix/);

  for (const humanSurface of ['README.md', 'docs/releases/v0.2.0.md', 'docs/releases/v0.3.0.md']) {
    assert.doesNotMatch(await readFile(humanSurface, 'utf8'), /npx --yes/);
  }
});

test('release metadata and workflow preserve the verified publication boundary', async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  assert.equal(packageJson.name, 'vibe-engineering-framework');
  assert.equal(packageJson.publishConfig?.access, 'public');
  assert.equal(packageJson.repository?.url, 'git+https://github.com/drmoyassine/vibe-engineering-framework.git');
  assert.match(packageJson.scripts?.prepublishOnly || '', /release:check/);
  assert.match(packageJson.scripts?.['release:check'] || '', /release:smoke/);

  const validationWorkflow = await readFile('.github/workflows/validate.yml', 'utf8');
  assert.match(validationWorkflow, /npm ci/);
  assert.match(validationWorkflow, /npm run release:check/);
  assert.doesNotMatch(validationWorkflow, /npm install\s*$/m);

  const publishWorkflow = await readFile('.github/workflows/publish.yml', 'utf8');
  assert.match(publishWorkflow, /workflow_dispatch:/);
  assert.match(publishWorkflow, /id-token: write/);
  assert.match(publishWorkflow, /git show-ref --verify --quiet/);
  assert.match(publishWorkflow, /check-release-tag\.mjs/);
  assert.match(publishWorkflow, /npm stage publish --ignore-scripts/);
  assert.doesNotMatch(publishWorkflow, /NODE_AUTH_TOKEN|NPM_TOKEN/);
  assert.doesNotMatch(publishWorkflow, /run:.*\$\{\{ inputs\.tag \}\}/);
});

test('keeps named consumers out of framework product and agent surfaces', async () => {
  const decisions = parseDoc(await readFile('DECISIONS.md', 'utf8')).items;
  const boundary = decisions.find((item) => item.data?.id === 'DEC-005');
  assert(boundary, 'DEC-005 must define the consumer boundary');
  assert(Array.isArray(boundary.data.consumer_names) && boundary.data.consumer_names.length > 0);

  const surfaces = [
    'VISION.md',
    'ROADMAP.md',
    'ARCHITECTURE.md',
    'README.md',
    'index.md',
    'CLAUDE.md',
    'AGENTS.md',
    'templates/VISION.md',
    'templates/ROADMAP.md',
    'templates/ARCHITECTURE.md',
    'templates/index.md',
    'templates/CLAUDE.md',
    'templates/AGENTS.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'RELEASING.md',
    'docs/releases/v0.1.0.md',
    'docs/releases/v0.2.0.md',
    'docs/releases/v0.3.0.md'
  ];
  for (const surface of surfaces) {
    const content = await readFile(surface, 'utf8');
    for (const name of boundary.data.consumer_names) {
      assert.equal(content.toLowerCase().includes(name.toLowerCase()), false, `${surface} must not name consumer ${name}`);
    }
  }
});

test('init creates lowercase OKF files with truthful provenance and a validated memory catalogue', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vef-init-'));
  try {
    await execFileAsync(process.execPath, ['bin/vef.mjs', 'init', '--dir', dir, '--name', 'Test Project']);
    const names = await readdir(dir);
    assert(names.includes('index.md'));
    assert(names.includes('log.md'));
    assert(names.includes('.vef'));
    assert(names.includes('docs'));
    const docNames = await readdir(join(dir, 'docs'));
    assert(docNames.includes('tasks'));
    assert(docNames.includes('roadmap'));
    assert(docNames.includes('decisions'));
    assert(docNames.includes('vision'));
    assert(!names.includes('INDEX.md'));
    assert(!names.includes('LOG.md'));
    const index = await readFile(join(dir, 'index.md'), 'utf8');
    assert.match(index, /by: "process:vef-init"/);
    assert.doesNotMatch(index, /2026-01-01T00:00:00Z|human:owner/);
    const claude = await readFile(join(dir, 'CLAUDE.md'), 'utf8');
    assert.match(claude, /vef why TASK-001/);
    assert.match(claude, /versioned automation contract/);
    const manifest = JSON.parse(await readFile(join(dir, '.vef', 'storage.json'), 'utf8'));
    assert.deepEqual({ schemaVersion: manifest.schemaVersion, layout: manifest.layout }, { schemaVersion: 1, layout: 'per-item' });
    assert.equal(manifest.canonical.tasks.directory, 'docs/tasks');
    assert.equal(await readFile(join(dir, '.vef', 'transactions', '.gitignore'), 'utf8'), '*\n!.gitignore\n');
    const { stdout: doctorOutput } = await execFileAsync(process.execPath, ['bin/vef.mjs', 'doctor', '--dir', dir]);
    assert.match(doctorOutput, /✓  Claude adapter contract is compatible/);
    assert.match(doctorOutput, /✓  Canonical records and document surfaces align/);
    assert.match(doctorOutput, /CORE ENFORCED/);
    const { stdout: validateOutput } = await execFileAsync(process.execPath, ['bin/vef.mjs', 'validate', '--strict', '--dir', dir]);
    assert.match(validateOutput, /✓  All canonical records and document surfaces align/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('validate and doctor reject a VISION table that omits Architecture', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vef-memory-catalog-'));
  try {
    await execFileAsync(process.execPath, ['bin/vef.mjs', 'init', '--dir', dir, '--name', 'Broken Project']);
    const visionPath = join(dir, 'VISION.md');
    const vision = await readFile(visionPath, 'utf8');
    await writeFile(visionPath, vision.replace(/^\| Architecture \|.*\r?\n/m, ''), 'utf8');

    await assert.rejects(
      execFileAsync(process.execPath, ['bin/vef.mjs', 'validate', '--strict', '--dir', dir]),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stdout, /VISION\.md: missing durable-memory record "Architecture"/);
        return true;
      },
    );
    await assert.rejects(
      execFileAsync(process.execPath, ['bin/vef.mjs', 'doctor', '--dir', dir]),
      (error) => {
        assert.equal(error.code, 1);
        assert.match(error.stdout, /VISION\.md: missing durable-memory record "Architecture"/);
        return true;
      },
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('/apply defaults to read-only untrusted evidence with opt-in classified memory', async () => {
  const pairs = [
    ['.claude/skills/apply/SKILL.md', '.claude/skills/apply/workflow.mjs'],
    ['templates/.claude/skills/apply/SKILL.md', 'templates/.claude/skills/apply/workflow.mjs'],
  ];
  for (const [skillPath, workflowPath] of pairs) {
    const [skill, workflow] = await Promise.all([readFile(skillPath, 'utf8'), readFile(workflowPath, 'utf8')]);
    assert.deepEqual(auditApplyContract({ skill, workflow }), [], `${skillPath} must satisfy the trust contract`);
    const parseableWorkflow = workflow.replace(/^export const meta/m, 'const meta');
    assert.doesNotThrow(
      () => new Function(`return async function workflowHarness() {\n${parseableWorkflow}\n}`),
      `${workflowPath} must remain syntactically valid in its workflow runtime`,
    );
  }
});

test('/apply trust audit rejects legacy unsafe defaults and orphan invention', () => {
  const issues = auditApplyContract({
    skill: '# /apply\n',
    workflow: "const dryRun = flags.dryRun ?? false\nconst sources = flags.sources || ['file', 'memory', 'git']\nFor orphans, create placeholder entries",
  });
  assert(issues.some(issue => issue.includes('default memory and Git on')));
  assert(issues.some(issue => issue.includes('default to write mode')));
  assert(issues.some(issue => issue.includes('placeholder entities')));
});

test('dogfood and install-template /apply adapters stay identical', async () => {
  for (const name of ['SKILL.md', 'workflow.mjs']) {
    const [installed, template] = await Promise.all([
      readFile(join('.claude', 'skills', 'apply', name), 'utf8'),
      readFile(join('templates', '.claude', 'skills', 'apply', name), 'utf8'),
    ]);
    assert.equal(installed, template, `${name} drifted between dogfood and template copies`);
  }
});

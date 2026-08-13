import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { validateItem } from '../src/lib/schemas.mjs';
import { checkBidirectional, findDependencyCycles, findDuplicateIds, findOrphans } from '../src/lib/crosslinks.mjs';
import { auditApplyContract } from '../src/lib/apply-contract.mjs';

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

test('init creates lowercase OKF files with truthful generated provenance', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vef-init-'));
  try {
    await execFileAsync(process.execPath, ['bin/vef.mjs', 'init', '--dir', dir, '--name', 'Test Project']);
    const names = await readdir(dir);
    assert(names.includes('index.md'));
    assert(names.includes('log.md'));
    assert(!names.includes('INDEX.md'));
    assert(!names.includes('LOG.md'));
    const index = await readFile(join(dir, 'index.md'), 'utf8');
    assert.match(index, /by: "process:vef-init"/);
    assert.doesNotMatch(index, /2026-01-01T00:00:00Z|human:owner/);
    const { stdout: doctorOutput } = await execFileAsync(process.execPath, ['bin/vef.mjs', 'doctor', '--dir', dir]);
    assert.match(doctorOutput, /✓  \/apply trust contract/);
    assert.match(doctorOutput, /✓ All checks passed/);
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

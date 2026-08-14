import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import { loadCanonicalDocuments } from '../src/lib/record-store.mjs';
import {
  applyTransaction,
  inspectTransactionState,
  planTransaction,
  recoverTransaction,
  TransactionError,
} from '../src/lib/transactions.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const cli = join(root, 'bin', 'vef.mjs');
const now = '2026-08-14T12:00:00.000Z';
const actor = 'agent/test-suite';

async function project() {
  const directory = await mkdtemp(join(tmpdir(), 'vef-transaction-'));
  await execFileAsync(process.execPath, [cli, 'init', '--dir', directory, '--name', 'Transaction Test']);
  return directory;
}

const graphOperations = () => [
  {
    kind: 'create',
    type: 'vision',
    data: { id: 'durable-memory', title: 'Durable memory', status: 'active', description: 'Keep project intent durable.' },
    body: 'The durable-memory theme.',
  },
  {
    kind: 'create',
    type: 'roadmap',
    data: { id: 'FRAMEWORK-001', title: 'Transactional records', description: 'Make structural writes recoverable.', status: 'In Progress', priority: 'P0' },
    relationships: { vision_theme: 'durable-memory' },
    body: 'The transaction roadmap item.',
  },
  {
    kind: 'create',
    type: 'tasks',
    data: { id: 'TASK-001', title: 'Implement transactions', description: 'Build the mutation engine.', status: 'pending', priority: 'P0' },
    relationships: { roadmap_item: 'FRAMEWORK-001' },
    body: 'The implementation task.',
  },
];

async function installGraph(directory) {
  const plan = await planTransaction(directory, graphOperations(), { now, actor });
  const result = await applyTransaction(plan);
  assert.equal(result.applied, true);
  return plan;
}

function item(loaded, type, id) {
  return loaded.parsedDocs.find((document) => document.docType === type).items.find((candidate) => candidate.data.id === id);
}

test('plans a complete candidate in memory and applies inverse-closed records plus ledgers', async () => {
  const directory = await project();
  try {
    const plan = await planTransaction(directory, graphOperations(), { now, actor });
    assert.deepEqual(plan.changedRecords, ['roadmap:FRAMEWORK-001', 'tasks:TASK-001', 'vision:durable-memory']);
    assert(plan.changes.some((change) => change.path === 'docs/tasks/TASK-001.md'));
    assert(plan.changes.some((change) => change.path === 'TASKS.md'));
    await assert.rejects(access(join(directory, 'docs', 'tasks', 'TASK-001.md')));

    await applyTransaction(plan);
    const loaded = await loadCanonicalDocuments(directory);
    const task = item(loaded, 'tasks', 'TASK-001');
    const roadmap = item(loaded, 'roadmap', 'FRAMEWORK-001');
    const vision = item(loaded, 'vision', 'durable-memory');
    assert.equal(task.data.roadmap_item.id, 'FRAMEWORK-001');
    assert.equal(roadmap.data.related_tasks[0].id, 'TASK-001');
    assert.equal(roadmap.data.vision_theme.id, 'durable-memory');
    assert.equal(vision.data.related_roadmap_items[0].id, 'FRAMEWORK-001');
    assert.deepEqual(task.data.modified, { by: actor, at: now });
    assert.deepEqual(roadmap.data.modified, { by: actor, at: now });
    assert.equal(task.data.last_updated, '2026-08-14');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects an invalid candidate and a stale preview before creating a write journal', async () => {
  const directory = await project();
  try {
    await assert.rejects(
      planTransaction(directory, [{
        kind: 'create',
        type: 'tasks',
        data: { id: 'TASK-001', title: 'Orphan', description: 'Invalid reference.', status: 'pending', priority: 'P1' },
        relationships: { roadmap_item: 'FRAMEWORK-404' },
      }], { now, actor }),
      /No roadmap record found/,
    );
    await installGraph(directory);
    const plan = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { description: 'New description.' } }], { now, actor });
    const taskPath = join(directory, 'docs', 'tasks', 'TASK-001.md');
    await writeFile(taskPath, `${await readFile(taskPath, 'utf8')}\nExternal edit.\n`, 'utf8');
    await assert.rejects(applyTransaction(plan), /candidate is stale/);
    assert.equal((await inspectTransactionState(directory)).unresolved.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('an interrupted write remains visible, blocks all mutations, and rolls back explicitly', async () => {
  const directory = await project();
  try {
    await installGraph(directory);
    const before = await readFile(join(directory, 'docs', 'tasks', 'TASK-001.md'), 'utf8');
    const plan = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { status: 'completed' } }], { now: '2026-08-15T08:00:00.000Z', actor });
    await assert.rejects(
      applyTransaction(plan, { afterWrite: async () => { throw new Error('simulated process interruption'); } }),
      /was not completed/,
    );
    const state = await inspectTransactionState(directory);
    assert.deepEqual(state.unresolved.map(({ id, state: journalState }) => [id, journalState]), [[plan.id, 'unresolved']]);
    await assert.rejects(planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { priority: 'P1' } }]), /blocks planning/);
    await assert.rejects(
      execFileAsync(process.execPath, [cli, 'check', '--dir', directory]),
      (error) => error.code === 1 && /CHECK FAILED/.test(error.stdout),
    );

    const recovery = await execFileAsync(process.execPath, [cli, 'recover', plan.id, '--rollback', '--dir', directory]);
    assert.match(recovery.stdout, /is rolled-back/);
    assert.equal(await readFile(join(directory, 'docs', 'tasks', 'TASK-001.md'), 'utf8'), before);
    assert.equal((await inspectTransactionState(directory)).unresolved.length, 0);
    await execFileAsync(process.execPath, [cli, 'check', '--dir', directory]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('an interrupted multi-file candidate can be rolled forward from hash-verified staged content', async () => {
  const directory = await project();
  try {
    await installGraph(directory);
    const plan = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { status: 'completed' } }], { now: '2026-08-15T08:00:00.000Z', actor });
    let writes = 0;
    await assert.rejects(
      applyTransaction(plan, { afterWrite: async () => { writes += 1; if (writes === 1) throw new Error('stop after first target'); } }),
      /was not completed/,
    );
    const recovery = await recoverTransaction(directory, plan.id, 'forward');
    assert.equal(recovery.state, 'completed');
    const loaded = await loadCanonicalDocuments(directory);
    assert.equal(item(loaded, 'tasks', 'TASK-001').data.status, 'completed');
    await execFileAsync(process.execPath, [cli, 'check', '--dir', directory]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('hard process termination at every target-write boundary leaves a readable recoverable journal', async () => {
  for (let boundary = 1; boundary <= 2; boundary += 1) {
    const directory = await project();
    try {
      await installGraph(directory);
      const plan = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { status: 'completed' } }], { now: '2026-08-15T08:00:00.000Z', actor });
      assert.equal(plan.changes.length, 2, 'fixture must touch the canonical task and its ledger');
      const planPath = join(directory, 'hard-kill-plan.json');
      await writeFile(planPath, JSON.stringify(plan), 'utf8');
      const transactionsUrl = pathToFileURL(join(root, 'src', 'lib', 'transactions.mjs')).href;
      const child = `
        import { readFile } from 'node:fs/promises';
        import { applyTransaction } from '${transactionsUrl}';
        const plan = JSON.parse(await readFile(process.argv[1], 'utf8'));
        const boundary = Number(process.argv[2]);
        await applyTransaction(plan, {
          afterWrite: async ({ index }) => {
            if (index + 1 === boundary) process.exit(86);
          },
        });
      `;
      await assert.rejects(
        execFileAsync(process.execPath, ['--input-type=module', '--eval', child, planPath, String(boundary)]),
        (error) => error.code === 86,
      );
      const state = await inspectTransactionState(directory);
      assert.deepEqual(state.unresolved.map((journal) => journal.state), ['applying']);
      await recoverTransaction(directory, plan.id, boundary === plan.changes.length ? 'forward' : 'rollback');
      await execFileAsync(process.execPath, [cli, 'check', '--dir', directory]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
});

test('lease claims serialize concurrent writers and stale claims do not deadlock OneDrive-style workspaces', async () => {
  const directory = await project();
  try {
    await installGraph(directory);
    const staleRoot = join(directory, '.vef', 'transactions', '_leases');
    await mkdir(staleRoot, { recursive: true });
    await writeFile(join(staleRoot, 'stale.json'), `${JSON.stringify({
      schemaVersion: 1,
      token: 'stale',
      transactionId: 'old',
      pid: 999999,
      host: 'other-host',
      acquiredAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:01:00.000Z',
    })}\n`, 'utf8');

    const firstPlan = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { description: 'First writer.' } }], { now: '2026-08-15T09:00:00.000Z', actor });
    const secondPlan = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { description: 'Second writer.' } }], { now: '2026-08-15T09:00:01.000Z', actor });
    let enterFirstWrite;
    const firstWrite = new Promise((resolve) => { enterFirstWrite = resolve; });
    let continueFirst;
    const gate = new Promise((resolve) => { continueFirst = resolve; });
    const first = applyTransaction(firstPlan, { afterWrite: async ({ index }) => {
      if (index === 0) {
        enterFirstWrite();
        await gate;
      }
    } });
    await firstWrite;
    await assert.rejects(applyTransaction(secondPlan), /Another VEF mutation holds the lease/);
    continueFirst();
    await first;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('successful writes report cleanup failures as warnings and settled debris never blocks the next mutation', async () => {
  const directory = await project();
  try {
    const plan = await planTransaction(directory, graphOperations(), { now, actor });
    const result = await applyTransaction(plan, { cleanupJournal: async () => { throw Object.assign(new Error('locked by sync client'), { code: 'EPERM' }); } });
    assert.equal(result.applied, true);
    assert.match(result.warnings.join('\n'), /cleanup needs attention/);
    const state = await inspectTransactionState(directory);
    assert.equal(state.unresolved.length, 0);
    assert.equal(state.settled.length, 1);
    const next = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { priority: 'P1' } }], { now: '2026-08-15T10:00:00.000Z', actor });
    await applyTransaction(next);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('retries Windows-style busy destination failures without temp-file rename semantics', async () => {
  const directory = await project();
  try {
    const plan = await planTransaction(directory, graphOperations(), { now, actor });
    let attempts = 0;
    const result = await applyTransaction(plan, { targetWriteAttempt: async ({ write }) => {
      attempts += 1;
      if (attempts <= 2) throw Object.assign(new Error('destination busy'), { code: 'EBUSY' });
      await write();
    } });
    assert.equal(result.applied, true);
    assert(attempts > plan.changes.length);
    const transactionFiles = await readFile(join(directory, 'docs', 'tasks', 'TASK-001.md'), 'utf8');
    assert.match(transactionFiles, /Implement transactions/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('idempotent updates produce no writes and invalid state or malformed starting graphs fail preflight', async () => {
  const directory = await project();
  try {
    await installGraph(directory);
    const noOp = await planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { status: 'pending' } }], { now, actor });
    assert.equal(noOp.changes.length, 0);
    assert.equal((await applyTransaction(noOp)).applied, false);
    await assert.rejects(
      planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: { status: 'done-ish' } }], { now, actor }),
      /Invalid status/,
    );

    const roadmapPath = join(directory, 'docs', 'roadmap', 'FRAMEWORK-001.md');
    const roadmap = await readFile(roadmapPath, 'utf8');
    const malformed = roadmap.replace(/related_tasks:\r?\n(?: {2,}.*\r?\n)+/, 'related_tasks: []\n');
    assert.notEqual(malformed, roadmap, 'fixture must remove the inverse task reference');
    await writeFile(roadmapPath, malformed, 'utf8');
    await assert.rejects(
      planTransaction(directory, [{ kind: 'update', id: 'TASK-001', authority: 'frontmatter', set: { priority: 'P1' } }], { now, actor }),
      /Transaction preflight failed/,
    );
    assert.equal((await inspectTransactionState(directory)).unresolved.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('explicit title authority repairs only the named heading/frontmatter mismatch', async () => {
  const directory = await project();
  try {
    await installGraph(directory);
    const taskPath = join(directory, 'docs', 'tasks', 'TASK-001.md');
    const proposalPath = join(directory, 'authority-update.yml');
    await writeFile(proposalPath, '{}\n', 'utf8');

    const original = await readFile(taskPath, 'utf8');
    await writeFile(taskPath, original.replace('# TASK-001 — Implement transactions', '# TASK-001 — Incorrect heading'), 'utf8');
    await assert.rejects(
      planTransaction(directory, [{ kind: 'update', id: 'TASK-001', set: {} }], { now, actor }),
      /Heading title/,
    );
    const frontmatterPreview = await execFileAsync(process.execPath, [
      cli, 'update', 'TASK-001', '--from', proposalPath, '--authority', 'frontmatter', '--dir', directory,
    ]);
    assert.match(frontmatterPreview.stdout, /repair tasks:TASK-001 heading from frontmatter/);
    await execFileAsync(process.execPath, [
      cli, 'update', 'TASK-001', '--from', proposalPath, '--authority', 'frontmatter', '--write', '--dir', directory,
    ]);
    assert.match(await readFile(taskPath, 'utf8'), /# TASK-001 — Implement transactions/);

    const reconciled = await readFile(taskPath, 'utf8');
    await writeFile(taskPath, reconciled.replace('# TASK-001 — Implement transactions', '# TASK-001 — Heading-owned title'), 'utf8');
    await execFileAsync(process.execPath, [
      cli, 'update', 'TASK-001', '--from', proposalPath, '--authority', 'heading', '--write', '--actor', actor, '--dir', directory,
    ]);
    const loaded = await loadCanonicalDocuments(directory);
    assert.equal(item(loaded, 'tasks', 'TASK-001').data.title, 'Heading-owned title');
    assert.equal(item(loaded, 'roadmap', 'FRAMEWORK-001').data.related_tasks[0].name, 'Heading-owned title');
    await execFileAsync(process.execPath, [cli, 'check', '--dir', directory]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('transaction path and journal version checks reject malformed recovery state', async () => {
  const directory = await project();
  try {
    await assert.rejects(
      applyTransaction({ schemaVersion: 1, id: '../escape', projectDir: directory, changes: [{ path: '../escape', beforeHash: null, after: 'x' }] }),
      TransactionError,
    );
    const journal = join(directory, '.vef', 'transactions', 'future');
    await mkdir(journal, { recursive: true });
    await writeFile(join(journal, 'manifest.json'), '{"schemaVersion":99,"id":"future","files":[]}\n', 'utf8');
    await assert.rejects(inspectTransactionState(directory), /Unsupported transaction journal schema/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('create and update CLI commands preview by default and share the transaction writer', async () => {
  const directory = await project();
  try {
    const createProposal = join(directory, 'create-task.yml');
    await writeFile(createProposal, `
id: TASK-001
title: CLI-owned task
description: Created through the transactional command.
status: pending
priority: P1
body: |
  Semantic prose remains authored by the human or agent.
`, 'utf8');
    const preview = await execFileAsync(process.execPath, [cli, 'create', 'task', '--from', createProposal, '--dir', directory]);
    assert.match(preview.stdout, /Preview only — no files were changed/);
    assert.match(preview.stdout, /--- a\/docs\/tasks\/TASK-001\.md/);
    await assert.rejects(access(join(directory, 'docs', 'tasks', 'TASK-001.md')));

    const written = await execFileAsync(process.execPath, [cli, 'create', 'task', '--from', createProposal, '--write', '--actor', 'agent/cli-test', '--dir', directory]);
    assert.match(written.stdout, /wrote 2 validated file/);
    const updateProposal = join(directory, 'update-task.yml');
    await writeFile(updateProposal, `
set:
  status: completed
`, 'utf8');
    await execFileAsync(process.execPath, [cli, 'update', 'TASK-001', '--from', updateProposal, '--write', '--actor', 'agent/cli-test', '--dir', directory]);
    const loaded = await loadCanonicalDocuments(directory);
    const task = item(loaded, 'tasks', 'TASK-001');
    assert.equal(task.data.status, 'completed');
    assert.equal(task.data.modified.by, 'agent/cli-test');
    await execFileAsync(process.execPath, [cli, 'check', '--dir', directory]);

    const help = await execFileAsync(process.execPath, [cli, '--help']);
    assert.match(help.stdout, /create \[options\] <type>/);
    assert.match(help.stdout, /update \[options\] <id>/);
    assert.doesNotMatch(help.stdout, /link <id>|recover <id>/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('batch proposal mode gives adapters one transaction without a canonical serializer', async () => {
  const directory = await project();
  try {
    const proposalPath = join(directory, 'adapter-proposal.json');
    await writeFile(proposalPath, JSON.stringify({ operations: graphOperations() }), 'utf8');
    const preview = await execFileAsync(process.execPath, [cli, 'create', 'batch', '--from', proposalPath, '--dir', directory]);
    assert.match(preview.stdout, /3 record\(s\)/);
    await assert.rejects(access(join(directory, 'docs', 'tasks', 'TASK-001.md')));
    await execFileAsync(process.execPath, [cli, 'create', 'batch', '--from', proposalPath, '--write', '--actor', 'agent/apply', '--dir', directory]);
    const loaded = await loadCanonicalDocuments(directory);
    assert.equal(item(loaded, 'tasks', 'TASK-001').data.roadmap_item.id, 'FRAMEWORK-001');
    assert.equal(item(loaded, 'roadmap', 'FRAMEWORK-001').data.related_tasks[0].id, 'TASK-001');
    await execFileAsync(process.execPath, [cli, 'check', '--dir', directory]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('17-record authoring replay reaches strict integrity on the first transaction pass', async () => {
  const directory = await project();
  try {
    const fixture = JSON.parse(await readFile(join(root, 'test', 'fixtures', 'transaction-authoring-17.json'), 'utf8'));
    assert.equal(fixture.operations.length, 17);
    const plan = await planTransaction(directory, fixture.operations, { now, actor: 'agent/evaluation-replay' });
    assert.equal(plan.changedRecords.length, 17);
    await applyTransaction(plan);
    const check = await execFileAsync(process.execPath, [cli, 'check', '--dir', directory]);
    assert.match(check.stdout, /CHECK PASSED/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

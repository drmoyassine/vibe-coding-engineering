import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const cli = join(process.cwd(), 'bin', 'vef.mjs');
let fixtureDir;

const visionDoc = `# Vision

## Vision theme

---
id: vision-one
title: "Vision theme"
status: active
description: "Customer outcome and durable project context."
related_roadmap_items:
  - id: FRAMEWORK-001
    name: "Queryable project memory"
    url: /ROADMAP.md#FRAMEWORK-001
related_decisions:
  - id: DEC-001
    name: "Adopt deterministic queries"
    url: /DECISIONS.md#DEC-001
---

Users can recover intent without an LLM.
`;

const roadmapDoc = `# Roadmap

## FRAMEWORK-001 — Queryable project memory

---
id: FRAMEWORK-001
title: "Queryable project memory"
description: "Expose the customer outcome through deterministic commands."
status: "In Progress"
priority: P1
vision_theme:
  id: vision-one
  name: "Vision theme"
  url: /VISION.md#vision-one
related_tasks:
  - id: TASK-001
    name: "Implement query commands"
    url: /TASKS.md#TASK-001
related_decisions:
  - id: DEC-001
    name: "Adopt deterministic queries"
    url: /DECISIONS.md#DEC-001
last_updated: 2026-08-13
---

The query layer makes the graph directly useful.
`;

const tasksDoc = `# Tasks

## TASK-001 — Implement query commands

---
id: TASK-001
title: "Implement query commands"
description: "Deliver the customer outcome query interface."
status: pending
priority: P1
roadmap_item:
  id: FRAMEWORK-001
  name: "Queryable project memory"
  url: /ROADMAP.md#FRAMEWORK-001
depends_on: []
related_bugs:
  - id: "42"
    name: "Query output unavailable"
    url: https://github.com/example/project/issues/42
related_decisions:
  - id: DEC-001
    name: "Adopt deterministic queries"
    url: /DECISIONS.md#DEC-001
last_updated: 2026-08-13
---

Implement stable text and JSON output.

---
`;

const decisionsDoc = `# Decisions

## DEC-001 — Adopt deterministic queries

---
id: DEC-001
title: "Adopt deterministic queries"
status: accepted
context: "Project state was only convenient through an agent."
decision: "Expose a deterministic query layer."
rationale: "The customer outcome must remain available without an LLM."
consequences: "Humans and automation receive the same graph interpretation."
related_vision:
  - id: vision-one
    name: "Vision theme"
    url: /VISION.md#vision-one
related_roadmap_items:
  - id: FRAMEWORK-001
    name: "Queryable project memory"
    url: /ROADMAP.md#FRAMEWORK-001
related_tasks:
  - id: TASK-001
    name: "Implement query commands"
    url: /TASKS.md#TASK-001
last_updated: 2026-08-13
---

The CLI is the portable retrieval surface.
`;

async function run(args) {
  return execFileAsync(process.execPath, [cli, ...args, '--dir', fixtureDir], { cwd: process.cwd() });
}

async function runJson(args) {
  const { stdout } = await run([...args, '--json']);
  return { stdout, value: JSON.parse(stdout) };
}

before(async () => {
  fixtureDir = await mkdtemp(join(tmpdir(), 'vef-query-'));
  await Promise.all([
    writeFile(join(fixtureDir, 'VISION.md'), visionDoc),
    writeFile(join(fixtureDir, 'ROADMAP.md'), roadmapDoc),
    writeFile(join(fixtureDir, 'TASKS.md'), tasksDoc),
    writeFile(join(fixtureDir, 'DECISIONS.md'), decisionsDoc),
  ]);
});

after(async () => {
  await rm(fixtureDir, { recursive: true, force: true });
});

test('list provides stable text and versioned filtered JSON', async () => {
  const first = await runJson(['list', 'tasks', '--status', 'PENDING']);
  const second = await runJson(['list', 'tasks', '--status', 'PENDING']);
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.value.schemaVersion, 1);
  assert.equal(first.value.command, 'list');
  assert.deepEqual(first.value.filters, { type: 'tasks', status: 'pending', priority: null });
  assert.deepEqual(first.value.items.map((item) => item.id), ['TASK-001']);

  const { stdout } = await run(['list', 'tasks']);
  assert.match(stdout, /^ID\tTYPE\tSTATUS\tPRIORITY\tTITLE/m);
  assert.match(stdout, /TASK-001\ttasks\tpending\tP1\tImplement query commands/);
});

test('show returns normalized frontmatter and prose without structural separators', async () => {
  const { value } = await runJson(['show', 'TASK-001']);
  assert.equal(value.item.frontmatter.last_updated, '2026-08-13');
  assert.equal(value.item.body, 'Implement stable text and JSON output.');

  const { stdout } = await run(['show', 'tasks:TASK-001']);
  assert.match(stdout, /^TASK-001 — Implement query commands/m);
  assert.match(stdout, /Frontmatter:/);
  assert.match(stdout, /Body:\r?\nImplement stable text and JSON output\./);
});

test('refs exposes typed outgoing, incoming, and external relationships', async () => {
  const { value } = await runJson(['refs', 'TASK-001']);
  assert.deepEqual(value.outgoing.map((edge) => edge.field), ['related_bugs', 'related_decisions', 'roadmap_item']);
  assert.deepEqual(value.incoming.map((edge) => `${edge.source.id}.${edge.field}`), [
    'FRAMEWORK-001.related_tasks',
    'DEC-001.related_tasks',
  ]);
  assert.equal(value.outgoing[0].external, true);
  assert.equal(value.outgoing[0].target.id, '42');

  const outgoingOnly = await runJson(['refs', 'TASK-001', '--direction', 'OUT']);
  assert.equal(outgoingOnly.value.direction, 'out');
  assert.deepEqual(outgoingOnly.value.incoming, []);
});

test('why traverses task to roadmap to vision and includes decisions', async () => {
  const { value } = await runJson(['why', 'TASK-001']);
  assert.deepEqual(new Set(value.nodes.map((node) => node.id)), new Set(['TASK-001', 'FRAMEWORK-001', 'vision-one', 'DEC-001']));
  assert(value.paths.some((path) => path.map((edge) => edge.target.id).join('>') === 'FRAMEWORK-001>vision-one'));
  assert(value.edges.some((edge) => edge.field === 'related_decisions' && edge.target.id === 'DEC-001'));

  const { stdout } = await run(['why', 'TASK-001']);
  assert.match(stdout, /TASK-001 --roadmap_item--> FRAMEWORK-001 --vision_theme--> vision-one/);
  assert.match(stdout, /Decision rationale:\r?\n  DEC-001:/);
});

test('graph includes canonical nodes, typed edges, and external targets', async () => {
  const { value } = await runJson(['graph']);
  assert.equal(value.nodes.filter((node) => !node.external).length, 4);
  const bug = value.nodes.find((node) => node.type === 'bugs' && node.id === '42');
  assert.equal(bug.external, true);
  assert(value.edges.some((edge) => edge.source.id === 'TASK-001' && edge.field === 'roadmap_item' && edge.target.id === 'FRAMEWORK-001'));
});

test('search covers frontmatter and body with deterministic filters', async () => {
  const { value } = await runJson(['search', 'customer outcome', '--type', 'task', '--priority', 'p1']);
  assert.deepEqual(value.items.map((item) => item.id), ['TASK-001']);

  const { stdout } = await run(['search', 'portable retrieval']);
  assert.match(stdout, /DEC-001/);
});

test('query errors are concise and set a failing exit code', async () => {
  await assert.rejects(
    () => run(['show', 'TASK-999']),
    (error) => error.code === 1 && /No project item found with ID "TASK-999"/.test(error.stderr),
  );
  await assert.rejects(
    () => run(['list', 'widgets']),
    (error) => error.code === 1 && /Unknown type "widgets"/.test(error.stderr),
  );
  await assert.rejects(
    () => run(['show', 'TASK-999', '--json']),
    (error) => {
      const failure = JSON.parse(error.stderr);
      return error.code === 1
        && failure.schemaVersion === 1
        && failure.command === 'show'
        && /TASK-999/.test(failure.error.message);
    },
  );
});

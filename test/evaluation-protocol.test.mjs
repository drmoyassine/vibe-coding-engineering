import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { load as loadYaml } from 'js-yaml';

const root = join(process.cwd(), 'docs', 'evaluations', 'inheritance-study-v1');

test('freezes an equivalent, blinded, evidence-gated inheritance protocol before execution', async () => {
  const [protocol, fixtureSource, manifestSource, scorecard] = await Promise.all([
    readFile(join(root, 'protocol.md'), 'utf8'),
    readFile(join(root, 'fixtures.yml'), 'utf8'),
    readFile(join(root, 'run-manifest.example.json'), 'utf8'),
    readFile(join(root, 'scorecard.md'), 'utf8'),
  ]);
  const fixtures = loadYaml(fixtureSource);
  const manifest = JSON.parse(manifestSource);

  assert.equal(fixtures.schema_version, 1);
  assert.deepEqual(Object.keys(fixtures.conditions).sort(), ['control', 'treatment']);
  assert.equal(fixtures.scenarios.length, 3);
  assert.equal(new Set(fixtures.scenarios.map((scenario) => scenario.id)).size, 3);
  for (const scenario of fixtures.scenarios) {
    assert.match(scenario.named_task, /^TASK-\d+$/);
    assert(scenario.decisions.length > 0);
    assert(scenario.roadmap.length > 0);
    assert(scenario.tasks.some((task) => task.id === scenario.named_task && task.status === 'pending'));
    assert(scenario.oracle.required.length >= 3);
    assert(scenario.oracle.forbidden.length >= 3);
  }

  for (const required of [
    /gpt-5\.6-sol/,
    /24 matched pairs/,
    /48 sessions total/,
    /Two independent raters/,
    /10,000 resamples/,
    /confidence interval excluding zero/,
    /cannot establish universal performance/,
    /cannot replace this file/,
  ]) assert.match(protocol, required);

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.agent.priorContext, false);
  assert.equal(manifest.agent.network, false);
  assert.equal(manifest.rerunOf, null);
  assert(Array.isArray(manifest.deviations));
  assert.match(scorecard, /Inherited intent \(0–12\)/);
  assert.match(scorecard, /Task outcome quality \(0–4\)/);
});

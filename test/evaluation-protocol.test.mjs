import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { load as loadYaml } from 'js-yaml';

const root = join(process.cwd(), 'docs', 'evaluations', 'inheritance-study-v1');
const harness = join(process.cwd(), 'scripts', 'evaluation', 'inheritance-v1.mjs');
const exec = promisify(execFile);

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

test('materializes equivalent conditions, freezes balanced assignment, and strips condition labels from rater evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'vef-inheritance-protocol-'));
  try {
    const generated = await exec(process.execPath, [harness, 'generate', '--output', directory], { maxBuffer: 10 * 1024 * 1024 });
    assert.deepEqual(JSON.parse(generated.stdout), { generated: directory, equivalent: true, scenarios: 3, conditions: 2 });
    for (const scenario of ['cache-persistence', 'import-retry', 'privacy-export']) {
      assert.equal(
        await readFile(join(directory, '_reports', `${scenario}.control.json`), 'utf8'),
        await readFile(join(directory, '_reports', `${scenario}.treatment.json`), 'utf8'),
      );
      await access(join(directory, 'treatment', scenario, '.vef', 'storage.json'));
      assert.doesNotMatch(await readFile(join(directory, 'control', scenario, 'AGENTS.md'), 'utf8'), /\bVEF\b|vibe-engineering-framework/i);
    }

    const randomization = JSON.parse(await readFile(join(root, 'randomization.json'), 'utf8'));
    assert.equal(randomization.pairs.length, 24);
    for (const scenario of ['cache-persistence', 'import-retry', 'privacy-export']) {
      const pairs = randomization.pairs.filter((pair) => pair.scenario === scenario);
      assert.equal(pairs.length, 8);
      assert.equal(pairs.filter((pair) => pair.order[0] === 'control').length, 4);
      assert.equal(pairs.filter((pair) => pair.order[0] === 'treatment').length, 4);
    }

    const run = join(directory, 'raw-run');
    const blind = join(directory, 'blind-run');
    await mkdir(run);
    await writeFile(join(run, 'patch.diff'), 'Used VEF and vef update TASK-1 --write\nChanged docs/tasks/TASK-1.md\n', 'utf8');
    await writeFile(join(run, 'final.md'), 'vibe-engineering-framework completed the work.\n', 'utf8');
    await exec(process.execPath, [harness, 'blind', '--run', run, '--output', blind]);
    const blinded = `${await readFile(join(blind, 'patch.diff'), 'utf8')}\n${await readFile(join(blind, 'final.md'), 'utf8')}`;
    assert.doesNotMatch(blinded, /\bVEF\b|vibe-engineering-framework|vef update|docs\/tasks/i);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

import assert from 'node:assert/strict';
import { access, appendFile, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { extractCollectionTemplate, ITEM_MARKER } from '../src/lib/record-store.mjs';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const cli = join(root, 'bin', 'vef.mjs');

async function run(dir, args) {
  return execFileAsync(process.execPath, [cli, ...args, '--dir', dir], { cwd: root });
}

async function legacyFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'vef-legacy-storage-'));
  await cp(join(root, 'templates'), dir, { recursive: true });
  return dir;
}

test('collection extraction ignores item-like headings inside HTML comments', () => {
  const source = `# Tasks\n\n<!--\n## TASK-001 — Example\n-->\n\n## TASK-001 — Real\n\n---\nid: TASK-001\ntitle: Real\ndescription: Real task\nstatus: pending\npriority: P1\nlast_updated: 2026-08-13\n---\n\nCanonical body.\n`;
  const template = extractCollectionTemplate(source);
  assert.match(template, /## TASK-001 — Example/);
  assert.match(template, new RegExp(ITEM_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(template, /Canonical body/);
});

test('doctor distinguishes an uninitialized repository from a legacy consumer', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vef-uninitialized-'));
  try {
    await assert.rejects(
      run(dir, ['doctor']),
      (error) => error.code === 1
        && /VEF structured storage is not initialized/.test(error.stdout)
        && /Run: vef init/.test(error.stdout)
        && !/Legacy monolithic ledgers are still canonical/.test(error.stdout),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor gives legacy consumers an exact, non-destructive storage migration path', async () => {
  const dir = await legacyFixture();
  try {
    await assert.rejects(
      run(dir, ['doctor']),
      (error) => error.code === 1
        && /Legacy monolithic ledgers are still canonical/.test(error.stdout)
        && /vef migrate --apply/.test(error.stdout),
    );

    const { stdout } = await run(dir, ['migrate']);
    assert.match(stdout, /Would extract 1 canonical item file\(s\)/);
    await assert.rejects(access(join(dir, '.vef', 'storage.json')));

    // Legacy queries remain readable during the compatibility window.
    const legacy = await run(dir, ['show', 'DEC-001', '--json']);
    assert.equal(JSON.parse(legacy.stdout).item.file, 'DECISIONS.md');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor --fix performs the complete supported consumer remediation', async () => {
  const dir = await legacyFixture();
  try {
    const { stdout } = await run(dir, ['doctor', '--fix']);
    assert.match(stdout, /Repair preflight passed/);
    assert.match(stdout, /Extracted 1 canonical item file\(s\) under docs\//);
    assert.match(stdout, /Valid: 1   Errors: 0   Warnings: 0/);
    assert.match(stdout, /All checks passed/);
    assert.match(stdout, /Repair complete/);
    await access(join(dir, 'docs', 'decisions', 'DEC-001.md'));
    const manifest = JSON.parse(await readFile(join(dir, '.vef', 'storage.json'), 'utf8'));
    assert.equal(manifest.canonical.decisions.directory, 'docs/decisions');
    await run(dir, ['doctor']);
    const second = await run(dir, ['doctor', '--fix']);
    assert.match(second.stdout, /Per-item storage already enabled/);
    assert.match(second.stdout, /Repair complete/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor --fix preflights the complete durable-memory contract before writes', async () => {
  const dir = await legacyFixture();
  try {
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const customApplySkill = `${await readFile(applySkillPath, 'utf8')}\nConsumer customization.\n`;
    await writeFile(applySkillPath, customApplySkill, 'utf8');
    await rm(join(dir, 'ARCHITECTURE.md'));

    await assert.rejects(
      run(dir, ['doctor', '--fix']),
      (error) => error.code === 1
        && /Repair preflight failed/.test(error.stdout)
        && /ARCHITECTURE\.md/.test(error.stdout),
    );
    await assert.rejects(access(join(dir, '.vef', 'storage.json')));
    assert.equal(await readFile(applySkillPath, 'utf8'), customApplySkill);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor --fix preflight blocks conflicting storage before updating adapters', async () => {
  const dir = await legacyFixture();
  try {
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const customApplySkill = `${await readFile(applySkillPath, 'utf8')}\nConsumer customization.\n`;
    await writeFile(applySkillPath, customApplySkill, 'utf8');
    await mkdir(join(dir, 'docs', 'decisions'), { recursive: true });
    await writeFile(join(dir, 'docs', 'decisions', 'DEC-001.md'), 'conflicting item\n', 'utf8');

    await assert.rejects(
      run(dir, ['doctor', '--fix']),
      (error) => error.code === 1
        && /Repair preflight failed/.test(error.stdout)
        && /no migration or adapter changes were applied/.test(error.stdout),
    );
    await assert.rejects(access(join(dir, '.vef', 'storage.json')));
    assert.equal(await readFile(applySkillPath, 'utf8'), customApplySkill);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('migrate extracts canonical items, preserves public ledgers, and enables strict validation', async () => {
  const dir = await legacyFixture();
  try {
    const { stdout } = await run(dir, ['migrate', '--apply']);
    assert.match(stdout, /Extracted 1 canonical item file\(s\)/);
    assert.match(stdout, /Enabled per-item storage/);

    const manifest = JSON.parse(await readFile(join(dir, '.vef', 'storage.json'), 'utf8'));
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.layout, 'per-item');
    for (const path of [
      'docs/decisions/DEC-001.md',
      'docs/vision/_index.md', 'docs/roadmap/_index.md', 'docs/tasks/_index.md', 'docs/decisions/_index.md',
    ]) await access(join(dir, path));

    const taskLedger = await readFile(join(dir, 'TASKS.md'), 'utf8');
    assert.match(taskLedger, /Generated by VEF from docs\/tasks\//);
    assert.match(taskLedger, /## Task records/);

    const canonical = await run(dir, ['show', 'DEC-001', '--json']);
    assert.equal(JSON.parse(canonical.stdout).item.file, 'docs/decisions/DEC-001.md');
    await run(dir, ['validate', '--strict']);
    const doctor = await run(dir, ['doctor']);
    assert.match(doctor.stdout, /Canonical items and generated ledgers agree/);
    assert.match(doctor.stdout, /All checks passed/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor upgrades the retired root-directory layout into docs/', async () => {
  const dir = await legacyFixture();
  try {
    await run(dir, ['migrate', '--apply']);
    for (const type of ['vision', 'roadmap', 'tasks', 'decisions']) {
      await rename(join(dir, 'docs', type), join(dir, type));
      const ledger = `${type === 'vision' ? 'VISION' : type === 'roadmap' ? 'ROADMAP' : type === 'tasks' ? 'TASKS' : 'DECISIONS'}.md`;
      const content = await readFile(join(dir, ledger), 'utf8');
      await writeFile(
        join(dir, ledger),
        content.replace(
          `Generated by VEF from docs/${type}/. Edit canonical item files and docs/${type}/_index.md`,
          `Generated by VEF from ${type}/. Edit canonical item files and ${type}/_index.md`,
        ),
        'utf8',
      );
    }
    await rm(join(dir, 'docs'), { recursive: true, force: true });
    const manifestPath = join(dir, '.vef', 'storage.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    for (const type of ['vision', 'roadmap', 'tasks', 'decisions']) manifest.canonical[type].directory = type;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await appendFile(join(dir, 'DECISIONS.md'), '\nStale retired projection.\n', 'utf8');

    await assert.rejects(
      run(dir, ['doctor']),
      (error) => error.code === 1
        && /retired root-directory layout/.test(error.stdout)
        && /vef migrate --apply --update-adapters/.test(error.stdout),
    );
    const preview = await run(dir, ['migrate']);
    assert.match(preview.stdout, /Would relocate 1 canonical item file\(s\)/);
    const fixed = await run(dir, ['doctor', '--fix']);
    assert.match(fixed.stdout, /Relocated 1 canonical item file\(s\) under docs\//);
    assert.match(fixed.stdout, /Repair complete/);

    await access(join(dir, 'docs', 'decisions', 'DEC-001.md'));
    await assert.rejects(access(join(dir, 'decisions')));
    await run(dir, ['validate', '--strict']);
    await run(dir, ['doctor']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('explicit adapter upgrade brings a legacy consumer onto the per-item write contract', async () => {
  const dir = await legacyFixture();
  try {
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const applyWorkflowPath = join(dir, '.claude', 'skills', 'apply', 'workflow.mjs');
    await writeFile(applySkillPath, (await readFile(applySkillPath, 'utf8')).replace('vef project --dir <staging-directory>', 'legacy projection step'), 'utf8');
    await writeFile(applyWorkflowPath, (await readFile(applyWorkflowPath, 'utf8')).replaceAll('proposedItemFiles', 'proposedDocuments').replace('itemFilename(entry.id)', 'entry.id'), 'utf8');

    await assert.rejects(
      run(dir, ['doctor']),
      (error) => error.code === 1 && /Run: vef migrate --apply --update-adapters/.test(error.stdout),
    );

    const upgraded = await run(dir, ['migrate', '--apply', '--update-adapters']);
    assert.match(upgraded.stdout, /\/apply \(updated\)/);
    assert.match(upgraded.stdout, /Skills updated: 5/);
    const workflow = await readFile(applyWorkflowPath, 'utf8');
    assert.match(workflow, /proposedItemFiles/);
    assert.match(workflow, /itemFilename\(entry\.id\)/);
    assert.doesNotMatch(workflow, /proposedDocuments/);
    await run(dir, ['doctor']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('validation rejects ledger drift and project repairs only the derived ledger', async () => {
  const dir = await legacyFixture();
  try {
    await run(dir, ['migrate', '--apply']);
    const canonicalPath = join(dir, 'docs', 'decisions', 'DEC-001.md');
    const beforeCanonical = await readFile(canonicalPath, 'utf8');
    await appendFile(join(dir, 'DECISIONS.md'), '\nHand-edited generated content.\n', 'utf8');

    await assert.rejects(
      run(dir, ['validate', '--strict']),
      (error) => error.code === 1 && /DECISIONS\.md is missing or stale; run vef project/.test(error.stdout),
    );
    await assert.rejects(
      run(dir, ['project', '--check']),
      (error) => error.code === 1 && /DECISIONS\.md is stale/.test(error.stdout),
    );

    const projected = await run(dir, ['project']);
    assert.match(projected.stdout, /DECISIONS\.md regenerated/);
    assert.equal(await readFile(canonicalPath, 'utf8'), beforeCanonical);
    await run(dir, ['validate', '--strict']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('partial or conflicting migrations fail without activating the new storage layout', async () => {
  const dir = await legacyFixture();
  try {
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const customApplySkill = `${await readFile(applySkillPath, 'utf8')}\nConsumer customization.\n`;
    await writeFile(applySkillPath, customApplySkill, 'utf8');
    await mkdir(join(dir, 'docs', 'decisions'), { recursive: true });
    await writeFile(join(dir, 'docs', 'decisions', 'DEC-001.md'), 'conflicting item\n', 'utf8');
    await assert.rejects(
      run(dir, ['migrate', '--apply', '--update-adapters']),
      (error) => error.code === 1 && /conflicts with the ledger-derived candidate/.test(error.stdout),
    );
    await assert.rejects(access(join(dir, '.vef', 'storage.json')));
    assert.equal(await readFile(applySkillPath, 'utf8'), customApplySkill);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

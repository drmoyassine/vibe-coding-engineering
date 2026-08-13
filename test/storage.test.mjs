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
        && /Adopt: vef init/.test(error.stdout)
        && /NOT ADOPTED/.test(error.stdout)
        && !/Legacy monolithic ledgers are still canonical/.test(error.stdout),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor classifies a coherent legacy consumer as structurally repairable', async () => {
  const dir = await legacyFixture();
  try {
    await assert.rejects(
      run(dir, ['doctor']),
      (error) => error.code === 1
        && /Legacy monolithic ledgers are still canonical/.test(error.stdout)
        && /STRUCTURALLY REPAIRABLE/.test(error.stdout)
        && /vef doctor --fix/.test(error.stdout),
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
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const existingApplySkill = await readFile(applySkillPath, 'utf8');
    await rm(join(dir, '.claude', 'skills', 'bugs'), { recursive: true, force: true });
    const { stdout } = await run(dir, ['doctor', '--fix']);
    assert.match(stdout, /Core repair preflight passed/);
    assert.match(stdout, /Existing consumer adapters are protected from overwrite/);
    assert.match(stdout, /Extracted 1 canonical item file\(s\) under docs\//);
    assert.match(stdout, /Valid: 1   Errors: 0   Warnings: 0/);
    assert.match(stdout, /CORE ENFORCED/);
    assert.match(stdout, /Core repair complete/);
    assert.match(stdout, /\/bugs \(installed\)/);
    assert.equal(await readFile(applySkillPath, 'utf8'), existingApplySkill);
    await access(join(dir, '.claude', 'skills', 'bugs', 'SKILL.md'));
    await access(join(dir, 'docs', 'decisions', 'DEC-001.md'));
    const manifest = JSON.parse(await readFile(join(dir, '.vef', 'storage.json'), 'utf8'));
    assert.equal(manifest.canonical.decisions.directory, 'docs/decisions');
    await run(dir, ['doctor']);
    const second = await run(dir, ['doctor', '--fix']);
    assert.match(second.stdout, /Per-item storage already enabled/);
    assert.match(second.stdout, /Core repair complete/);
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
        && /Core repair preflight failed; no files were changed/.test(error.stdout)
        && /ARCHITECTURE\.md/.test(error.stdout),
    );
    await assert.rejects(access(join(dir, '.vef', 'storage.json')));
    assert.equal(await readFile(applySkillPath, 'utf8'), customApplySkill);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor --fix preflight blocks conflicting storage without touching adapters', async () => {
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
        && /Core repair preflight failed; no files were changed/.test(error.stdout),
    );
    await assert.rejects(access(join(dir, '.vef', 'storage.json')));
    assert.equal(await readFile(applySkillPath, 'utf8'), customApplySkill);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor --fix reports unresolved meaning and makes no structural or adapter changes', async () => {
  const dir = await legacyFixture();
  try {
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const customApplySkill = `${await readFile(applySkillPath, 'utf8')}\nConsumer customization.\n`;
    await writeFile(applySkillPath, customApplySkill, 'utf8');
    await appendFile(join(dir, 'ROADMAP.md'), `
## FRAMEWORK-001 — Missing vision relationship

---
id: FRAMEWORK-001
title: Missing vision relationship
description: A structurally valid record whose declared meaning is unresolved
status: In Progress
priority: P1
vision_theme:
  id: missing-vision-theme
  name: Missing vision theme
  url: /VISION.md#missing-vision-theme
related_tasks: []
related_decisions: []
last_updated: 2026-08-13
---

This item intentionally references a vision theme that does not exist.
`, 'utf8');

    await assert.rejects(
      run(dir, ['doctor', '--fix']),
      (error) => error.code === 1
        && /Core repair preflight failed; no files were changed/.test(error.stdout)
        && /FRAMEWORK-001 → missing-vision-theme \(missing vision target in vision_theme\)/.test(error.stdout)
        && /Reconcile project meaning/.test(error.stdout),
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
    assert.match(doctor.stdout, /CORE ENFORCED/);
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
        && /vef doctor --fix/.test(error.stdout),
    );
    const preview = await run(dir, ['migrate']);
    assert.match(preview.stdout, /Would relocate 1 canonical item file\(s\)/);
    const fixed = await run(dir, ['doctor', '--fix']);
    assert.match(fixed.stdout, /Relocated 1 canonical item file\(s\) under docs\//);
    assert.match(fixed.stdout, /Core repair complete/);

    await access(join(dir, 'docs', 'decisions', 'DEC-001.md'));
    await assert.rejects(access(join(dir, 'decisions')));
    await run(dir, ['validate', '--strict']);
    await run(dir, ['doctor']);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor --fix enforces the core while preserving customized adapters byte-for-byte', async () => {
  const dir = await legacyFixture();
  try {
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const applyWorkflowPath = join(dir, '.claude', 'skills', 'apply', 'workflow.mjs');
    const customSkill = (await readFile(applySkillPath, 'utf8')).replace('vef project --dir <staging-directory>', 'consumer projection step');
    const customWorkflow = (await readFile(applyWorkflowPath, 'utf8')).replaceAll('proposedItemFiles', 'consumerDocuments').replace('itemFilename(entry.id)', 'entry.id');
    await writeFile(applySkillPath, customSkill, 'utf8');
    await writeFile(applyWorkflowPath, customWorkflow, 'utf8');

    await assert.rejects(
      run(dir, ['doctor']),
      (error) => error.code === 1
        && /STRUCTURALLY REPAIRABLE/.test(error.stdout)
        && /ADAPTER ATTENTION REQUIRED/.test(error.stdout),
    );

    const fixed = await run(dir, ['doctor', '--fix']);
    assert.match(fixed.stdout, /CORE ENFORCED/);
    assert.match(fixed.stdout, /ADAPTER ATTENTION REQUIRED/);
    assert.equal(await readFile(applySkillPath, 'utf8'), customSkill);
    assert.equal(await readFile(applyWorkflowPath, 'utf8'), customWorkflow);

    const healthyCore = await run(dir, ['doctor']);
    assert.match(healthyCore.stdout, /CORE ENFORCED/);
    assert.match(healthyCore.stdout, /ADAPTER ATTENTION REQUIRED/);

    await assert.rejects(
      run(dir, ['migrate', '--apply', '--update-adapters']),
      (error) => error.code === 1
        && /--update-adapters is retired/.test(error.stdout)
        && /No files were changed/.test(error.stdout),
    );
    assert.equal(await readFile(applySkillPath, 'utf8'), customSkill);
    assert.equal(await readFile(applyWorkflowPath, 'utf8'), customWorkflow);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('doctor --fix fills absent adapter files without overwriting a partial adapter', async () => {
  const dir = await legacyFixture();
  try {
    const applySkillPath = join(dir, '.claude', 'skills', 'apply', 'SKILL.md');
    const applyWorkflowPath = join(dir, '.claude', 'skills', 'apply', 'workflow.mjs');
    const customWorkflow = `${await readFile(applyWorkflowPath, 'utf8')}\n// Consumer-owned partial adapter.\n`;
    await writeFile(applyWorkflowPath, customWorkflow, 'utf8');
    await rm(applySkillPath);

    const fixed = await run(dir, ['doctor', '--fix']);
    assert.match(fixed.stdout, /\/apply \(installed\)/);
    assert.match(fixed.stdout, /CORE ENFORCED/);
    await access(applySkillPath);
    assert.equal(await readFile(applyWorkflowPath, 'utf8'), customWorkflow);
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
      run(dir, ['migrate', '--apply']),
      (error) => error.code === 1 && /conflicts with the ledger-derived candidate/.test(error.stdout),
    );
    await assert.rejects(access(join(dir, '.vef', 'storage.json')));
    assert.equal(await readFile(applySkillPath, 'utf8'), customApplySkill);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

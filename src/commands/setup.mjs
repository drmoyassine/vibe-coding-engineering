/**
 * `vef setup` is the only normal lifecycle write command.
 *
 * It initializes a clean adoption, upgrades mechanically repairable legacy
 * storage, refreshes missing optional adapters without overwriting consumer
 * files, projects ledgers, validates strictly, and finishes with enforcement
 * status. Semantic ambiguity always stops before a write.
 */

import { createRequire } from 'node:module';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { doctorCommand, doctorFixCommand, inspectCore } from './doctor.mjs';
import { initCommand, planInitialization } from './init.mjs';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json');
const MANAGED_CI_MARKER = '# Managed by VEF. Re-run the latest `vef setup` to refresh this workflow.';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function enforcementWorkflow() {
  return `${MANAGED_CI_MARKER}
name: VEF enforcement

on:
  push:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '24'
      - run: npx --yes vibe-engineering-framework@${version} check
`;
}

async function detectGithub(targetDir, github) {
  if (github) return true;
  if (await exists(join(targetDir, '.github'))) return true;
  const gitConfig = join(targetDir, '.git', 'config');
  if (!(await exists(gitConfig))) return false;
  return /github\.com[/:]/i.test(await readFile(gitConfig, 'utf8'));
}

async function findExistingEnforcement(targetDir) {
  const workflowsDir = join(targetDir, '.github', 'workflows');
  if (!(await exists(workflowsDir))) return null;
  const entries = await readdir(workflowsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) continue;
    const path = join(workflowsDir, entry.name);
    const content = await readFile(path, 'utf8');
    const runsOnChange = /^\s*(push|pull_request):/m.test(content);
    const enforcesVef = /\bvef check\b|vibe-engineering-framework@[^\s]+\s+check|vef validate --strict|npm run (?:vef:check|release:check)/i.test(content);
    if (runsOnChange && enforcesVef) {
      return { path, content };
    }
  }
  return null;
}

async function deployEnforcement(targetDir, github) {
  if (!(await detectGithub(targetDir, github))) {
    const command = `npx --yes vibe-engineering-framework@${version} check`;
    console.log('  ○ CI NOT AUTO-DETECTED — core enforcement is complete locally.');
    console.log(`    Add this single command to the repository's CI: ${command}`);
    return { status: 'portable-command', command };
  }

  const existing = await findExistingEnforcement(targetDir);
  if (existing && !existing.content.startsWith(MANAGED_CI_MARKER)) {
    console.log(`  ✓ CI ENFORCEMENT DETECTED — preserved ${existing.path}`);
    return { status: 'existing', path: existing.path };
  }

  const workflowPath = existing?.path || join(targetDir, '.github', 'workflows', 'vef.yml');
  const workflow = enforcementWorkflow();
  if (existing?.content === workflow) {
    console.log(`  ✓ CI ENFORCEMENT CURRENT — ${workflowPath}`);
    return { status: 'current', path: workflowPath };
  }

  if (!existing && await exists(workflowPath)) {
    console.log(`  ⚠ CI WORKFLOW PRESERVED — ${workflowPath} is consumer-owned and was not changed.`);
    console.log(`    Ensure it runs: npx --yes vibe-engineering-framework@${version} check`);
    return { status: 'attention', path: workflowPath };
  }

  await mkdir(dirname(workflowPath), { recursive: true });
  await writeFile(workflowPath, workflow, 'utf8');
  console.log(`  ✓ CI ENFORCEMENT ${existing ? 'UPDATED' : 'DEPLOYED'} — ${workflowPath}`);
  return { status: existing ? 'updated' : 'deployed', path: workflowPath };
}

function printBlockedInitialization(plan) {
  console.log('\n  SETUP BLOCKED — existing framework-surface files require reconciliation.');
  console.log('  No files were changed. VEF will not overwrite or guess the meaning of:');
  for (const path of plan.blockingConflicts) console.log(`    • ${path}`);
  console.log('\n  Reconcile these surfaces directly or with /apply, then rerun vef setup.\n');
}

/** @param {{ dir: string, name?: string, github?: string }} opts */
export async function setupCommand(opts) {
  const targetDir = opts.dir;
  console.log(`\n  VEF setup: ${targetDir}`);
  console.log('  One lifecycle: initialize or upgrade → repair → project → validate → enforce.');

  const core = await inspectCore(targetDir);

  if (core.state === 'NOT_ADOPTED') {
    const plan = await planInitialization(opts);
    if (!plan.ready) {
      printBlockedInitialization(plan);
      process.exitCode = 1;
      return { ok: false, phase: 'initialization-preflight', core, plan };
    }

    console.log('\n  No VEF state detected; creating a non-destructive initial project model.');
    await initCommand({ ...opts, force: false });
    const health = await doctorCommand({ dir: targetDir, fix: false, quiet: true });
    const ci = health.ok ? await deployEnforcement(targetDir, opts.github) : null;
    if (health.ok) console.log('  ✓ SETUP COMPLETE — VEF CORE ENFORCED\n');
    return { ok: health.ok, phase: 'initialized', health, ci };
  }

  if (core.state === 'SEMANTIC_RECONCILIATION_REQUIRED') {
    await doctorCommand({ dir: targetDir, fix: false });
    console.log('  SETUP PAUSED — reconcile the reported project meaning, then rerun vef setup.');
    console.log('  No structural repair was attempted.\n');
    process.exitCode = 1;
    return { ok: false, phase: 'semantic-reconciliation', core };
  }

  if (core.state === 'TRANSACTION_RECOVERY_REQUIRED') {
    await doctorCommand({ dir: targetDir, fix: false });
    console.log('  SETUP PAUSED — explicitly recover the unresolved transaction before any lifecycle write.\n');
    process.exitCode = 1;
    return { ok: false, phase: 'transaction-recovery', core };
  }

  const repaired = await doctorFixCommand({ dir: targetDir, fix: true, lifecycle: true });
  const ci = repaired.ok ? await deployEnforcement(targetDir, opts.github) : null;
  if (repaired.ok) console.log('  ✓ SETUP COMPLETE — VEF CORE ENFORCED\n');
  return { ...repaired, phase: repaired.ok ? 'enforced' : repaired.phase, ci };
}

/**
 * doctor.mjs — `vef doctor` and explicitly authorized `vef doctor --fix`.
 *
 * Core project-memory enforcement and optional agent-adapter compatibility
 * are deliberately reported as separate dimensions. VEF never overwrites an
 * existing consumer adapter.
 */

import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { auditApplyContract } from '../lib/apply-contract.mjs';
import { auditMemoryCatalogDirectory } from '../lib/memory-catalog.mjs';
import { loadCanonicalDocuments, planStorageMigration, projectLedgers, STORAGE_MANIFEST } from '../lib/record-store.mjs';
import { ensureTransactionRuntime, inspectTransactionState } from '../lib/transactions.mjs';
import { migrateCommand } from './migrate.mjs';
import { validateCommand } from './validate.mjs';

const CORE_DOCUMENTS = ['VISION.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'TASKS.md', 'DECISIONS.md', 'log.md', 'index.md'];
const CLAUDE_SKILLS = ['apply', 'tasks', 'roadmap', 'decisions', 'bugs', 'infrastructure'];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function inspectAdapters(targetDir) {
  const presence = [];
  for (const skill of CLAUDE_SKILLS) {
    presence.push({ skill, present: await exists(join(targetDir, '.claude', 'skills', skill, 'SKILL.md')) });
  }
  const installed = presence.filter((entry) => entry.present).length;
  const trustIssues = [];
  const applySkillPath = join(targetDir, '.claude', 'skills', 'apply', 'SKILL.md');
  const applyWorkflowPath = join(targetDir, '.claude', 'skills', 'apply', 'workflow.mjs');
  const applySkillExists = await exists(applySkillPath);
  const applyWorkflowExists = await exists(applyWorkflowPath);
  if (applySkillExists && applyWorkflowExists) {
    const [skill, workflow] = await Promise.all([
      readFile(applySkillPath, 'utf8'),
      readFile(applyWorkflowPath, 'utf8'),
    ]);
    trustIssues.push(...auditApplyContract({ skill, workflow }));
  } else if (applySkillExists || applyWorkflowExists) {
    trustIssues.push('/apply is partially installed (SKILL.md and workflow.mjs are both required)');
  }

  const claudePath = join(targetDir, 'CLAUDE.md');
  const claudeExists = await exists(claudePath);
  let claudeIntegrated = false;
  if (claudeExists) {
    const content = await readFile(claudePath, 'utf8');
    claudeIntegrated = (content.includes('/apply') || content.toLowerCase().includes('skills'))
      && content.includes('TASKS.md')
      && content.includes('DECISIONS.md');
  }

  let status = 'NOT_INSTALLED';
  if (installed > 0 || claudeExists) {
    status = installed === CLAUDE_SKILLS.length && trustIssues.length === 0 && claudeIntegrated
      ? 'COMPATIBLE'
      : 'ATTENTION_REQUIRED';
  }
  return { status, presence, installed, trustIssues, claudeExists, claudeIntegrated };
}

export async function inspectCore(targetDir) {
  const documentPresence = [];
  for (const doc of CORE_DOCUMENTS) documentPresence.push({ doc, present: await exists(join(targetDir, doc)) });
  const missingDocuments = documentPresence.filter((entry) => !entry.present).map((entry) => entry.doc);
  const canonical = await loadCanonicalDocuments(targetDir);
  const transactionState = await inspectTransactionState(targetDir);
  const memoryIssues = await auditMemoryCatalogDirectory(targetDir);
  const validation = await validateCommand({ dir: targetDir, strict: true, quiet: true, setExitCode: false });
  const needsReviewCount = canonical.parsedDocs
    .flatMap((doc) => doc.items)
    .filter((item) => item.data?.needsReview === true).length;

  const semanticIssues = validation.issues.filter((issue) => ['schema', 'crosslinks'].includes(issue.scope));
  const semanticValidationErrors = semanticIssues.filter((issue) => issue.level === 'error').length;
  const semanticWarnings = semanticIssues.filter((issue) => issue.level === 'warning').length;
  const invalidStorage = ['invalid', 'legacy-incomplete', 'legacy-partial'].includes(canonical.storage.mode);

  let state;
  if (canonical.storage.mode === 'uninitialized') {
    state = 'NOT_ADOPTED';
  } else if (transactionState.unresolved.length > 0) {
    state = 'TRANSACTION_RECOVERY_REQUIRED';
  } else if (transactionState.leases.blocking.length > 0) {
    state = 'LEASE_RECOVERY_REQUIRED';
  } else if (
    missingDocuments.length > 0
    || memoryIssues.length > 0
    || canonical.storageIssues.length > 0
    || semanticValidationErrors > 0
    || semanticWarnings > 0
    || needsReviewCount > 0
    || invalidStorage
  ) {
    state = 'SEMANTIC_RECONCILIATION_REQUIRED';
  } else if (canonical.storage.mode !== 'per-item' || canonical.projectionIssues.length > 0) {
    state = 'STRUCTURALLY_REPAIRABLE';
  } else {
    state = 'CORE_ENFORCED';
  }

  return {
    state,
    documentPresence,
    missingDocuments,
    canonical,
    memoryIssues,
    validation,
    semanticIssues,
    semanticValidationErrors,
    semanticWarnings,
    needsReviewCount,
    transactionState,
  };
}

function printStorage(core, log = console.log) {
  const { canonical } = core;
  log('\n  ── Canonical storage ──');
  if (canonical.storage.mode === 'per-item') {
    log(`  ✓  Per-item records enabled by ${STORAGE_MANIFEST}`);
    for (const issue of canonical.storageIssues) log(`  ✗  ${issue}`);
    for (const issue of canonical.projectionIssues) log(`  ✗  ${issue}`);
    if (canonical.storageIssues.length === 0 && canonical.projectionIssues.length === 0) {
      log('  ✓  Canonical items and generated ledgers agree');
    } else if (canonical.projectionIssues.length > 0) {
      log('     Repair: vef setup');
    }
  } else if (canonical.storage.mode === 'per-item-root') {
    log('  ⚠  Canonical records use the retired root-directory layout');
    log('     Repair: vef setup');
  } else if (canonical.storage.mode === 'legacy') {
    log('  ⚠  Legacy monolithic ledgers are still canonical');
    log('     Repair: vef setup');
  } else if (canonical.storage.mode === 'uninitialized') {
    log('  ✗  VEF structured storage is not initialized');
    log('     Adopt: vef setup');
  } else if (canonical.storage.mode === 'legacy-incomplete') {
    log(`  ✗  Incomplete legacy document set (${canonical.storage.legacyLedgers.join(', ')})`);
  } else if (canonical.storage.mode === 'legacy-partial') {
    log(`  ✗  Conflicting partial storage detected (${canonical.storage.partialDirectories.join(', ')})`);
  } else {
    for (const issue of [...canonical.storage.issues, ...canonical.storageIssues]) log(`  ✗  ${issue}`);
  }
}

function printAdapters(adapters, log = console.log) {
  log('\n  ── Agent adapters (optional integration) ──');
  for (const entry of adapters.presence) log(`  ${entry.present ? '✓' : '○'}  /${entry.skill}${entry.present ? ' (consumer-owned; preserved)' : ''}`);
  if (adapters.status === 'COMPATIBLE') {
    log('  ✓  Claude adapter contract is compatible');
  } else if (adapters.status === 'NOT_INSTALLED') {
    log('  ○  Claude adapters are not installed; core enforcement is unaffected');
  } else {
    log('  ⚠  Adapter attention required; core enforcement is reported separately');
    for (const issue of adapters.trustIssues) log(`     ${issue}`);
    if (adapters.claudeExists && !adapters.claudeIntegrated) log('     CLAUDE.md does not reference the installed adapter/document contract');
    log('     Existing adapter files will never be overwritten by VEF. Reconcile them through review.');
  }
}

/** @param {{ dir: string, fix?: boolean }} opts */
export async function doctorCommand(opts) {
  if (opts.fix) return doctorFixCommand(opts);

  const targetDir = opts.dir;
  const log = opts.quiet ? () => {} : console.log;
  const [core, adapters] = await Promise.all([inspectCore(targetDir), inspectAdapters(targetDir)]);
  log(`\n  Health check: ${targetDir}\n`);

  log('  ── Transaction recovery ──');
  if (core.transactionState.unresolved.length === 0) log('  ✓  No unresolved mutation journal');
  else {
    for (const journal of core.transactionState.unresolved) {
      log(`  ✗  ${journal.id} is ${journal.state}; run vef recover ${journal.id} --rollback or --forward`);
    }
  }
  if (core.transactionState.settled.length > 0) log(`  ⚠  ${core.transactionState.settled.length} settled journal(s) remain as harmless cleanup debris`);
  const leaseFamilies = core.transactionState.leases.families;
  if (leaseFamilies.length === 0) log('  ✓  No writer lease debris');
  for (const lease of leaseFamilies) {
    const detail = lease.transactionId ? ` (${lease.transactionId})` : '';
    if (lease.state === 'active') {
      log(`  ○  ${lease.family}: active${detail}; wait for the writer to finish`);
    } else if (lease.state === 'malformed') {
      log(`  ✗  ${lease.family}: malformed — ${lease.reason}`);
      log('     Recovery: confirm no writer is active, then run vef recover leases');
    } else if (lease.state === 'quarantined') {
      log(`  ⚠  ${lease.family}: quarantined; ownership is disabled and debris is harmless`);
    } else if (lease.state === 'settled') {
      log(`  ○  ${lease.family}: settled; retained additive marker protects against sync resurrection`);
    } else {
      log(`  ⚠  ${lease.family}: ${lease.state} — ${lease.reason}; run vef recover leases or allow the next mutation to sweep it`);
    }
  }

  log('  ── Core documents ──');
  for (const entry of core.documentPresence) log(`  ${entry.present ? '✓' : '✗'}  ${entry.doc}`);
  printStorage(core, log);

  log('\n  ── Durable-memory catalogue ──');
  if (core.memoryIssues.length === 0) log('  ✓  Canonical records and document surfaces align');
  else for (const issue of core.memoryIssues) log(`  ✗  ${issue.surface}: ${issue.message}`);

  log('\n  ── Strict integrity ──');
  if (core.semanticIssues.length === 0) {
    log(`  ✓  ${core.validation.valid} canonical record(s) are semantically coherent`);
  } else {
    log(`  ✗  ${core.semanticValidationErrors} semantic error(s), ${core.semanticWarnings} semantic warning(s)`);
    for (const issue of core.semanticIssues) log(`     ${issue.level === 'error' ? '✗' : '⚠'} ${issue.message}`);
    log('     Reconcile these records, then rerun vef setup');
  }

  log('\n  ── Review state ──');
  if (core.needsReviewCount === 0) log('  ✓  No items flagged needsReview');
  else log(`  ✗  ${core.needsReviewCount} item(s) flagged needsReview`);

  printAdapters(adapters, log);

  log('\n  ── Enforcement status ──');
  const stateMessage = {
    NOT_ADOPTED: 'NOT ADOPTED — run vef setup',
    TRANSACTION_RECOVERY_REQUIRED: 'TRANSACTION RECOVERY REQUIRED — choose explicit roll-forward or rollback before any further write',
    LEASE_RECOVERY_REQUIRED: 'LEASE RECOVERY REQUIRED — confirm no writer is active, then run vef recover leases',
    SEMANTIC_RECONCILIATION_REQUIRED: 'SEMANTIC RECONCILIATION REQUIRED — VEF will not invent or overwrite project meaning',
    STRUCTURALLY_REPAIRABLE: 'STRUCTURALLY REPAIRABLE — run vef setup',
    CORE_ENFORCED: 'CORE ENFORCED — canonical project memory satisfies the deterministic contract',
  }[core.state];
  log(`  ${core.state === 'CORE_ENFORCED' ? '✓' : core.state === 'STRUCTURALLY_REPAIRABLE' ? '⚠' : '✗'}  ${stateMessage}`);
  if (adapters.status === 'ATTENTION_REQUIRED') log('  ⚠  ADAPTER ATTENTION REQUIRED (does not invalidate core enforcement)');
  else if (adapters.status === 'COMPATIBLE') log('  ✓  ADAPTER COMPATIBLE');
  else log('  ○  ADAPTER NOT INSTALLED (optional)');
  log('');

  const ok = core.state === 'CORE_ENFORCED';
  if (!ok) process.exitCode = 1;
  return { ok, core, adapters };
}

/** Explicit write authorization over deterministic, non-destructive repairs. */
export async function doctorFixCommand(opts) {
  const targetDir = opts.dir;
  console.log(`\n  Repairing VEF core: ${targetDir}\n`);

  const [core, plan] = await Promise.all([inspectCore(targetDir), planStorageMigration(targetDir)]);
  const preflightIssues = [...plan.issues];
  for (const doc of core.missingDocuments) preflightIssues.push(`Missing required document ${doc}`);
  for (const issue of core.memoryIssues) preflightIssues.push(`${issue.surface}: ${issue.message}`);
  for (const issue of core.semanticIssues) preflightIssues.push(issue.message);
  if (core.needsReviewCount > 0) preflightIssues.push(`${core.needsReviewCount} item(s) are flagged needsReview`);

  const uniqueIssues = [...new Set(preflightIssues)];
  if (!plan.ready || core.state === 'NOT_ADOPTED' || core.state === 'TRANSACTION_RECOVERY_REQUIRED' || core.state === 'SEMANTIC_RECONCILIATION_REQUIRED' || uniqueIssues.length > 0) {
    console.log('  ✗  Core repair preflight failed; no files were changed:');
    for (const issue of uniqueIssues) console.log(`     • ${issue}`);
    if (core.state === 'NOT_ADOPTED') console.log('     Run vef setup for a repository that has not adopted VEF yet.');
    else console.log('     Reconcile project meaning, then rerun vef setup.');
    process.exitCode = 1;
    return { ok: false, phase: 'preflight', core };
  }

  console.log('  ✓  Core repair preflight passed');
  console.log('  ✓  Existing consumer adapters are protected from overwrite');
  const migration = await migrateCommand({ ...opts, apply: true, updateAdapters: false, fix: undefined, quiet: true });
  if (!migration.ok) {
    process.exitCode = 1;
    return { ok: false, phase: 'migration' };
  }
  if (migration.storagePlan.alreadyMigrated) console.log('  ✓  Canonical storage is current');
  else console.log(`  ✓  ${migration.storagePlan.fromRootLayout ? 'Relocated' : 'Extracted'} ${migration.storagePlan.itemCount} canonical item file(s) under docs/`);
  if (migration.skillsInstalled > 0) console.log(`  ✓  Installed ${migration.skillsInstalled} missing adapter(s); existing adapter files were preserved`);

  const projected = await projectLedgers(targetDir, { write: true });
  if (projected.written > 0) console.log(`  ✓  Regenerated ${projected.written} stale ledger projection(s)`);
  else console.log('  ✓  Ledger projections are current');

  const validation = await validateCommand({ dir: targetDir, strict: true, quiet: opts.lifecycle === true });
  if (!validation.ok) {
    console.log('  ✗  Core repair stopped because strict validation failed');
    process.exitCode = 1;
    return { ok: false, phase: 'validation' };
  }

  const health = await doctorCommand({ dir: targetDir, fix: false, quiet: opts.lifecycle === true });
  if (!health.ok) {
    process.exitCode = 1;
    return { ok: false, phase: 'health' };
  }

  await ensureTransactionRuntime(targetDir);

  console.log('  ✓ Core repair complete. Review and commit .vef/, docs/, generated ledgers, and any newly installed adapters.\n');
  return { ok: true, adapters: health.adapters };
}

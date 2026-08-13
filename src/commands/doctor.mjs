/**
 * doctor.mjs — `vef doctor` / `vef --doctor`
 *
 * Health check — is the framework properly installed?
 *
 *  ✓/✗ for: expected docs, durable-memory catalogue, all 5 skills,
 *  CLAUDE.md integration, and zero needsReview items.
 */

import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { auditApplyContract } from '../lib/apply-contract.mjs';
import { auditMemoryCatalogDirectory } from '../lib/memory-catalog.mjs';
import { loadCanonicalDocuments, STORAGE_MANIFEST } from '../lib/record-store.mjs';

const EXPECTED_DOCS = ['VISION.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'TASKS.md', 'DECISIONS.md', 'log.md', 'index.md', 'CLAUDE.md'];
const EXPECTED_SKILLS = ['apply', 'tasks', 'roadmap', 'decisions', 'bugs'];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{ dir: string }} opts
 */
export async function doctorCommand(opts) {
  const targetDir = opts.dir;
  let allGood = true;

  console.log(`\n  Health check: ${targetDir}\n`);

  // ── Documents ──
  console.log('  ── Documents ──');
  for (const doc of EXPECTED_DOCS) {
    const found = await exists(join(targetDir, doc));
    console.log(`  ${found ? '✓' : '✗'}  ${doc}`);
    if (!found) allGood = false;
  }

  // ── Canonical storage ──
  console.log('\n  ── Canonical storage ──');
  const canonical = await loadCanonicalDocuments(targetDir);
  if (canonical.storage.mode === 'per-item') {
    console.log(`  ✓  Per-item records enabled by ${STORAGE_MANIFEST}`);
    for (const issue of canonical.storageIssues) console.log(`  ✗  ${issue}`);
    for (const issue of canonical.projectionIssues) console.log(`  ✗  ${issue}`);
    if (canonical.storageIssues.length === 0 && canonical.projectionIssues.length === 0) {
      console.log('  ✓  Canonical items and generated ledgers agree');
    } else {
      if (canonical.projectionIssues.length > 0) console.log('     Run: vef project');
      allGood = false;
    }
  } else if (canonical.storage.mode === 'per-item-root') {
    console.log('  ✗  Canonical records use the retired root-directory layout');
    console.log('     Preview: vef migrate');
    console.log('     Apply:   vef migrate --apply --update-adapters');
    console.log('     This moves canonical records under docs/ and regenerates the root ledgers.');
    allGood = false;
  } else if (canonical.storage.mode === 'legacy') {
    console.log('  ✗  Legacy monolithic ledgers are still canonical');
    console.log('     Preview: vef migrate');
    console.log('     Apply:   vef migrate --apply --update-adapters');
    console.log('     Commit .vef/, docs/, and the regenerated root ledgers together.');
    allGood = false;
  } else if (canonical.storage.mode === 'uninitialized') {
    console.log('  ✗  VEF structured storage is not initialized');
    console.log('     Run: vef init');
    allGood = false;
  } else if (canonical.storage.mode === 'legacy-incomplete') {
    console.log(`  ✗  Incomplete legacy document set (${canonical.storage.legacyLedgers.join(', ')})`);
    console.log('     Scaffold missing documents non-destructively: vef init');
    console.log('     Then preview storage migration: vef migrate');
    allGood = false;
  } else if (canonical.storage.mode === 'legacy-partial') {
    console.log(`  ✗  Partial storage migration detected (${canonical.storage.partialDirectories.join(', ')})`);
    console.log('     Resolve conflicting files, then run: vef migrate --apply --update-adapters');
    allGood = false;
  } else {
    for (const issue of [...canonical.storage.issues, ...canonical.storageIssues]) console.log(`  ✗  ${issue}`);
    allGood = false;
  }

  // ── Durable-memory catalogue ──
  console.log('\n  ── Durable-memory catalogue ──');
  const memoryIssues = await auditMemoryCatalogDirectory(targetDir);
  if (memoryIssues.length === 0) {
    console.log('  ✓  Canonical records and document surfaces align');
  } else {
    for (const issue of memoryIssues) console.log(`  ✗  ${issue.surface}: ${issue.message}`);
    allGood = false;
  }

  // ── Skills ──
  console.log('\n  ── Skills ──');
  for (const skill of EXPECTED_SKILLS) {
    const found = await exists(join(targetDir, '.claude', 'skills', skill, 'SKILL.md'));
    console.log(`  ${found ? '✓' : '✗'}  /${skill}`);
    if (!found) allGood = false;
  }

  const applySkillPath = join(targetDir, '.claude', 'skills', 'apply', 'SKILL.md');
  const applyWorkflowPath = join(targetDir, '.claude', 'skills', 'apply', 'workflow.mjs');
  if (await exists(applySkillPath) && await exists(applyWorkflowPath)) {
    const [skill, workflow] = await Promise.all([
      readFile(applySkillPath, 'utf-8'),
      readFile(applyWorkflowPath, 'utf-8'),
    ]);
    const trustIssues = auditApplyContract({ skill, workflow });
    console.log(`  ${trustIssues.length === 0 ? '✓' : '✗'}  /apply trust contract`);
    for (const issue of trustIssues) console.log(`     ${issue}`);
    if (trustIssues.length > 0) console.log('     Run: vef migrate --apply --update-adapters');
    if (trustIssues.length > 0) allGood = false;
  } else {
    console.log('  ✗  /apply trust contract (SKILL.md or workflow.mjs missing)');
    allGood = false;
  }

  // ── CLAUDE.md integration ──
  console.log('\n  ── CLAUDE.md integration ──');
  const claudePath = join(targetDir, 'CLAUDE.md');
  if (await exists(claudePath)) {
    const content = await readFile(claudePath, 'utf-8');
    const hasSkills = content.includes('/apply') || content.toLowerCase().includes('skills');
    const hasFramework = content.includes('TASKS.md') && content.includes('DECISIONS.md');
    console.log(`  ${hasSkills ? '✓' : '✗'}  References skills`);
    console.log(`  ${hasFramework ? '✓' : '✗'}  References doc framework`);
    if (!hasSkills || !hasFramework) allGood = false;
  } else {
    console.log('  ✗  CLAUDE.md not found');
    allGood = false;
  }

  // ── Migration status ──
  console.log('\n  ── Migration status ──');
  const needsReviewCount = canonical.parsedDocs
    .flatMap((doc) => doc.items)
    .filter((item) => item.data?.needsReview === true).length;
  if (needsReviewCount === 0) {
    console.log('  ✓  No items flagged needsReview');
  } else {
    console.log(`  ⚠  ${needsReviewCount} item(s) flagged needsReview — run /apply to resolve`);
    allGood = false;
  }

  // ── Summary ──
  console.log(`\n  ${allGood ? '✓ All checks passed' : '✗ Issues found'}`);
  console.log('');
  if (!allGood) process.exitCode = 1;
}

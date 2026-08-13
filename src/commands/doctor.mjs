/**
 * doctor.mjs — `vef doctor` / `vef --doctor`
 *
 * Health check — is the framework properly installed?
 *
 *  ✓/✗ for: all expected docs present, all 5 skills installed,
 *  CLAUDE.md references the framework, zero needsReview items.
 */

import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDoc } from '../lib/frontmatter.mjs';
import { auditApplyContract } from '../lib/apply-contract.mjs';

const EXPECTED_DOCS = ['VISION.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'TASKS.md', 'DECISIONS.md', 'log.md', 'index.md', 'CLAUDE.md'];
const EXPECTED_SKILLS = ['apply', 'tasks', 'roadmap', 'decisions', 'bugs'];
const VALIDATABLE_DOCS = ['TASKS.md', 'ROADMAP.md', 'DECISIONS.md', 'VISION.md'];

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
  let needsReviewCount = 0;
  for (const doc of VALIDATABLE_DOCS) {
    const docPath = join(targetDir, doc);
    if (!(await exists(docPath))) continue;
    const content = await readFile(docPath, 'utf-8');
    const { items } = parseDoc(content);
    const flagged = items.filter((i) => i.data?.needsReview === true);
    needsReviewCount += flagged.length;
  }
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

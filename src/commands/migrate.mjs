/**
 * migrate.mjs — `vef migrate` / `vef --migrate`
 *
 * Adopts the framework in an existing repo that has docs predating it.
 * The CLI does structural work; Claude Code's /apply does the AI work.
 *
 *  1. Install missing skills (never overwrite consumer-owned adapters)
 *  2. Detect framework docs (which exist, which are missing)
 *  3. Analyze items — flag those without frontmatter or with bare IDs
 *  4. Check CLAUDE.md for framework integration
 *  5. Report + suggest running /apply
 *
 * Default is dry-run (report only). --apply installs skills.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDoc } from '../lib/frontmatter.mjs';
import { getDocType } from '../lib/schemas.mjs';
import { migrateLegacyStorage, planStorageMigration, STORAGE_MANIFEST } from '../lib/record-store.mjs';
import { inspectTransactionState, TransactionError } from '../lib/transactions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates');

const SKILLS = ['apply', 'tasks', 'roadmap', 'decisions', 'bugs', 'infrastructure'];
const FRAMEWORK_DOCS = ['VISION.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'TASKS.md', 'DECISIONS.md', 'log.md', 'index.md'];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

/**
 * Copy a skill directory from templates into the target.
 */
function renderAdapterTemplate(content, targetDir) {
  const projectName = basename(targetDir) || 'project';
  const githubOwner = 'example';
  const repoName = basename(targetDir) || 'project';
  return content
    .split('{{PROJECT_NAME}}').join(projectName)
    .split('{{GITHUB_OWNER}}').join(githubOwner)
    .split('{{REPO_NAME}}').join(repoName);
}

async function copySkill(skillName, destSkillsDir, dryRun, { targetDir = '.' } = {}) {
  const srcDir = join(TEMPLATES_DIR, '.claude', 'skills', skillName);
  try {
    const entries = await readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const src = join(srcDir, entry.name);
      const dest = join(destSkillsDir, skillName, entry.name);
      if (await exists(dest)) continue;
      if (dryRun) continue;
      await mkdir(dirname(dest), { recursive: true });
      const content = await readFile(src, 'utf-8');
      await writeFile(dest, renderAdapterTemplate(content, targetDir), 'utf-8');
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{ dir: string, apply: boolean }} opts
 */
export async function migrateCommand(opts) {
  const targetDir = opts.dir;
  const dryRun = !opts.apply;
  const mode = dryRun ? '[DRY RUN]' : '[APPLY]';
  const log = opts.quiet ? () => {} : console.log;

  if (!dryRun) {
    const state = await inspectTransactionState(targetDir);
    if (state.unresolved.length > 0) {
      throw new TransactionError(`Migration is blocked by unresolved transaction(s): ${state.unresolved.map((journal) => journal.id).join(', ')}. Recover explicitly first.`);
    }
  }

  if (opts.updateAdapters) {
    log('\n  ✗  --update-adapters is retired because adapters are consumer-owned and may contain intentional customizations.');
    log('     No files were changed. Run `vef doctor` to inspect adapter compatibility; reconcile adapters through review.\n');
    process.exitCode = 1;
    return { ok: false, applied: false, phase: 'deprecated-adapter-update' };
  }

  const storagePlan = await planStorageMigration(targetDir);
  const skillDryRun = dryRun || !storagePlan.ready;

  log(`\n  ${mode} Analyzing: ${targetDir}\n`);

  // ── Step 1: Install skills ──
  log('  ── Skills ──');
  const skillsDir = join(targetDir, '.claude', 'skills');
  let skillsInstalled = 0;
  let skillsAlready = 0;

  for (const skill of SKILLS) {
    const skillPath = join(skillsDir, skill, 'SKILL.md');
    const present = await exists(skillPath);
    if (present) skillsAlready++;
    if (present) {
      log(`  ✓  /${skill} (preserved)`);
    } else {
      const copied = await copySkill(skill, skillsDir, skillDryRun, { targetDir });
      if (copied) {
        log(`  +  /${skill} ${skillDryRun ? '(would install)' : '(installed)'}`);
        skillsInstalled++;
      } else {
        log(`  !  /${skill} (template not found)`);
      }
    }
  }

  // ── Step 2: Detect framework docs ──
  log('\n  ── Framework docs ──');
  const foundDocs = [];
  const missingDocs = [];

  for (const doc of FRAMEWORK_DOCS) {
    if (await exists(join(targetDir, doc))) {
      foundDocs.push(doc);
      log(`  ✓  ${doc}`);
    } else {
      missingDocs.push(doc);
      log(`  ✗  ${doc} (missing)`);
    }
  }

  // ── Step 3: Analyze items ──
  log('\n  ── Item analysis ──');
  let totalItems = 0;
  let itemsWithoutFm = 0;
  let itemsWithNeedsReview = 0;
  const docsWithoutFm = [];

  for (const doc of foundDocs) {
    const docType = getDocType(doc);
    if (!docType) continue;

    const content = await readFile(join(targetDir, doc), 'utf-8');
    const { items } = parseDoc(content);
    if (items.length === 0) continue;

    const noFm = items.filter((i) => !i.hasFrontmatter);
    const needsReview = items.filter((i) => i.data?.needsReview === true);

    totalItems += items.length;
    itemsWithoutFm += noFm.length;
    itemsWithNeedsReview += needsReview.length;

    const icon = noFm.length > 0 ? '⚠' : '✓';
    log(`  ${icon}  ${doc}: ${items.length} items${noFm.length > 0 ? `, ${noFm.length} without frontmatter` : ''}`);

    for (const item of noFm) {
      const label = item.id || item.heading;
      log(`       → ${label} (no frontmatter — needs /apply extraction)`);
      docsWithoutFm.push({ doc, item });
    }
  }

  // ── Step 4: CLAUDE.md check ──
  log('\n  ── CLAUDE.md ──');
  const claudePath = join(targetDir, 'CLAUDE.md');
  if (await exists(claudePath)) {
    const claudeContent = await readFile(claudePath, 'utf-8');
    const hasSkills = claudeContent.includes('/apply') || claudeContent.includes('Skills');
    const hasFramework = claudeContent.includes('TASKS.md') && claudeContent.includes('DECISIONS.md');
    if (hasSkills && hasFramework) {
      log('  ✓  References skills + doc framework');
    } else {
      log('  ⚠  Missing skills/framework section');
      log('     Consider adding a doc-framework section (see template CLAUDE.md)');
    }
  } else {
    log('  ✗  CLAUDE.md not found');
  }

  // ── Step 5: Summary ──
  log('\n  ── Summary ──');
  log(`  Docs found:      ${foundDocs.length}/${FRAMEWORK_DOCS.length}`);
  log(`  Skills present:  ${skillsAlready}/${SKILLS.length}`);
  log(`  Skills ${skillDryRun ? 'to install' : 'installed'}: ${skillsInstalled}`);
  log(`  Total items:     ${totalItems}`);
  log(`  No frontmatter:  ${itemsWithoutFm}`);
  log(`  Needs review:    ${itemsWithNeedsReview}`);

  // ── Canonical storage migration ──
  log('\n  ── Canonical storage ──');
  if (storagePlan.alreadyMigrated) {
    log(`  ✓  Per-item storage already enabled (${STORAGE_MANIFEST})`);
  } else if (!storagePlan.ready) {
    log('  ✗  Storage migration is blocked:');
    for (const issue of storagePlan.issues) log(`     • ${issue}`);
    process.exitCode = 1;
  } else if (dryRun) {
    log(`  +  Would ${storagePlan.fromRootLayout ? 'relocate' : 'extract'} ${storagePlan.itemCount} canonical item file(s)`);
    log('  +  Would create docs/vision/, docs/roadmap/, docs/tasks/, docs/decisions/, and .vef/storage.json');
    if (storagePlan.fromRootLayout) log('  +  Would remove the retired root record directories after verified copies are written');
    log('  +  Would regenerate VISION.md, ROADMAP.md, TASKS.md, and DECISIONS.md deterministically');
  } else {
    await migrateLegacyStorage(targetDir);
    log(`  ✓  ${storagePlan.fromRootLayout ? 'Relocated' : 'Extracted'} ${storagePlan.itemCount} canonical item file(s) under docs/`);
    log(`  ✓  Enabled per-item storage with ${STORAGE_MANIFEST}`);
    log('  ✓  Regenerated the four committed ledgers');
  }

  if (itemsWithoutFm > 0 || missingDocs.length > 0) {
    log('\n  Next steps:');
    if (itemsWithoutFm > 0) {
      log(`    • Run Claude Code's /apply to extract ${itemsWithoutFm} item(s) into canonical frontmatter`);
    }
    if (missingDocs.length > 0) {
      log(`    • Reconcile missing docs, then run 'vef setup': ${missingDocs.join(', ')}`);
    }
  }

  if (!storagePlan.ready) {
    log(`\n  Storage migration was not applied. Resolve the reported conflicts and re-run the preview.`);
  } else if (dryRun) {
    log('\n  (Dry run — no changes made. Use `vef setup` for supported remediation.)');
  } else {
    log('\n  Migration applied. Run vef check, then review and commit the complete diff.');
  }
  log('');
  return {
    ok: storagePlan.ready,
    applied: !dryRun && storagePlan.ready,
    storagePlan,
    skillsInstalled,
    skillsUpdated: 0,
  };
}

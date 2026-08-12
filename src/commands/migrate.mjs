/**
 * migrate.mjs — `vef migrate` / `vef --migrate`
 *
 * Adopts the framework in an existing repo that has docs predating it.
 * The CLI does structural work; Claude Code's /apply does the AI work.
 *
 *  1. Install skills (copy from templates if missing)
 *  2. Detect framework docs (which exist, which are missing)
 *  3. Analyze items — flag those without frontmatter or with bare IDs
 *  4. Check CLAUDE.md for framework integration
 *  5. Report + suggest running /apply
 *
 * Default is dry-run (report only). --apply installs skills.
 */

import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDoc } from '../lib/frontmatter.mjs';
import { getDocType } from '../lib/schemas.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates');

const SKILLS = ['apply', 'tasks', 'roadmap', 'decisions', 'bugs'];
const FRAMEWORK_DOCS = ['VISION.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'TASKS.md', 'DECISIONS.md', 'LOG.md', 'INDEX.md'];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy a skill directory from templates into the target.
 */
async function copySkill(skillName, destSkillsDir, dryRun) {
  const srcDir = join(TEMPLATES_DIR, '.claude', 'skills', skillName);
  try {
    const entries = await readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const src = join(srcDir, entry.name);
      const dest = join(destSkillsDir, skillName, entry.name);
      if (dryRun) continue;
      await mkdir(dirname(dest), { recursive: true });
      const content = await readFile(src, 'utf-8');
      await writeFile(dest, content, 'utf-8');
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

  console.log(`\n  ${mode} Analyzing: ${targetDir}\n`);

  // ── Step 1: Install skills ──
  console.log('  ── Skills ──');
  const skillsDir = join(targetDir, '.claude', 'skills');
  let skillsInstalled = 0;
  let skillsAlready = 0;

  for (const skill of SKILLS) {
    const skillPath = join(skillsDir, skill, 'SKILL.md');
    if (await exists(skillPath)) {
      console.log(`  ✓  /${skill} (already installed)`);
      skillsAlready++;
    } else {
      const copied = await copySkill(skill, skillsDir, dryRun);
      if (copied) {
        console.log(`  +  /${skill} ${dryRun ? '(would install)' : '(installed)'}`);
        skillsInstalled++;
      } else {
        console.log(`  !  /${skill} (template not found)`);
      }
    }
  }

  // ── Step 2: Detect framework docs ──
  console.log('\n  ── Framework docs ──');
  const foundDocs = [];
  const missingDocs = [];

  for (const doc of FRAMEWORK_DOCS) {
    if (await exists(join(targetDir, doc))) {
      foundDocs.push(doc);
      console.log(`  ✓  ${doc}`);
    } else {
      missingDocs.push(doc);
      console.log(`  ✗  ${doc} (missing)`);
    }
  }

  // ── Step 3: Analyze items ──
  console.log('\n  ── Item analysis ──');
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
    console.log(`  ${icon}  ${doc}: ${items.length} items${noFm.length > 0 ? `, ${noFm.length} without frontmatter` : ''}`);

    for (const item of noFm) {
      const label = item.id || item.heading;
      console.log(`       → ${label} (no frontmatter — needs /apply extraction)`);
      docsWithoutFm.push({ doc, item });
    }
  }

  // ── Step 4: CLAUDE.md check ──
  console.log('\n  ── CLAUDE.md ──');
  const claudePath = join(targetDir, 'CLAUDE.md');
  if (await exists(claudePath)) {
    const claudeContent = await readFile(claudePath, 'utf-8');
    const hasSkills = claudeContent.includes('/apply') || claudeContent.includes('Skills');
    const hasFramework = claudeContent.includes('TASKS.md') && claudeContent.includes('DECISIONS.md');
    if (hasSkills && hasFramework) {
      console.log('  ✓  References skills + doc framework');
    } else {
      console.log('  ⚠  Missing skills/framework section');
      console.log('     Consider adding a doc-framework section (see template CLAUDE.md)');
    }
  } else {
    console.log('  ✗  CLAUDE.md not found');
  }

  // ── Step 5: Summary ──
  console.log('\n  ── Summary ──');
  console.log(`  Docs found:      ${foundDocs.length}/${FRAMEWORK_DOCS.length}`);
  console.log(`  Skills present:  ${skillsAlready}/${SKILLS.length}`);
  console.log(`  Skills ${dryRun ? 'to install' : 'installed'}: ${skillsInstalled}`);
  console.log(`  Total items:     ${totalItems}`);
  console.log(`  No frontmatter:  ${itemsWithoutFm}`);
  console.log(`  Needs review:    ${itemsWithNeedsReview}`);

  if (itemsWithoutFm > 0 || missingDocs.length > 0) {
    console.log('\n  Next steps:');
    if (itemsWithoutFm > 0) {
      console.log(`    • Run Claude Code's /apply to extract ${itemsWithoutFm} item(s) into canonical frontmatter`);
    }
    if (missingDocs.length > 0) {
      console.log(`    • Run 'vef init' to scaffold missing docs: ${missingDocs.join(', ')}`);
    }
  }

  if (dryRun) {
    console.log('\n  (Dry run — no changes made. Re-run with --apply to install skills.)');
  } else {
    console.log('\n  Skills installed. Run /apply in Claude Code for AI-powered migration.');
  }
  console.log('');
}

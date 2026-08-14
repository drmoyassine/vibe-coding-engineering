/**
 * init.mjs — `vef init` / `vef --new`
 *
 * Scaffolds the framework into a target directory:
 *   1. Resolves the target dir + project name
 *   2. Walks templates/, copies every file with placeholder substitution
 *   3. Reports what was created + next steps
 *
 * Non-destructive by default: existing files are skipped unless --force.
 */

import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateLegacyStorage, projectLedgers } from '../lib/record-store.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', '..', 'templates');
const SEMANTIC_INIT_SURFACES = new Set(['VISION.md', 'ARCHITECTURE.md', 'ROADMAP.md', 'TASKS.md', 'DECISIONS.md', 'log.md', 'index.md']);

/**
 * Recursively walk a directory, returning relative file paths.
 */
async function walkDir(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(fullPath, base)));
    } else {
      files.push(relative(base, fullPath).replace(/\\/g, '/'));
    }
  }
  return files;
}

/** Inspect initialization without writing so `vef setup` cannot leave a partial scaffold. */
export async function planInitialization(opts) {
  const targetDir = opts.dir;
  const templateFiles = await walkDir(TEMPLATES_DIR);
  const conflicts = [];
  for (const relPath of templateFiles) {
    try {
      await stat(join(targetDir, relPath));
      conflicts.push(relPath);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  const blockingConflicts = conflicts.filter((path) => SEMANTIC_INIT_SURFACES.has(path));
  return { targetDir, templateFiles, conflicts, blockingConflicts, ready: blockingConflicts.length === 0 };
}

/**
 * Replace {{PLACEHOLDER}} tokens in template content.
 */
function applyPlaceholders(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

/**
 * @param {{ dir: string, name: string|undefined, github: string|undefined, force: boolean }} opts
 */
export async function initCommand(opts) {
  const targetDir = opts.dir;
  const projectName = opts.name || basename(targetDir) || 'My Project';

  // Parse --github owner/repo
  let githubOwner = '{{GITHUB_OWNER}}';
  let repoName = '{{REPO_NAME}}';
  if (opts.github && opts.github.includes('/')) {
    const [owner, repo] = opts.github.split('/');
    githubOwner = owner;
    repoName = repo;
  }

  const vars = {
    PROJECT_NAME: projectName,
    GITHUB_OWNER: githubOwner,
    REPO_NAME: repoName,
    GENERATED_AT: new Date().toISOString(),
    GENERATED_BY: 'process:vef-init',
    TODAY: new Date().toISOString().slice(0, 10),
  };

  console.log(`\n  Scaffolding vibe-engineering-framework into: ${targetDir}`);
  console.log(`  Project name: ${projectName}`);
  if (opts.github) {
    console.log(`  GitHub: ${githubOwner}/${repoName}`);
  }
  console.log('');

  // Walk templates
  const { templateFiles } = await planInitialization(opts);
  let created = 0;
  let skipped = 0;
  const createdPaths = new Set();

  for (const relPath of templateFiles) {
    const srcPath = join(TEMPLATES_DIR, relPath);
    const destPath = join(targetDir, relPath);

    // Check if destination exists
    let exists = false;
    try {
      await stat(destPath);
      exists = true;
    } catch {
      // doesn't exist — proceed
    }

    if (exists && !opts.force) {
      console.log(`  SKIP   ${relPath} (already exists)`);
      skipped++;
      continue;
    }

    // Read → substitute → write
    const content = await readFile(srcPath, 'utf-8');
    const processed = applyPlaceholders(content, vars);

    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, processed, 'utf-8');
    console.log(`  CREATE ${relPath}`);
    created++;
    createdPaths.add(relPath);
  }

  const structuredLedgers = ['VISION.md', 'ROADMAP.md', 'TASKS.md', 'DECISIONS.md'];
  const initializedStructuredModel = structuredLedgers.every((path) => createdPaths.has(path));
  if (initializedStructuredModel) {
    const migration = await migrateLegacyStorage(targetDir);
    if (migration.alreadyMigrated) await projectLedgers(targetDir, { write: true });
    console.log(`  CREATE ${migration.itemCount} canonical item files${migration.alreadyMigrated ? ' (existing canonical store retained)' : ' + .vef/storage.json'}`);
    console.log('  PROJECT VISION.md, ROADMAP.md, TASKS.md, DECISIONS.md');
  }

  console.log(`\n  ── Done ──`);
  console.log(`  ${created} files created, ${skipped} skipped.`);
  console.log(`\n  Next steps:`);
  console.log(`    1. Fill in docs/vision/_index.md with your product vision`);
  console.log(`    2. Edit canonical items in docs/vision/, docs/roadmap/, docs/tasks/, and docs/decisions/`);
  console.log(`    3. Run /apply in Claude Code to reconcile existing project meaning`);
  console.log(`    4. Run 'vef check' locally and in CI`);
  console.log('');
  return { ok: true, created, skipped, initializedStructuredModel };
}

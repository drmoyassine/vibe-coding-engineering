/**
 * validate.mjs — `vef validate` / `vef --validate`
 *
 * Read-only schema + cross-link validation. Designed for CI gates.
 * Exit 1 if errors found (or if --strict and warnings found).
 *
 *  1. Parse all framework docs (TASKS, ROADMAP, DECISIONS, VISION)
 *  2. Validate each item's frontmatter against canonical schema
 *  3. Check cross-links: orphans (dangling refs) + bidirectionality
 *  4. Audit the project-level durable-memory catalogue
 *  5. Report + set exit code
 */

import { validateItem } from '../lib/schemas.mjs';
import { findOrphans, findDuplicateIds, findDependencyCycles, checkBidirectional } from '../lib/crosslinks.mjs';
import { auditMemoryCatalogDirectory } from '../lib/memory-catalog.mjs';
import { loadCanonicalDocuments, STORAGE_MANIFEST } from '../lib/record-store.mjs';

/**
 * @param {{ dir: string, strict: boolean }} opts
 */
export async function validateCommand(opts) {
  const targetDir = opts.dir;
  const log = opts.quiet ? () => {} : console.log;
  const parsedDocs = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalValid = 0;
  const issues = [];

  const recordIssue = (level, scope, message) => {
    issues.push({ level, scope, message });
    if (level === 'error') totalErrors++;
    else totalWarnings++;
  };

  log(`\n  Validating: ${targetDir}\n`);

  const loaded = await loadCanonicalDocuments(targetDir);

  log('  ── Canonical storage ──');
  if (loaded.storage.mode === 'per-item') {
    log(`  ✓  Per-item canonical storage (${STORAGE_MANIFEST})`);
  } else if (loaded.storage.mode === 'per-item-root') {
    log('  ⚠  Retired root-directory storage; run vef setup');
    recordIssue('warning', 'storage', 'Retired root-directory storage');
  } else if (loaded.storage.mode === 'legacy' || loaded.storage.mode === 'legacy-partial' || loaded.storage.mode === 'legacy-incomplete') {
    log('  ⚠  Legacy monolithic ledger storage; run vef setup');
    recordIssue('warning', 'storage', 'Legacy monolithic ledger storage');
  } else if (loaded.storage.mode === 'uninitialized') {
    log('  ⚠  VEF structured storage is not initialized; run vef setup');
    recordIssue('warning', 'storage', 'VEF structured storage is not initialized');
  }
  for (const issue of loaded.storageIssues) {
    log(`  ✗  ${issue}`);
    recordIssue('error', 'storage', issue);
  }
  for (const issue of loaded.projectionIssues) {
    log(`  ✗  ${issue}`);
    recordIssue('error', 'projection', issue);
  }
  if (loaded.storage.mode === 'per-item' && loaded.storageIssues.length === 0 && loaded.projectionIssues.length === 0) {
    log('  ✓  All committed ledger projections are current');
  }

  // Parse + validate every canonical item.
  for (const { docType, filename, items } of loaded.parsedDocs) {
    if (items.length === 0) continue;

    log(`  ── ${filename} (${items.length} items) ──`);

    for (const item of items) {
      const id = item.data?.id || item.id || item.heading;
      const location = item.sourceFile && item.sourceFile !== filename ? `${item.sourceFile}:${id}` : id;

      if (!item.hasFrontmatter) {
        log(`  ✗  ${location}: no frontmatter`);
        recordIssue('error', 'schema', `${location}: no frontmatter`);
        continue;
      }

      const { errors, warnings } = validateItem(docType, item.data, item);

      if (errors.length === 0 && warnings.length === 0) {
        totalValid++;
      } else {
        for (const e of errors) {
          log(`  ✗  ${location}: ${e}`);
          recordIssue('error', 'schema', `${location}: ${e}`);
        }
        for (const w of warnings) {
          log(`  ⚠  ${location}: ${w}`);
          recordIssue('warning', 'schema', `${location}: ${w}`);
        }
      }
    }
  }

  parsedDocs.push(...loaded.parsedDocs);

  // Cross-link validation
  if (parsedDocs.length > 0) {
    log('\n  ── Cross-links ──');

    const orphans = findOrphans(parsedDocs);
    for (const orphan of orphans) {
      const message = `${orphan.fromItem} → ${orphan.refId} (missing ${orphan.expectedType} target in ${orphan.field})`;
      log(`  ✗  ${message}`);
      recordIssue('error', 'crosslinks', message);
    }

    const duplicates = findDuplicateIds(parsedDocs);
    for (const duplicate of duplicates) {
      const message = `Duplicate ID ${duplicate.id} in ${duplicate.docType}`;
      log(`  ✗  ${message}`);
      recordIssue('error', 'crosslinks', message);
    }

    const cycles = findDependencyCycles(parsedDocs);
    for (const cycle of cycles) {
      const message = `Task dependency cycle: ${cycle.join(' → ')}`;
      log(`  ✗  ${message}`);
      recordIssue('error', 'crosslinks', message);
    }

    const bidiIssues = checkBidirectional(parsedDocs);
    for (const issue of bidiIssues) {
      log(`  ⚠  ${issue.message}`);
      recordIssue('warning', 'crosslinks', issue.message);
    }

    if (orphans.length === 0 && duplicates.length === 0 && cycles.length === 0 && bidiIssues.length === 0) {
      log('  ✓  All cross-links resolve');
    }
  }

  // Project-level durable-memory contract
  log('\n  ── Durable-memory catalogue ──');
  const memoryIssues = await auditMemoryCatalogDirectory(targetDir);
  for (const issue of memoryIssues) {
    const message = `${issue.surface}: ${issue.message}`;
    log(`  ✗  ${message}`);
    recordIssue('error', 'catalogue', message);
  }
  if (memoryIssues.length === 0) log('  ✓  All canonical records and document surfaces align');

  // Summary
  log(`\n  ── Result ──`);
  log(`  Valid: ${totalValid}   Errors: ${totalErrors}   Warnings: ${totalWarnings}\n`);

  if (opts.setExitCode !== false) {
    if (totalErrors > 0) {
      process.exitCode = 1;
    } else if (totalWarnings > 0 && opts.strict) {
      process.exitCode = 1;
    }
  }
  return {
    ok: totalErrors === 0 && (!opts.strict || totalWarnings === 0),
    valid: totalValid,
    errors: totalErrors,
    warnings: totalWarnings,
    issues,
  };
}

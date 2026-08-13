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

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDoc } from '../lib/frontmatter.mjs';
import { getDocType, validateItem, ALL_DOC_FILES } from '../lib/schemas.mjs';
import { findOrphans, findDuplicateIds, findDependencyCycles, checkBidirectional } from '../lib/crosslinks.mjs';
import { auditMemoryCatalogDirectory } from '../lib/memory-catalog.mjs';

/**
 * @param {{ dir: string, strict: boolean }} opts
 */
export async function validateCommand(opts) {
  const targetDir = opts.dir;
  const parsedDocs = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalValid = 0;

  console.log(`\n  Validating: ${targetDir}\n`);

  // Parse + validate each doc
  for (const filename of ALL_DOC_FILES) {
    const docPath = join(targetDir, filename);
    let content;
    try {
      content = await readFile(docPath, 'utf-8');
    } catch {
      continue; // Doc doesn't exist — skip silently
    }

    const docType = getDocType(filename);
    if (!docType) continue;

    const { items } = parseDoc(content);
    if (items.length === 0) continue;

    console.log(`  ── ${filename} (${items.length} items) ──`);

    for (const item of items) {
      const id = item.data?.id || item.id || item.heading;

      if (!item.hasFrontmatter) {
        console.log(`  ✗  ${id}: no frontmatter`);
        totalErrors++;
        continue;
      }

      const { errors, warnings } = validateItem(docType, item.data, item);

      if (errors.length === 0 && warnings.length === 0) {
        totalValid++;
      } else {
        for (const e of errors) {
          console.log(`  ✗  ${id}: ${e}`);
          totalErrors++;
        }
        for (const w of warnings) {
          console.log(`  ⚠  ${id}: ${w}`);
          totalWarnings++;
        }
      }
    }

    parsedDocs.push({ docType, filename, items });
  }

  // Cross-link validation
  if (parsedDocs.length > 0) {
    console.log('\n  ── Cross-links ──');

    const orphans = findOrphans(parsedDocs);
    for (const orphan of orphans) {
      console.log(`  ✗  ${orphan.fromItem} → ${orphan.refId} (missing ${orphan.expectedType} target in ${orphan.field})`);
      totalErrors++;
    }

    const duplicates = findDuplicateIds(parsedDocs);
    for (const duplicate of duplicates) {
      console.log(`  ✗  Duplicate ID ${duplicate.id} in ${duplicate.docType}`);
      totalErrors++;
    }

    const cycles = findDependencyCycles(parsedDocs);
    for (const cycle of cycles) {
      console.log(`  ✗  Task dependency cycle: ${cycle.join(' → ')}`);
      totalErrors++;
    }

    const bidiIssues = checkBidirectional(parsedDocs);
    for (const issue of bidiIssues) {
      console.log(`  ⚠  ${issue.message}`);
      totalWarnings++;
    }

    if (orphans.length === 0 && duplicates.length === 0 && cycles.length === 0 && bidiIssues.length === 0) {
      console.log('  ✓  All cross-links resolve');
    }
  }

  // Project-level durable-memory contract
  console.log('\n  ── Durable-memory catalogue ──');
  const memoryIssues = await auditMemoryCatalogDirectory(targetDir);
  for (const issue of memoryIssues) {
    console.log(`  ✗  ${issue.surface}: ${issue.message}`);
    totalErrors++;
  }
  if (memoryIssues.length === 0) console.log('  ✓  All canonical records and document surfaces align');

  // Summary
  console.log(`\n  ── Result ──`);
  console.log(`  Valid: ${totalValid}   Errors: ${totalErrors}   Warnings: ${totalWarnings}\n`);

  if (totalErrors > 0) {
    process.exitCode = 1;
  } else if (totalWarnings > 0 && opts.strict) {
    process.exitCode = 1;
  }
}

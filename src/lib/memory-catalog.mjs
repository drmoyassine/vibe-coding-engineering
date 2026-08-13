/**
 * The canonical durable-memory catalogue.
 *
 * Structured item schemas live in schemas.mjs. This catalogue defines the
 * project-level record types that must remain visible across VEF's files and
 * public documentation, including records (such as Architecture and Log)
 * that do not contain frontmatter items.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const MEMORY_CATALOG = Object.freeze([
  Object.freeze({ key: 'vision', label: 'Vision', file: 'VISION.md', question: 'Why does this project exist?' }),
  Object.freeze({ key: 'architecture', label: 'Architecture', file: 'ARCHITECTURE.md', question: 'How is the system structured, and what constraints shape it?' }),
  Object.freeze({ key: 'roadmap', label: 'Roadmap', file: 'ROADMAP.md', question: 'Where are we going next?' }),
  Object.freeze({ key: 'tasks', label: 'Tasks', file: 'TASKS.md', question: 'What concrete work remains?' }),
  Object.freeze({ key: 'decisions', label: 'Decisions', file: 'DECISIONS.md', question: 'What did we choose, and why?' }),
  Object.freeze({ key: 'log', label: 'Log', file: 'log.md', question: 'What materially changed or was learned?' }),
  Object.freeze({ key: 'external-issues', label: 'External issues', file: null, question: 'What problems have been reported?' }),
]);

const DOCUMENT_RECORDS = MEMORY_CATALOG.filter((record) => record.file);

function normalizeCell(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function parseTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed.slice(1, -1).split('|').map(normalizeCell);
}

function findTable(content, expectedHeaders) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const normalizedHeaders = expectedHeaders.map((header) => header.toLowerCase());

  for (let index = 0; index < lines.length - 1; index++) {
    const header = parseTableRow(lines[index]);
    if (!header || header.map((cell) => cell.toLowerCase()).join('\0') !== normalizedHeaders.join('\0')) continue;

    const separator = parseTableRow(lines[index + 1]);
    if (!separator || separator.length !== header.length || separator.some((cell) => !/^:?-{3,}:?$/.test(cell))) continue;

    const rows = [];
    for (let rowIndex = index + 2; rowIndex < lines.length; rowIndex++) {
      const row = parseTableRow(lines[rowIndex]);
      if (!row || row.length !== header.length) break;
      rows.push(row);
    }
    return rows;
  }

  return null;
}

function markdownTarget(cell) {
  const match = cell.match(/\]\(<?([^)>]+)>?\)/);
  if (!match) return null;
  return match[1].split('#')[0].split('?')[0].replace(/^\.\//, '').replace(/^\//, '');
}

function auditVisionTable(surface, content) {
  const issues = [];
  const rows = findTable(content, ['Record', 'Question it answers']);
  if (!rows) return [{ surface, message: 'missing the durable-memory Record / Question it answers table' }];

  const recordsByLabel = new Map();
  for (const row of rows) {
    const label = row[0];
    if (recordsByLabel.has(label)) issues.push({ surface, message: `duplicate durable-memory record "${label}"` });
    recordsByLabel.set(label, row[1]);
  }

  for (const record of MEMORY_CATALOG) {
    if (!recordsByLabel.has(record.label)) {
      issues.push({ surface, message: `missing durable-memory record "${record.label}"` });
    } else if (recordsByLabel.get(record.label) !== record.question) {
      issues.push({ surface, message: `question for "${record.label}" must be "${record.question}"` });
    }
  }

  return issues;
}

function auditDocumentTable(surface, content) {
  const rows = findTable(content, ['Document', 'Purpose']) || findTable(content, ['Document', 'Role']);
  if (!rows) return [{ surface, message: 'missing the canonical Document / Purpose table' }];

  const targets = new Set(rows.map((row) => markdownTarget(row[0])).filter(Boolean));
  const issues = [];
  for (const record of DOCUMENT_RECORDS) {
    if (!targets.has(record.file)) issues.push({ surface, message: `missing canonical document link "${record.file}"` });
  }
  if (!/GitHub Issues/i.test(content)) issues.push({ surface, message: 'missing the canonical external-issues reference to GitHub Issues' });
  return issues;
}

/**
 * Audit already-loaded surfaces. Exported separately for focused tests and
 * adapters that do not operate directly on a filesystem.
 *
 * @param {{ vision: string, index: string, readme?: string, templateVision?: string, templateIndex?: string }} surfaces
 */
export function auditMemoryCatalogSurfaces(surfaces) {
  const issues = [
    ...auditVisionTable('VISION.md', surfaces.vision),
    ...auditDocumentTable('index.md', surfaces.index),
  ];
  if (surfaces.readme !== undefined) issues.push(...auditDocumentTable('README.md', surfaces.readme));
  if (surfaces.templateVision !== undefined) issues.push(...auditVisionTable('templates/VISION.md', surfaces.templateVision));
  if (surfaces.templateIndex !== undefined) issues.push(...auditDocumentTable('templates/index.md', surfaces.templateIndex));
  return issues;
}

async function readDirectoryOptional(path) {
  try {
    return await readdir(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

/**
 * Audit the durable-memory contract in a VEF project. The framework source
 * repository additionally audits its README and install templates when the
 * templates directory is present.
 */
export async function auditMemoryCatalogDirectory(targetDir) {
  const issues = [];
  const rootEntries = new Set(await readDirectoryOptional(targetDir) || []);
  for (const record of DOCUMENT_RECORDS) {
    if (!rootEntries.has(record.file)) {
      issues.push({ surface: record.file, message: 'canonical durable-memory document is missing or has incorrect casing' });
    }
  }

  const templateDir = join(targetDir, 'templates');
  const templateEntryNames = await readDirectoryOptional(templateDir);
  const templateEntries = new Set(templateEntryNames || []);
  const [vision, index, templateVision, templateIndex] = await Promise.all([
    rootEntries.has('VISION.md') ? readFile(join(targetDir, 'VISION.md'), 'utf8') : undefined,
    rootEntries.has('index.md') ? readFile(join(targetDir, 'index.md'), 'utf8') : undefined,
    templateEntries.has('VISION.md') ? readFile(join(templateDir, 'VISION.md'), 'utf8') : undefined,
    templateEntries.has('index.md') ? readFile(join(templateDir, 'index.md'), 'utf8') : undefined,
  ]);

  if (vision !== undefined) issues.push(...auditVisionTable('VISION.md', vision));
  if (index !== undefined) issues.push(...auditDocumentTable('index.md', index));

  const isFrameworkSource = templateEntryNames !== undefined;
  if (isFrameworkSource) {
    const readme = rootEntries.has('README.md') ? await readFile(join(targetDir, 'README.md'), 'utf8') : undefined;
    if (readme === undefined) issues.push({ surface: 'README.md', message: 'framework source documentation is missing' });
    else issues.push(...auditDocumentTable('README.md', readme));

    if (templateVision === undefined) issues.push({ surface: 'templates/VISION.md', message: 'install template is missing' });
    else issues.push(...auditVisionTable('templates/VISION.md', templateVision));
    if (templateIndex === undefined) issues.push({ surface: 'templates/index.md', message: 'install template is missing' });
    else issues.push(...auditDocumentTable('templates/index.md', templateIndex));
  }

  return issues;
}

/**
 * frontmatter.mjs — parse and serialize YAML frontmatter in framework docs.
 *
 * A framework doc has this structure:
 *
 *   # Title
 *
 *   Preamble text (schema blocks, description, etc.)
 *
 *   ---
 *
 *   ## DEC-001 — Title
 *
 *   ---
 *   id: DEC-001
 *   title: ...
 *   ---
 *
 *   Body prose.
 *
 *   ---
 *
 *   ## DEC-002 — Title
 *   ...
 *
 * `parseDoc()` splits this into { header, items: [...] } where each item has
 * { id, title, data, body, hasFrontmatter }.
 */

import yaml from 'js-yaml';

/**
 * Parse a single `---\n...\n---` frontmatter block.
 * @param {string} text — text that may start with a frontmatter block
 * @returns {{ data: object, content: string }}
 */
export function parseFrontmatter(text) {
  const match = text.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: text };
  try {
    const data = yaml.load(match[1]) || {};
    return { data, content: match[2] };
  } catch {
    return { data: {}, content: text, _parseError: true };
  }
}

/**
 * Serialize a data object into a frontmatter block.
 * @param {object} data — the YAML data
 * @param {string} [content=''] — content after the block
 * @returns {string}
 */
export function stringifyFrontmatter(data, content = '') {
  const yamlStr = yaml.dump(data, { lineWidth: 120, noRefs: true, sortKeys: false });
  return `---\n${yamlStr}---\n${content}`;
}

/**
 * Split a markdown doc into its header (preamble) and per-item sections.
 * Each item is a `## ` heading followed by optional frontmatter + body.
 *
 * @param {string} text — full doc text
 * @returns {{ header: string, items: Array<{id: string|null, title: string, heading: string, data: object, body: string, hasFrontmatter: boolean}> }}
 */
export function parseDoc(text) {
  // Strip HTML comments — they're human-only annotations, not structural
  const cleanText = text.replace(/<!--[\s\S]*?-->/g, '');

  // Split on top-level ## headings (### and deeper are body content)
  const sections = cleanText.split(/(?=^## )/m);
  const header = sections[0];
  const items = [];

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i].trimEnd();
    const lines = section.split('\n');
    const headingLine = lines[0]; // "## DEC-001 — Title"
    const headingText = headingLine.replace(/^##\s+/, '').trim(); // "DEC-001 — Title"

    // Extract ID (e.g. DEC-001, TASK-042, ROADMAP-003) from the heading
    const idMatch = headingText.match(/^([A-Z]+-\d+)/);
    const id = idMatch ? idMatch[1] : null;
    const title = headingText.replace(/^[A-Z]+-\d+\s*[—–:\-]\s*/, '').trim() || headingText;

    // Everything after the heading line
    const rest = lines.slice(1).join('\n').trim();

    let data = {};
    let body = rest;
    let hasFrontmatter = false;

    if (rest.startsWith('---')) {
      const fm = parseFrontmatter(rest);
      data = fm.data;
      body = fm.content.trim();
      hasFrontmatter = !fm._parseError;
    }

    // Only treat as an item if it has an ID-like pattern OR has frontmatter.
    // Structural headings (Schema, Open tasks, Decisions, etc.) are section
    // dividers — not items to validate.
    if (!id && !hasFrontmatter) continue;

    items.push({ id, title, heading: headingText, data, body, hasFrontmatter });
  }

  return { header, items };
}

/**
 * Render a single item back to markdown.
 * @param {{ id: string|null, title: string, data: object, body: string }} item
 * @returns {string}
 */
export function stringifyItem(item) {
  const { heading, data, body } = item;
  const yamlStr = yaml.dump(data, { lineWidth: 120, noRefs: true, sortKeys: false });
  return `## ${heading}\n\n---\n${yamlStr}---\n\n${body}\n`;
}

/**
 * Render a complete doc from a header + items array.
 * @param {string} header
 * @param {Array} items
 * @returns {string}
 */
export function stringifyDoc(header, items) {
  const parts = [header.trimEnd(), ''];
  for (const item of items) {
    parts.push('---', '');
    parts.push(stringifyItem(item));
  }
  return parts.join('\n');
}

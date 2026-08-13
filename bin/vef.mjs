#!/usr/bin/env node

/**
 * vef — Vibe Engineering Framework CLI
 *
 * Commands:
 *   vef init [--dir] [--name] [--github] [--force]   Scaffold the framework (alias: --new)
 *   vef migrate [--dir] [--apply]                    Adopt an existing repo (alias: --migrate)
 *   vef validate [--dir] [--strict]                  Schema + graph + catalogue validation (alias: --validate)
 *   vef doctor [--dir] [--fix]                       Health check or explicitly authorized repair (alias: --doctor)
 *   vef project [--dir] [--check]                    Generate committed ledgers from canonical items
 *   vef list|show|refs|why|graph|search               Deterministic project queries
 */

import { program } from 'commander';
import { QUERY_SCHEMA_VERSION } from '../src/lib/project-query.mjs';

// ── Flag-to-subcommand shim ──────────────────────────────────────────────
// The user's mental model is `vef --new` / `vef --migrate`. Commander uses
// subcommands (`vef init`). Translate the top-level flags before parsing so
// both forms work identically.
const flagMap = {
  '--new': 'init',
  '--migrate': 'migrate',
  '--validate': 'validate',
  '--doctor': 'doctor',
};

const rawArgs = process.argv.slice(2);
for (const [flag, cmd] of Object.entries(flagMap)) {
  const idx = rawArgs.indexOf(flag);
  if (idx !== -1) {
    rawArgs[idx] = cmd;
    process.argv = [process.argv[0], process.argv[1], ...rawArgs];
    break;
  }
}

// ── Program ───────────────────────────────────────────────────────────────

program
  .name('vef')
  .description('Vibe Engineering Framework — scaffold, validate, and query durable project memory.')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold the framework into a new or empty directory')
  .option('--dir <path>', 'target directory', '.')
  .option('--name <project>', 'project name (default: directory name)')
  .option('--github <owner/repo>', 'GitHub owner/repo for bug URLs')
  .option('-f, --force', 'overwrite existing files')
  .action(async (opts) => {
    const { initCommand } = await import('../src/commands/init.mjs');
    await initCommand(opts);
  });

program
  .command('migrate')
  .description('Adopt the framework in an existing repo')
  .option('--dir <path>', 'target directory', '.')
  .option('--apply', 'apply structural fixes (default: dry-run report)')
  .option('--update-adapters', 'replace installed VEF skills with this package version (explicit opt-in)')
  .action(async (opts) => {
    const { migrateCommand } = await import('../src/commands/migrate.mjs');
    await migrateCommand(opts);
  });

program
  .command('validate')
  .description('Validate canonical schemas, graph relationships, and durable-memory catalogue')
  .option('--dir <path>', 'target directory', '.')
  .option('--strict', 'exit 1 on warnings too')
  .action(async (opts) => {
    const { validateCommand } = await import('../src/commands/validate.mjs');
    await validateCommand(opts);
  });

program
  .command('doctor')
  .description('Health check — are all docs and skills installed?')
  .option('--dir <path>', 'target directory', '.')
  .option('--fix', 'explicitly repair supported VEF storage, adapter, and projection drift')
  .action(async (opts) => {
    const { doctorCommand } = await import('../src/commands/doctor.mjs');
    await doctorCommand(opts);
  });

program
  .command('project')
  .description('Generate committed ledgers from canonical per-item records')
  .option('--dir <path>', 'target directory', '.')
  .option('--check', 'check projection drift without writing')
  .action(async (opts) => {
    try {
      const { projectCommand } = await import('../src/commands/project.mjs');
      await projectCommand(opts);
    } catch (error) {
      console.error(`Error: ${error?.message || String(error)}`);
      process.exitCode = 1;
    }
  });

async function runQuery(command, json, action) {
  try {
    await action();
  } catch (error) {
    const message = error?.message || String(error);
    if (json) console.error(JSON.stringify({ schemaVersion: QUERY_SCHEMA_VERSION, command, error: { message } }, null, 2));
    else console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}

program
  .command('list [type]')
  .description('List project items, optionally filtered by type, status, or priority')
  .option('--dir <path>', 'project directory', '.')
  .option('--status <status>', 'filter by exact status (case-insensitive)')
  .option('--priority <priority>', 'filter by exact priority (case-insensitive)')
  .option('--json', 'emit versioned JSON')
  .action((type, opts) => runQuery('list', opts.json, async () => {
    const { listCommand } = await import('../src/commands/query.mjs');
    await listCommand(type, opts);
  }));

program
  .command('show <id>')
  .description('Show one project item; use type:id if an ID is ambiguous')
  .option('--dir <path>', 'project directory', '.')
  .option('--json', 'emit versioned JSON')
  .action((id, opts) => runQuery('show', opts.json, async () => {
    const { showCommand } = await import('../src/commands/query.mjs');
    await showCommand(id, opts);
  }));

program
  .command('refs <id>')
  .description('Show typed incoming and outgoing references for an item')
  .option('--dir <path>', 'project directory', '.')
  .option('--direction <direction>', 'in, out, or both', 'both')
  .option('--json', 'emit versioned JSON')
  .action((id, opts) => runQuery('refs', opts.json, async () => {
    const { refsCommand } = await import('../src/commands/query.mjs');
    await refsCommand(id, opts);
  }));

program
  .command('why <id>')
  .description('Trace deterministic rationale paths through roadmap, vision, and decisions')
  .option('--dir <path>', 'project directory', '.')
  .option('--json', 'emit versioned JSON')
  .action((id, opts) => runQuery('why', opts.json, async () => {
    const { whyCommand } = await import('../src/commands/query.mjs');
    await whyCommand(id, opts);
  }));

program
  .command('graph')
  .description('Render the complete typed project graph')
  .option('--dir <path>', 'project directory', '.')
  .option('--json', 'emit versioned JSON')
  .action((opts) => runQuery('graph', opts.json, async () => {
    const { graphCommand } = await import('../src/commands/query.mjs');
    await graphCommand(opts);
  }));

program
  .command('search <query>')
  .description('Search IDs, frontmatter, relationships, and body prose')
  .option('--dir <path>', 'project directory', '.')
  .option('--type <type>', 'filter by vision, roadmap, tasks, or decisions')
  .option('--status <status>', 'filter by exact status (case-insensitive)')
  .option('--priority <priority>', 'filter by exact priority (case-insensitive)')
  .option('--json', 'emit versioned JSON')
  .action((query, opts) => runQuery('search', opts.json, async () => {
    const { searchCommand } = await import('../src/commands/query.mjs');
    await searchCommand(query, opts);
  }));

await program.parseAsync();

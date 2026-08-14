#!/usr/bin/env node

/**
 * vef — Vibe Engineering Framework CLI
 *
 * Commands:
 *   vef setup [--dir] [--name] [--github]            Adopt or upgrade and reach enforced state
 *   vef check [--dir]                                Strict read-only local/CI enforcement gate
 *   vef doctor [--dir]                               Detailed troubleshooting report
 *   vef create|update                                Preview or apply validated record mutations
 *   vef list|show|refs|why|graph|search               Deterministic project queries
 *
 * Legacy init/migrate/validate/project commands and doctor --fix remain
 * callable for compatibility, but are intentionally absent from normal help.
 */

import { createRequire } from 'node:module';
import { Option, program } from 'commander';
import { QUERY_SCHEMA_VERSION } from '../src/lib/project-query.mjs';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

// ── Flag-to-subcommand shim ──────────────────────────────────────────────
// Retained only for compatibility with pre-0.2 callers.
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
  .description('Vibe Engineering Framework — set up, enforce, and query durable project memory.')
  .version(version)
  .addHelpText('after', `
Adopt or upgrade a repository:
  npx vibe-engineering-framework@latest setup

Verify full core enforcement locally or in CI:
  npx vef check

Normal adoption requires only setup and check. Run vef doctor for detailed troubleshooting.`);

async function runMutation(action) {
  try {
    await action();
  } catch (error) {
    console.error(`Error: ${error?.message || String(error)}`);
    process.exitCode = 1;
  }
}

program
  .command('setup')
  .description('Adopt or upgrade VEF and reach the strongest provable enforced state')
  .option('--dir <path>', 'target directory', '.')
  .option('--name <project>', 'project name when initializing')
  .option('--github <owner/repo>', 'GitHub owner/repo when initializing')
  .action(async (opts) => {
    const { setupCommand } = await import('../src/commands/setup.mjs');
    await setupCommand(opts);
  });

program
  .command('check')
  .description('Fail unless the deterministic VEF core is fully enforced')
  .option('--dir <path>', 'target directory', '.')
  .action(async (opts) => {
    const { checkCommand } = await import('../src/commands/check.mjs');
    await checkCommand(opts);
  });

program
  .command('init', { hidden: true })
  .description('Compatibility: scaffold the framework into a new or empty directory')
  .option('--dir <path>', 'target directory', '.')
  .option('--name <project>', 'project name (default: directory name)')
  .option('--github <owner/repo>', 'GitHub owner/repo for bug URLs')
  .option('-f, --force', 'overwrite existing files')
  .action(async (opts) => {
    const { initCommand } = await import('../src/commands/init.mjs');
    await initCommand(opts);
  });

program
  .command('migrate', { hidden: true })
  .description('Advanced: inspect or apply canonical-storage migration')
  .option('--dir <path>', 'target directory', '.')
  .option('--apply', 'apply structural fixes (default: dry-run report)')
  .addOption(new Option('--update-adapters').hideHelp())
  .action(async (opts) => {
    const { migrateCommand } = await import('../src/commands/migrate.mjs');
    await migrateCommand(opts);
  });

program
  .command('validate', { hidden: true })
  .description('Advanced/CI: validate schemas, graph relationships, and durable-memory catalogue')
  .option('--dir <path>', 'target directory', '.')
  .option('--strict', 'exit 1 on warnings too')
  .action(async (opts) => {
    const { validateCommand } = await import('../src/commands/validate.mjs');
    await validateCommand(opts);
  });

program
  .command('doctor')
  .description('Explain core enforcement and optional adapter compatibility')
  .option('--dir <path>', 'target directory', '.')
  .addOption(new Option('--fix').hideHelp())
  .action(async (opts) => {
    const { doctorCommand } = await import('../src/commands/doctor.mjs');
    await doctorCommand(opts);
  });

program
  .command('create <type>')
  .description('Preview or create one canonical record with validated inverse relationships')
  .requiredOption('--from <file>', 'YAML/JSON proposal file, or - for stdin')
  .option('--dir <path>', 'project directory', '.')
  .option('--actor <actor>', 'provenance actor', 'process:vef-cli')
  .option('--write', 'apply the previewed transaction')
  .option('--json', 'emit versioned JSON')
  .action((type, opts) => runMutation(async () => {
    const { createCommand } = await import('../src/commands/mutation.mjs');
    await createCommand(type, opts);
  }));

program
  .command('update <id>')
  .description('Preview or update one canonical record; relationships and inverse links are included')
  .option('--from <file>', 'YAML/JSON proposal file, or - for stdin (required except for authority-only repair)')
  .option('--dir <path>', 'project directory', '.')
  .option('--actor <actor>', 'provenance actor', 'process:vef-cli')
  .option('--authority <source>', 'repair a title/heading mismatch from frontmatter or heading')
  .option('--write', 'apply the previewed transaction')
  .option('--json', 'emit versioned JSON')
  .addHelpText('after', `
Proposal keys in the YAML/JSON file:
  set: { status: completed }       replace ordinary fields
  unset: [assignee]                remove ordinary fields
  body: Updated semantic prose     replace the Markdown body
  relationships:                  set/add/remove typed links with inverse closure
    depends_on: { add: [TASK-009] }

Authority-only title repair may omit --from:
  vef update TASK-010 --authority frontmatter --write`)
  .action((id, opts) => runMutation(async () => {
    const { updateCommand } = await import('../src/commands/mutation.mjs');
    await updateCommand(id, opts);
  }));

program
  .command('recover <id>')
  .description('Recover an interrupted transaction or malformed writer leases explicitly')
  .option('--dir <path>', 'project directory', '.')
  .option('--forward', 'apply the complete staged candidate')
  .option('--rollback', 'restore the complete pre-transaction state')
  .option('--force', 'overwrite unrecognized transaction targets, or quarantine a recent malformed lease after operator confirmation')
  .option('--actor <actor>', 'recovery provenance actor', 'process:vef-recover')
  .addHelpText('after', `
Journal recovery requires one direction:
  vef recover <transaction-id> --forward|--rollback

Malformed lease recovery is separate and preserves active writers:
  vef recover leases`)
  .action((id, opts) => runMutation(async () => {
    if (opts.forward && opts.rollback) throw new Error('Choose exactly one of --forward or --rollback.');
    const { recoverCommand } = await import('../src/commands/mutation.mjs');
    await recoverCommand(id, opts);
  }));

program
  .command('project', { hidden: true })
  .description('Advanced: generate committed ledgers from canonical per-item records')
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

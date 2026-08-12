#!/usr/bin/env node

/**
 * vef — Vibe Engineering Framework CLI
 *
 * Commands:
 *   vef init [--dir] [--name] [--github] [--force]   Scaffold the framework (alias: --new)
 *   vef migrate [--dir] [--apply]                    Adopt an existing repo (alias: --migrate)
 *   vef validate [--dir] [--strict]                  Schema + cross-link validation (alias: --validate)
 *   vef doctor [--dir]                               Health check (alias: --doctor)
 */

import { program } from 'commander';

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
  .description('Vibe Engineering Framework — scaffold, migrate, and validate AI-assisted product docs.')
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
  .action(async (opts) => {
    const { migrateCommand } = await import('../src/commands/migrate.mjs');
    await migrateCommand(opts);
  });

program
  .command('validate')
  .description('Validate docs against canonical schemas + cross-links')
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
  .action(async (opts) => {
    const { doctorCommand } = await import('../src/commands/doctor.mjs');
    await doctorCommand(opts);
  });

program.parse();

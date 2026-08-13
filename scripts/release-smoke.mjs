import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath;
const packageJson = JSON.parse(await readFile(join(repoDir, 'package.json'), 'utf8'));
const tempDir = await mkdtemp(join(tmpdir(), 'vef-release-smoke-'));

if (!npmCli) throw new Error('release-smoke must be invoked through npm run release:smoke');

async function run(command, args, cwd) {
  return execFileAsync(command, args, {
    cwd,
    env: {
      ...process.env,
      npm_config_audit: 'false',
      npm_config_dry_run: 'false',
      npm_config_fund: 'false',
    },
    maxBuffer: 10 * 1024 * 1024,
    timeout: 120_000,
  });
}

async function runNpm(args, cwd) {
  return run(process.execPath, [npmCli, ...args], cwd);
}

try {
  const artifactsDir = join(tempDir, 'artifacts');
  const consumerDir = join(tempDir, 'consumer');
  const projectDir = join(consumerDir, 'release-smoke-project');
  await mkdir(artifactsDir, { recursive: true });
  await mkdir(consumerDir, { recursive: true });
  await writeFile(join(consumerDir, 'package.json'), '{"name":"vef-release-smoke","private":true}\n', 'utf8');

  console.log('Packing the exact release artifact...');
  const packed = await runNpm([
    'pack',
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    artifactsDir,
  ], repoDir);
  const [{ filename }] = JSON.parse(packed.stdout);
  const tarball = join(artifactsDir, filename);

  console.log('Installing the artifact into an isolated project...');
  await runNpm(['install', tarball, '--ignore-scripts', '--no-audit', '--no-fund'], consumerDir);

  console.log('Exercising the installed CLI...');
  const cli = join(consumerDir, 'node_modules', packageJson.name, 'bin', 'vef.mjs');
  const versionResult = await run(process.execPath, [cli, '--version'], consumerDir);
  assert.equal(versionResult.stdout.trim(), packageJson.version);

  const helpResult = await run(process.execPath, [cli, '--help'], consumerDir);
  assert.match(helpResult.stdout, /Vibe Engineering Framework/);
  assert.match(helpResult.stdout, /doctor/);

  await run(process.execPath, [cli, 'init', '--dir', projectDir, '--name', 'Release Smoke'], consumerDir);
  const doctor = await run(process.execPath, [cli, 'doctor', '--dir', projectDir], consumerDir);
  assert.match(doctor.stdout, /CORE ENFORCED/);
  const validation = await run(process.execPath, [cli, 'validate', '--strict', '--dir', projectDir], consumerDir);
  assert.match(validation.stdout, /Errors: 0   Warnings: 0/);

  console.log(`Release smoke passed for ${packageJson.name}@${packageJson.version}.`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

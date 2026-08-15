import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, readdir, rm, utimes, writeFile } from 'node:fs/promises';
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
  const packResult = JSON.parse(packed.stdout);
  const filename = Array.isArray(packResult)
    ? packResult[0].filename
    : packResult[Object.keys(packResult)[0]].filename;
  const tarball = join(artifactsDir, filename);

  console.log('Installing the artifact into an isolated project...');
  await runNpm(['install', tarball, '--ignore-scripts', '--no-audit', '--no-fund'], consumerDir);

  console.log('Exercising the installed CLI...');
  const cli = join(consumerDir, 'node_modules', packageJson.name, 'bin', 'vef.mjs');
  const versionResult = await run(process.execPath, [cli, '--version'], consumerDir);
  assert.equal(versionResult.stdout.trim(), packageJson.version);

  const helpResult = await run(process.execPath, [cli, '--help'], consumerDir);
  assert.match(helpResult.stdout, /Vibe Engineering Framework/);
  assert.match(helpResult.stdout, /setup/);
  assert.match(helpResult.stdout, /check/);
  assert.match(helpResult.stdout, /doctor/);
  assert.match(helpResult.stdout, /recover/);
  assert.doesNotMatch(helpResult.stdout, /migrate \[options\]/);
  assert.doesNotMatch(helpResult.stdout, /validate \[options\]/);

  const setup = await run(process.execPath, [cli, 'setup', '--dir', projectDir, '--name', 'Release Smoke'], consumerDir);
  assert.match(setup.stdout, /SETUP COMPLETE — VEF CORE ENFORCED/);
  const check = await run(process.execPath, [cli, 'check', '--dir', projectDir], consumerDir);
  assert.match(check.stdout, /CHECK PASSED — VEF CORE ENFORCED/);

  const updateHelp = await run(process.execPath, [cli, 'update', '--help'], consumerDir);
  assert.match(updateHelp.stdout, /set: \{ status: completed \}/);
  assert.match(updateHelp.stdout, /unset: \[assignee\]/);
  assert.match(updateHelp.stdout, /body: Updated semantic prose/);
  assert.match(updateHelp.stdout, /depends_on: \{ add: \[TASK-009\] \}/);

  console.log('Proving installed authoring allocation and authority repair...');
  const firstRoadmapProposal = join(consumerDir, 'first-roadmap.yml');
  await writeFile(firstRoadmapProposal, `
title: First installed roadmap
description: Proves fresh roadmap allocation.
status: In Progress
priority: P0
body: Fresh allocation must be deterministic.
`, 'utf8');
  await run(process.execPath, [cli, 'create', 'roadmap', '--from', firstRoadmapProposal, '--write', '--actor', 'process:release-smoke', '--dir', projectDir], consumerDir);
  await access(join(projectDir, 'docs', 'roadmap', 'ROADMAP-001.md'));

  const secondRoadmapProposal = join(consumerDir, 'second-roadmap.yml');
  await writeFile(secondRoadmapProposal, `
title: Second installed roadmap
description: Proves coherent-family continuation.
status: Deferred
priority: P1
`, 'utf8');
  await run(process.execPath, [cli, 'create', 'roadmap', '--from', secondRoadmapProposal, '--write', '--actor', 'process:release-smoke', '--dir', projectDir], consumerDir);
  await access(join(projectDir, 'docs', 'roadmap', 'ROADMAP-002.md'));

  const taskProposal = join(consumerDir, 'task.yml');
  await writeFile(taskProposal, `
title: Installed authority repair
description: Proves authority-only repair without an empty proposal.
status: pending
priority: P1
`, 'utf8');
  await run(process.execPath, [cli, 'create', 'task', '--from', taskProposal, '--write', '--actor', 'process:release-smoke', '--dir', projectDir], consumerDir);
  const taskPath = join(projectDir, 'docs', 'tasks', 'TASK-001.md');
  const task = await readFile(taskPath, 'utf8');
  await writeFile(taskPath, task.replace('# TASK-001 — Installed authority repair', '# TASK-001 — Incorrect heading'), 'utf8');
  await run(process.execPath, [cli, 'update', 'TASK-001', '--authority', 'frontmatter', '--write', '--actor', 'process:release-smoke', '--dir', projectDir], consumerDir);
  assert.match(await readFile(taskPath, 'utf8'), /# TASK-001 — Installed authority repair/);

  console.log('Proving installed malformed-lease diagnosis, recovery, and debris sweep...');
  const leaseRoot = join(projectDir, '.vef', 'transactions', '_leases');
  await mkdir(leaseRoot, { recursive: true });
  const malformedLease = join(leaseRoot, 'malformed.json');
  await writeFile(malformedLease, '{"schemaVersion":1,"token":', 'utf8');
  const old = new Date(Date.now() - 10_000);
  await utimes(malformedLease, old, old);
  await assert.rejects(
    run(process.execPath, [cli, 'doctor', '--dir', projectDir], consumerDir),
    (error) => error.code === 1 && /malformed\.json: malformed/.test(error.stdout) && /vef recover leases/.test(error.stdout),
  );
  const leaseRecovery = await run(process.execPath, [cli, 'recover', 'leases', '--dir', projectDir], consumerDir);
  assert.match(leaseRecovery.stdout, /quarantined 1 malformed family/);

  const expiredLease = join(leaseRoot, 'expired.json');
  await writeFile(expiredLease, `${JSON.stringify({
    schemaVersion: 1,
    token: 'expired',
    transactionId: 'release-smoke-expired',
    pid: 999999,
    host: 'other-host',
    acquiredAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-01T00:01:00.000Z',
  })}\n`, 'utf8');
  const thirdRoadmapProposal = join(consumerDir, 'third-roadmap.yml');
  await writeFile(thirdRoadmapProposal, `
title: Third installed roadmap
description: Triggers bounded inactive-lease sweeping.
status: Deferred
priority: P2
`, 'utf8');
  await run(process.execPath, [cli, 'create', 'roadmap', '--from', thirdRoadmapProposal, '--write', '--actor', 'process:release-smoke', '--dir', projectDir], consumerDir);
  await access(join(projectDir, 'docs', 'roadmap', 'ROADMAP-003.md'));
  await assert.rejects(access(expiredLease), (error) => error.code === 'ENOENT');
  const markerDir = join(leaseRoot, '_markers');
  const markerContents = await Promise.all((await readdir(markerDir)).map((name) => readFile(join(markerDir, name), 'utf8')));
  assert(markerContents.some((content) => /"family": "expired\.json"/.test(content) && /"state": "settled"/.test(content)));

  const finalCheck = await run(process.execPath, [cli, 'check', '--dir', projectDir], consumerDir);
  assert.match(finalCheck.stdout, /CHECK PASSED — VEF CORE ENFORCED/);

  console.log(`Release smoke passed for ${packageJson.name}@${packageJson.version}.`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}

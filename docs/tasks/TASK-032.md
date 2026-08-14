---
id: TASK-032
title: Recover safely from malformed and accumulated lease claims
description: >-
  Quarantine uncertain lease debris, expose diagnosis and recovery, and sweep stale families without weakening writer
  serialization.
status: completed
priority: P0
last_updated: '2026-08-14'
generated:
  by: agent/codex-planning
  at: '2026-08-14T16:25:57.181Z'
roadmap_item:
  id: FRAMEWORK-023
  name: Harden public transactional authoring
  url: /ROADMAP.md#FRAMEWORK-023
related_decisions:
  - id: DEC-010
    name: Use a versioned VEF journal and stale-tolerant lease lock for mutations
    url: /DECISIONS.md#DEC-010
related_bugs:
  - id: '3'
    name: Malformed lease claim can permanently block every mutation
    url: https://github.com/drmoyassine/vibe-engineering-framework/issues/3
modified:
  by: agent/codex-implementation
  at: '2026-08-14T16:42:38.334Z'
---
# TASK-032 — Recover safely from malformed and accumulated lease claims

Completed 2026-08-14 for the 0.3.1 candidate. Lease inspection now classifies active, malformed, quarantined, expired, dead, released, settled, and orphan-renewal families without throwing on uncertain JSON. `vef doctor` reports every family and an exact remedy; malformed state blocks setup, check, planning, and writes until explicit `vef recover leases` quarantine.

Recovery preserves fresh possibly in-flight claims unless the operator confirms `--force`, never settles active writers, writes additive quarantine or settlement markers before best-effort deletion, and retains those markers against synchronized-folder resurrection. New mutations sweep at most 32 provably inactive families while cleanup failures remain warnings. A failed lease race now releases the losing claim instead of adding avoidable debris.

Fault tests cover malformed JSON, fresh partial claims, active writers, dead/expired/released claims, orphan renewals, hard process termination, sync resurrection, failed deletion, competing writers, and successful mutation plus strict check after recovery. GitHub issue #3 remains the release-tracking bug until TASK-035 proves the public package.

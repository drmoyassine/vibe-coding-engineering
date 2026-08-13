---
id: TASK-001
title: Publish the VEF CLI package to npm
description: >-
  Release the verified CLI, templates, and adapter package to npm so public adopters can install and run VEF without a
  local clone.
status: in-progress
priority: P0
roadmap_item:
  id: FRAMEWORK-020
  name: Publish and publicly launch VEF
  url: /ROADMAP.md#FRAMEWORK-020
assignee: drmoy
depends_on:
  - id: TASK-012
    name: Implement the canonical record store and ledger projector
    url: /TASKS.md#TASK-012
related_decisions:
  - id: DEC-008
    name: Bootstrap npm manually, then use staged trusted publishing
    url: /DECISIONS.md#DEC-008
last_updated: '2026-08-13'
---
# TASK-001 — Publish the VEF CLI package to npm

Scope revised 2026-08-13 when public launch became the immediate priority. Publishing is now P0; the unrelated local-directory rename moved to TASK-016.

Release-candidate readiness completed 2026-08-13:

- confirmed that the intended unscoped package name is currently absent from the public registry;
- made `package.json` the single CLI version source and added truthful repository, issue, homepage, keyword, and public-access metadata;
- added a release gate that runs tests, strict dogfood validation, doctor, package construction, isolated tarball installation, CLI help/version, and a fresh `init` → `doctor` → `validate --strict` flow;
- upgraded CI to `npm ci` across Windows/Ubuntu and the declared Node 18 boundary/current Node 24;
- added a tag/version guard plus a future OIDC staged-publishing workflow with human approval;
- verified the exact `vibe-engineering-framework@0.1.0` candidate through the complete release gate with zero validation errors or warnings.

Remaining acceptance boundary: this machine is not authenticated to npm. A maintainer must complete `npm login` with account-level 2FA and explicitly authorize the irreversible first `npm publish`. Only after the registry package exists can trusted publishing be configured. TASK-001 remains in progress until the public `@latest` help and clean-directory registry flow are verified.

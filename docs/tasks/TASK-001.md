---
id: TASK-001
title: Publish the VEF CLI package to npm
description: >-
  Release the verified CLI, templates, and adapter package to npm so public adopters can install and run VEF without a
  local clone.
status: completed
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

Completed 2026-08-13:

- published `vibe-engineering-framework@0.1.0` publicly to npm with the `latest` tag;
- verified registry integrity SHA-512 `oZCNC0i4cylkDFJafu7vEdj8A9B6PZgnSUx66m0xMgM0JDGakm63SFD6ARNPEiYhoa0hT1c6jR640ihdfWSkpQ==` and tarball SHA-1 `c527517e369748180a16224c94972eb3d6a2acde` against the release candidate;
- installed `vibe-engineering-framework@latest` from the public registry into a clean temporary project;
- verified the installed `0.1.0` CLI through `init`, `doctor`, and `validate --strict`, reaching `CORE ENFORCED` with zero errors or warnings;
- published the matching GitHub Release and created its `npm` deployment environment;
- configured npm trusted publishing for `publish.yml` with `createStagedPackage` as its only permission, then required human 2FA and disabled traditional publish tokens.

The manual bootstrap and release-hardening boundaries are closed. Future releases use the staged trusted-publishing path defined by DEC-008: GitHub may submit a verified tagged artifact to npm staging, but only a human 2FA approval may make it public.

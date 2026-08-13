# Contributing to VEF

VEF is an early, deliberately narrow framework. Contributions should strengthen portable project memory, deterministic integrity, safe adoption, or human review without turning the framework into a consumer-specific project-management system.

## Before opening a change

- Use a GitHub Issue for bugs, proposals, or behavior that needs discussion.
- Read `VISION.md`, `ARCHITECTURE.md`, and the relevant decision before changing a core contract.
- Keep named adopter strategy and commercial plans in their owning repositories.
- Do not describe planned transaction or review capabilities as shipped.

## Development

VEF supports Node.js 18 or newer.

```bash
npm ci
npm run release:check
```

The release check runs the test suite, strict canonical validation, dogfood doctor, package construction, a clean tarball installation, and a fresh `init`/`doctor`/`validate` flow.

When changing structured project records:

1. Edit canonical item files under `docs/vision/`, `docs/roadmap/`, `docs/tasks/`, or `docs/decisions/`.
2. Run `node bin/vef.mjs project`.
3. Run `npm run verify`.
4. Commit canonical records and generated ledgers together.

## Pull requests

A pull request should:

- explain the user-visible problem and the chosen boundary;
- include tests for deterministic behavior and failure paths;
- update templates whenever the installed contract changes;
- update durable tasks, decisions, roadmap links, and `log.md` when materially affected;
- preserve backwards-readable public ledger anchors;
- avoid force-push requirements or hidden migration steps.

By contributing, you agree that your contribution is licensed under the repository's MIT License.

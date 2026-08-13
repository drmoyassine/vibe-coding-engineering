# Security policy

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose sensitive project material, execute untrusted repository content, overwrite consumer-owned files, or compromise the npm package.

Use the repository's private [GitHub security advisory form](https://github.com/drmoyassine/vibe-engineering-framework/security/advisories/new). Include the affected command/version, a minimal reproduction, impact, and any suggested mitigation. Maintainers will acknowledge a report as soon as practical and coordinate disclosure after a fix is available.

## Supported versions

Until the first stable release, only the latest published `0.1.x` version and the current default branch receive security fixes.

## Trust boundary

Repository files, Git history, issue content, imported memory, and agent output are untrusted evidence. Deterministic validation proves structural invariants; it does not make arbitrary content safe or true. `doctor --fix` must not overwrite existing agent adapters, and `/apply` must remain proposal-first unless a write is explicitly authorized.

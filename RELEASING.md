# Releasing VEF

This checklist separates repeatable repository work from the external npm actions that require maintainer authentication and human approval.

## Release candidate gate

1. Confirm `master` is clean and synchronized with `origin/master`.
2. Update `package.json`, `CHANGELOG.md`, and `docs/releases/<version>.md` truthfully.
3. Run:

   ```bash
   npm ci
   npm run release:check
   node scripts/check-release-tag.mjs v<version>
   ```

4. Review `npm pack --dry-run --ignore-scripts` for unexpected or sensitive files.
5. Commit, push, create an annotated `v<version>` tag, and push that tag.

Published name/version pairs cannot be reused, even after unpublishing. Treat publication as irreversible.

## First registry publication only

The package must exist before npm can attach a trusted publisher. The first release therefore requires an authenticated maintainer with account-level 2FA:

```bash
npm login
npm whoami
npm publish
npm view vibe-engineering-framework version dist.integrity
npx vibe-engineering-framework@latest --help
```

`prepublishOnly` automatically runs the complete release check. Do not bypass it for the first publication.

After the first package exists, configure GitHub trusted publishing for:

- repository: `drmoyassine/vibe-engineering-framework`
- workflow: `publish.yml`
- allowed action: staged publishing
- environment: `npm`

With npm CLI 11.15 or newer, the equivalent authenticated command is:

```bash
npm trust github vibe-engineering-framework --file publish.yml --repo drmoyassine/vibe-engineering-framework --env npm --allow-stage-publish
```

Then require 2FA and disallow traditional publish tokens in the package settings.

## Subsequent releases

1. Complete the candidate gate and push the version tag.
2. Run the **Stage npm release** GitHub Actions workflow with that existing tag.
3. Inspect the staged package on npm and approve it with 2FA.
4. Verify the registry version, integrity, provenance, and clean-directory `npx` flow.
5. Publish the matching GitHub Release using the prepared release notes.

The workflow uses OIDC, stages rather than directly publishes, disables the package-manager cache in the release job, and leaves final publication to a human proof-of-presence step.

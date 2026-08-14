# TASK-040 execution handoff

This is the pickup point for a fresh agent session executing the frozen VEF inheritance study. The owner has directed that the next session continue TASK-040 and run the experiment. Do not expand this study into VibeBench or change its conditions after participant output exists.

## Read first

1. Repository `AGENTS.md` and `CLAUDE.md`.
2. [`protocol.md`](protocol.md), [`fixtures.yml`](fixtures.yml), [`randomization.json`](randomization.json), [`scorecard.md`](scorecard.md), and [`run-manifest.example.json`](run-manifest.example.json).
3. `scripts/evaluation/inheritance-v1.mjs` and `test/evaluation-protocol.test.mjs`.
4. Canonical records TASK-039, TASK-040, TASK-041, and FRAMEWORK-025 through `vef show`.

Protocol commit: `1a02762`  
Harness commit: `04d6375`  
Treatment package: `vibe-engineering-framework@0.3.1`  
Frozen participant runtime: Codex, `gpt-5.6-sol`, high reasoning, Node.js 24 on the same Windows runner image.

At handoff, no participant output has been generated or inspected. Confirm that remains true before continuing.

## Objective and permitted claim

Run 24 matched pairs—48 isolated sessions across the three frozen scenarios—to determine whether VEF improves inheritance of settled project intent relative to equivalent strong ordinary Markdown. If and only if the predeclared thresholds pass, the publishable claim is bounded to:

> In this study, VEF improved inherited project intent without a material increase in contradictions or meaningful task-quality degradation.

Do not convert structural conformance, convenience, tokens, elapsed time, or one platform's outcome into broader claims.

## Pre-participant gate

Complete and commit these materials before the first participant session:

- a session runner that creates one clean repository and one context-free agent session per assignment;
- immutable run-bundle collection matching `run-manifest.example.json`, including Git trees, patch, final snapshot, prompt, final response, ordered tools, tests, semantic report, time, token accounting, deviations, and failures;
- reference solutions or equivalent self-tests that prove every hidden oracle accepts a valid implementation and rejects frozen forbidden behavior in both conditions;
- tests proving the runner follows `randomization.json`, enforces the 30-minute/50,000-token caps, disables network and prior context, and cannot overwrite an existing raw run bundle;
- a dry-run that proves control and treatment fixtures remain semantically equivalent and that public VEF 0.3.1 is installed before network isolation.

If any gate cannot be proved, stop and record the genuine blocker. Do not collect exploratory participant output under the frozen study name.

## Execution sequence

1. Confirm a clean tree, run `npm test`, and run `node bin/vef.mjs check`.
2. Generate clean condition repositories with `node scripts/evaluation/inheritance-v1.mjs generate --output <workspace> --install-treatment`, then verify them with the `verify` command.
3. Execute assignments exactly from `randomization.json`. Each member gets a fresh context with no forked conversation or cross-run communication. Use the participant prompt verbatim.
4. Keep paired members in the same concurrency class and environment. A timeout, question, or incorrect completion is an outcome—not grounds for an undisclosed rerun.
5. Seal and hash each immutable run bundle before proceeding. Never overwrite or delete a failed run. A proven infrastructure failure may be rerun once and both attempts must remain disclosed.
6. Do not inspect condition-level comparisons during collection. Finish all runs before comparative analysis.
7. Run the condition-neutral hidden oracle for each final repository. Produce separate blinded rater bundles with the `blind` command.
8. Obtain two independent locked blind ratings per bundle and a third blind adjudication where the frozen disagreement rule requires it.
9. Analyze paired results using the frozen 10,000-resample bootstrap and publish every run, deviation, uncertainty interval, failure, and limitation under TASK-041.
10. Complete TASK-040 only after all immutable evidence and locked scores exist; then move TASK-041 to in-progress.

## Stop conditions

Stop rather than silently amend the experiment if the exact model/runtime is unavailable, isolation or evidence capture cannot be enforced, fixture equivalence fails, the hidden oracle is not condition-neutral, or results have been exposed to a rater. Any prospective correction before output must be an additive, timestamped protocol amendment committed before execution.

## Suggested opening instruction for the pickup session

> Continue TASK-040 from `docs/evaluations/inheritance-study-v1/HANDOFF.md`. First audit and complete the pre-participant gate. Preserve the frozen protocol and report any genuine execution blocker. Once the gate is committed and verified, run all assigned sessions without inspecting comparative results, seal the evidence, perform blinded scoring, and hand TASK-041 a reproducible result set.

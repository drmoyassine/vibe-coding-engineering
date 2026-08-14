# VibeBench — working benchmark concept

VibeBench is the working name for a reproducible, cross-platform benchmark of one-pass AI-assisted engineering with and without VEF. It extends the narrow inheritance study only after that study is published; it does not retroactively change its frozen protocol or pool incomparable results.

## Core question

For the same repository, durable facts, tools, and build instruction, how does adding the complete VEF project-memory system affect whether a fresh coding agent can finish useful engineering work correctly in one pass?

The benchmark compares matched conditions:

- **Control:** strong ordinary Markdown containing the same settled facts.
- **Treatment:** the equivalent VEF representation, installed CLI, typed graph, canonical records, and enforcement gate.

The minimum platform pilot covers Codex and Claude Code. Additional coding-agent platforms must be selected and version-pinned prospectively based on reproducible isolated-session automation; results from materially different models or tool environments are reported separately rather than silently pooled.

## “One pass” contract

One pass means one fresh agent session, one identical participant prompt, no human steering, a frozen time/token/tool budget, and one final submitted repository state. The agent may inspect, edit, test, and repair within that session. A clarification request receives only the frozen neutral response. Timeouts, tool failures, blockers, and incorrect completions remain outcomes.

## Capability matrix

VibeBench should cover a balanced, licensed or synthetic task corpus across:

- greenfield feature construction;
- defect diagnosis and repair;
- constrained refactoring without regression;
- dependency or data migration;
- integration across existing modules;
- architecture and accepted-decision adherence;
- privacy, security, or policy-bound implementation;
- roadmap/task/decision reconciliation after code changes.

Difficulty, repository size and maturity, context volume, dependency depth, test visibility, allowed tools, model/version, reasoning setting, token limit, and elapsed-time limit are explicit benchmark parameters. Each benchmark release freezes its matrix before comparative output.

## Outcomes

Primary outcomes should remain condition-neutral:

- hidden functional and regression-oracle performance;
- inherited-intent and architecture/decision adherence;
- contradiction and project-state error counts;
- safe completion, genuine blocker, timeout, or incorrect-completion classification.

Secondary outcomes include test quality, unnecessary re-litigation or questions, repair loops, write/check actions, elapsed time, tokens, and cost where accounting is comparable. VEF-specific validation output is descriptive evidence, not a substitute for a neutral oracle.

## Fairness and evidence rules

- Generate paired repositories from one semantic source and reject unequal facts before assignment.
- Keep prompts, code, Git history, tests, network, and tools equivalent within a platform pair.
- Use fresh isolated sessions, randomized condition order, immutable evidence bundles, blinded outcome rating, and predeclared claim/harm thresholds.
- Pin platform, model, reasoning mode, runner image, dependencies, and benchmark commit.
- Publish negative runs, failures, deviations, raw non-sensitive evidence, and uncertainty.
- Report platform-by-condition and capability-by-condition effects; do not turn heterogeneous environments into an unjustified universal leaderboard.

## Delivery sequence

1. Publish the current inheritance study under TASK-041 and use its operational lessons.
2. Freeze VibeBench v0: governance, one-pass contract, capability taxonomy, neutral corpus rules, platform-adapter contract, outcomes, sample/compute plan, and publication license.
3. Build the platform-neutral runner and Codex/Claude Code adapters, then run a small non-claim pilot to expose orchestration and oracle defects.
4. Freeze VibeBench v1, execute the powered matrix, and publish a versioned evidence dataset and report.

VibeBench is an evidence program, not a marketing demo. Its result may support, narrow, or reject a VEF effectiveness claim.

# VEF inheritance study v1 — frozen protocol

Status: frozen before comparative execution  
Frozen: 2026-08-14  
Owner: TASK-039  
Execution: TASK-040  
Reporting: TASK-041

## Question and claim boundary

This study asks whether an isolated coding agent inherits settled project intent more reliably when equivalent project knowledge is represented through VEF rather than ordinary well-written Markdown.

It does **not** test whether Markdown is better than no documentation, whether VEF's validator catches its declared structural errors, or whether the transaction engine closes inverse links. Those are separate conformance claims already covered by deterministic tests. It also cannot establish universal performance across models, repositories, or teams.

The protocol is frozen before any comparative output is inspected. Later corrections must be additive amendments with a reason and timestamp. They cannot replace this file, remove failed runs, change endpoint definitions, or alter the claim thresholds after results are known.

## Conditions

Each pair starts from one condition-neutral source fixture in [`fixtures.yml`](fixtures.yml). Code, tests, Git history, semantic facts, task prompt, and available tools are identical.

- **Control — ordinary durable docs:** the source facts are rendered into concise `VISION.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `PLAN.md`, `WORK.md`, and `AGENTS.md`. IDs are retained in prose, but there is no VEF package, canonical item store, typed relationship metadata, generated ledger, or VEF command.
- **Treatment — VEF:** the same source facts are rendered into the normal VEF surfaces, canonical per-item records, typed links, `AGENTS.md`, installed package, and enforced baseline. `vef create`, `vef update`, `vef setup`, and `vef check` are available.

The control is intentionally a strong documentation baseline. A no-documentation control would answer an easier and less useful question.

Before execution, a condition generator must produce both repositories from the same fixture manifest and emit a normalized semantic-fact report. The run is invalid before assignment if those reports differ. Boilerplate that does not encode fixture facts is excluded from the equivalence comparison and reported separately by byte/token count.

## Frozen fixtures and prompts

Three scenarios are defined in `fixtures.yml`:

1. `cache-persistence` tests inheritance of an accepted implementation decision and architecture boundary.
2. `import-retry` tests roadmap/task intent, dependency awareness, and settled retry constraints.
3. `privacy-export` tests a cross-cutting privacy decision while completing ordinary feature work.

The participant prompt is identical in both conditions:

> Read the repository instructions and durable project documentation. Complete the named task, including proportional tests, and reconcile any project state directly implied by your work. Do not ask for information already settled in the repository. Report what changed, what you verified, and any genuine blocker.

The named task and repository are supplied by the selected fixture. No condition-specific hint may be added to the participant prompt.

## Runtime and assignment

- Agent product: Codex coding agent.
- Model: `gpt-5.6-sol`.
- Reasoning effort: `high`.
- Runtime: Node.js 24 on the same Windows runner image for every run.
- Network: disabled.
- Tools: repository read/write and non-interactive shell only; no personal memory, prior conversation, connector, browser, or cross-run communication.
- Session: new isolated task and clean repository copy for every run.
- Human intervention: none. If the agent asks a question, the only response is: “Use repository evidence and make the safest reasonable assumption.”
- Limit: 30 elapsed minutes and 50,000 total model tokens per run. Hitting either limit is an outcome, not a reason to silently rerun.
- Sampling: 24 matched pairs—eight independent pairs per scenario, 48 sessions total.
- Order: within each pair, condition order is randomized from a committed randomization file generated before the first run. Never run both members in one agent context.
- Concurrency: paired members use the same concurrency class; do not run one locally and one under a materially different load.

If the exact model or environment is unavailable, execution stops. A prospective amendment may name a replacement before any run under that replacement is observed; old and new environments may not be pooled silently.

## Captured evidence

Every session produces one immutable run bundle:

- run manifest following [`run-manifest.example.json`](run-manifest.example.json);
- initial and final Git tree hashes;
- complete patch and final repository snapshot;
- participant prompt and final response;
- ordered tool-call transcript with timestamps and exit codes;
- model identifier, reasoning setting, environment, token counts, and elapsed time;
- all test/check output, including failures and repair loops;
- normalized final semantic-fact report;
- deviation and infrastructure-failure fields.

Secrets and personal data must not be placed in fixtures or bundles. Raw bundles remain immutable; publication may redact machine paths or credentials only through a separate derived copy with a redaction manifest.

## Endpoints

### Co-primary 1: inherited-intent score (0–12, blinded)

Two independent raters score the normalized patch, final task report, and condition-neutral semantic summary using [`scorecard.md`](scorecard.md):

- settled decision preserved: 0–4;
- architecture constraint preserved: 0–2;
- roadmap/task intent and status reconciled: 0–3;
- no unnecessary re-litigation of settled choices: 0–2;
- genuine uncertainty distinguished from settled evidence: 0–1.

### Co-primary 2: contradiction count (lower is better, deterministic)

The fixture oracle counts distinct final contradictions against frozen required/forbidden facts. Repeated manifestations of one root contradiction count once; independent contradictions count separately. The oracle and its tests are identical across conditions and must not parse VEF-specific success output as proof.

### Secondary endpoints

- task outcome quality, 0–4, scored blind against fixture acceptance tests and rubric;
- repository test pass/fail and hidden-oracle pass/fail;
- structural/project-state errors in the normalized semantic report;
- unnecessary clarification or decision-reopening count;
- number of file-write actions, manual structured-record edits, validation/check invocations, failed validation/check loops, and repair actions;
- input, output, cached, and total tokens when available;
- elapsed wall-clock time;
- completion, genuine block, timeout, tool failure, or unsafe/incorrect completion classification.

VEF-specific validator findings are reported descriptively but are not substituted for the condition-neutral contradiction oracle.

## Blinding and rating

Participants cannot be blind because the treatment exposes VEF. Outcome raters must be blind.

An evidence-preparation script assigns a random `EVAL-*` identifier, removes condition labels, VEF command transcripts, package names, canonical storage paths, and generated-ledger-only changes from the rater bundle. Equivalent record IDs remain because both conditions use them. Code/test changes, normalized semantic changes, final answer, and failures remain visible.

Two raters score every bundle independently. They must not access raw run manifests until scores are locked. Report weighted Cohen’s kappa for ordinal rubric items and intraclass correlation for the total score. A total-score disagreement greater than two points or any disagreement on a decision violation is adjudicated by a third blind rater; both original scores remain in the dataset.

## Analysis

The pair is the unit of analysis. No session is dropped for poor performance.

- Report every raw score and paired difference.
- Report median, mean, standard deviation, and a 95% paired bootstrap confidence interval using 10,000 resamples for each endpoint.
- Report completion/failure counts and fixture-level results; do not hide heterogeneous or negative scenarios behind one aggregate.
- Treat token and time results as descriptive when provider accounting or runner variance is incomplete.
- Do not impute missing outcomes. A non-infrastructure timeout receives the frozen failure score. A proven infrastructure failure is rerun once under the same assignment and both attempts are disclosed.
- No post-hoc endpoint becomes “primary.” Exploratory analyses must be labeled exploratory.

### Predeclared interpretation

- **Evidence supports “VEF improved inheritance in this study”** only if the treatment’s paired inherited-intent difference is positive with a 95% confidence interval excluding zero, contradiction count is no worse with its interval excluding a material increase of 0.25 contradictions per run, and mean task-quality difference is greater than -0.25.
- **Evidence supports only a directional hypothesis** if inherited-intent point estimates improve but uncertainty crosses zero or fixture results are materially heterogeneous.
- **Evidence does not support an inheritance claim** if inherited-intent does not improve, contradictions materially worsen, or task quality crosses the harm boundary.

Regardless of outcome, structural conformance, authoring convenience, inheritance quality, task quality, time, and tokens remain separate claims.

## Deviations and publication

Before the first participant run, commit:

- this protocol and fixture manifest;
- generator and condition-equivalence tests;
- oracle and hidden acceptance tests;
- randomization file;
- evidence preparation script;
- empty run manifest and scorecard templates.

TASK-040 may then execute the study. TASK-041 must publish protocol version, commit hashes, all non-sensitive raw evidence, scoring, uncertainty, failures, deviations, and limitations before any broad or paid promotion relies on the result.

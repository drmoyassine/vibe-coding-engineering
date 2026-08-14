# Transaction authoring engine replay

Run: 2026-08-14  
Fixture: `test/fixtures/transaction-authoring-17.json`  
Purpose: replay the baseline's 17-record structural shape through the transaction engine.

## Result

- 17 structured operation inputs: two vision themes, four roadmap items, eight tasks, and three decisions;
- one in-memory candidate and one explicit write transaction;
- zero invalid candidates, orphans, inverse warnings, duplicates, or cycles on the first deterministic pass;
- no canonical YAML/Markdown, backlink, lifecycle-date, provenance, or ledger content authored by the fixture;
- strict `vef check` passed immediately after the write, without a repair loop.

## Interpretation limit

This is an automated engine-conformance replay, not an independent unassisted-agent evaluation and not a causal claim
about token or elapsed-time improvement. It demonstrates that an already structured 17-record intent can cross the
new writer boundary without manual inverse maintenance. A later controlled agent run must still disclose model,
prompt, elapsed time, token use, and semantic scoring before comparing authoring overhead with the frozen baseline.

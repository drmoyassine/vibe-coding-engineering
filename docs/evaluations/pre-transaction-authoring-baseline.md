# Pre-transaction authoring baseline

Frozen: 2026-08-14  
Source: independent end-to-end consumer QA session against public VEF 0.1.0  
Purpose: preserve an unoptimized before-trace for the transactional authoring evaluation.

## Observed task

An agent scaffolded a clean repository, used the shipped schema guidance, and authored 17 structured records manually.
It then ran validation and repaired the reported graph inconsistencies.

## First-pass result

- 17 records authored;
- one validation error;
- three inverse-relationship warnings;
- three relationships had been written on one side but not the declared inverse;
- at least one validate/repair loop was required before the project state was coherent.

## What this evidence can and cannot establish

This is a real pre-optimization trace of manual authoring overhead, not a controlled proof that VEF improves agent
outcomes. Preserve the task shape and first-pass counts. Re-run the same authoring task against the transactional
release and compare first-pass validity, manual YAML edits, inverse-repair work, elapsed time, and token use. The later
evaluation must disclose model/version, prompts, repository fixture, scoring rules, and any differences from this trace.

import { projectLedgers } from '../lib/record-store.mjs';
import { inspectTransactionState, TransactionError } from '../lib/transactions.mjs';

/** Regenerate committed ledger projections from canonical per-item records. */
export async function projectCommand(opts) {
  const targetDir = opts.dir;
  if (!opts.check) {
    const state = await inspectTransactionState(targetDir);
    if (state.unresolved.length > 0) {
      throw new TransactionError(`Ledger projection is blocked by unresolved transaction(s): ${state.unresolved.map((journal) => journal.id).join(', ')}. Recover explicitly first.`);
    }
  }
  const result = await projectLedgers(targetDir, { write: !opts.check });
  console.log(`\n  Projecting canonical records: ${targetDir}\n`);

  if (result.stale.length === 0) {
    console.log('  ✓  All ledger projections are current');
    console.log('');
    return;
  }

  for (const projection of result.stale) {
    console.log(`  ${opts.check ? '✗' : '✓'}  ${projection.ledger}${opts.check ? ' is stale' : ' regenerated'}`);
  }
  console.log('');
  if (opts.check) process.exitCode = 1;
}

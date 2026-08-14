import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { load as loadYaml } from 'js-yaml';
import {
  applyTransaction,
  formatTransactionPlan,
  inspectTransactionState,
  planTransaction,
  recoverTransaction,
  TransactionError,
} from '../lib/transactions.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function readProposal(source, projectDir) {
  const path = source === '-' ? '<stdin>' : (isAbsolute(source) ? source : resolve(projectDir, source));
  const raw = source === '-' ? await readStdin() : await readFile(path, 'utf8');
  let proposal;
  try {
    proposal = loadYaml(raw);
  } catch (error) {
    throw new TransactionError(`Could not parse mutation proposal ${path}: ${error.message}`);
  }
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    throw new TransactionError(`Mutation proposal ${path} must contain one YAML or JSON object.`);
  }
  return proposal;
}

function createOperation(type, proposal) {
  const data = proposal.data
    ? structuredClone(proposal.data)
    : Object.fromEntries(Object.entries(proposal).filter(([key]) => !['type', 'body', 'relationships'].includes(key)));
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TransactionError('Create proposal data must be an object.');
  return {
    kind: 'create',
    type,
    data,
    body: proposal.body,
    relationships: proposal.relationships || {},
  };
}

function updateOperation(id, proposal, authority) {
  const allowed = new Set(['set', 'unset', 'body', 'relationships']);
  const unknown = Object.keys(proposal).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new TransactionError(`Unknown update proposal key(s): ${unknown.join(', ')}. Use set, unset, body, or relationships.`);
  if (proposal.set !== undefined && (!proposal.set || typeof proposal.set !== 'object' || Array.isArray(proposal.set))) {
    throw new TransactionError('Update proposal set must be an object.');
  }
  if (proposal.relationships !== undefined && (!proposal.relationships || typeof proposal.relationships !== 'object' || Array.isArray(proposal.relationships))) {
    throw new TransactionError('Update proposal relationships must be an object.');
  }
  return {
    kind: 'update',
    id,
    ...(authority ? { authority } : {}),
    set: proposal.set || {},
    unset: proposal.unset || [],
    ...(Object.prototype.hasOwnProperty.call(proposal, 'body') ? { body: proposal.body } : {}),
    relationships: proposal.relationships || {},
  };
}

function printResult(result, log = console.log) {
  if (result.applied === false) log('  No file changes were required.');
  else log(`  ✓ Transaction ${result.id} wrote ${result.files.length} validated file(s).`);
  for (const warning of result.warnings || []) log(`  ⚠ ${warning}`);
}

async function executeMutation(projectDir, operations, opts) {
  const plan = await planTransaction(projectDir, operations, { actor: opts.actor });
  if (opts.json) {
    if (!opts.write) {
      console.log(JSON.stringify({ mode: 'preview', plan }, null, 2));
      return { plan, result: null };
    }
    const result = await applyTransaction(plan);
    console.log(JSON.stringify({ mode: 'write', plan, result }, null, 2));
    return { plan, result };
  }

  console.log(`\n${formatTransactionPlan(plan, { includeDiff: true })}\n`);
  if (!opts.write) {
    console.log('  Preview only — no files were changed. Rerun with --write to apply this exact operation.\n');
    return { plan, result: null };
  }
  const result = await applyTransaction(plan);
  printResult(result);
  console.log('');
  return { plan, result };
}

export async function createCommand(type, opts) {
  const proposal = await readProposal(opts.from, opts.dir);
  if (String(type).toLowerCase() === 'batch') {
    if (!Array.isArray(proposal.operations) || proposal.operations.length === 0) {
      throw new TransactionError('A batch create proposal must contain a non-empty operations array.');
    }
    for (const operation of proposal.operations) {
      if (!operation || !['create', 'update'].includes(operation.kind)) {
        throw new TransactionError('Each batch operation must have kind: create or kind: update.');
      }
    }
    return executeMutation(opts.dir, structuredClone(proposal.operations), opts);
  }
  return executeMutation(opts.dir, [createOperation(type, proposal)], opts);
}

export async function updateCommand(id, opts) {
  const proposal = await readProposal(opts.from, opts.dir);
  return executeMutation(opts.dir, [updateOperation(id, proposal, opts.authority)], opts);
}

export async function recoverCommand(id, opts) {
  const direction = opts.forward ? 'forward' : opts.rollback ? 'rollback' : null;
  if (!direction) {
    const state = await inspectTransactionState(opts.dir);
    const pending = state.unresolved.find((journal) => journal.id === id);
    throw new TransactionError(
      pending
        ? `Transaction ${id} is ${pending.state}. Choose exactly one of --forward or --rollback.`
        : `Choose exactly one of --forward or --rollback for transaction ${id}.`,
    );
  }
  const result = await recoverTransaction(opts.dir, id, direction, { force: opts.force, actor: opts.actor });
  console.log(`\n  ✓ Transaction ${id} is ${result.state}; ${result.files.length} file(s) reconciled.`);
  for (const warning of result.warnings || []) console.log(`  ⚠ ${warning}`);
  console.log('');
  return result;
}

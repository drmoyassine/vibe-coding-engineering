/** `vef check` is the one strict, read-only local and CI enforcement gate. */

import { doctorCommand } from './doctor.mjs';

/** @param {{ dir: string }} opts */
export async function checkCommand(opts) {
  const result = await doctorCommand({ dir: opts.dir, fix: false, quiet: true });
  if (result.ok) console.log('  ✓ CHECK PASSED — VEF CORE ENFORCED\n');
  else console.log('  ✗ CHECK FAILED — run vef doctor for details, then vef setup after any required reconciliation.\n');
  return result;
}

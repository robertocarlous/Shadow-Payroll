import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { ledger } from '../src/generated/payroll/index.js';

const fs = await import('node:fs');
const hex = fs.readFileSync(process.env.STATE_FILE ?? '/tmp/contract-state.hex', 'utf8').trim();
const contractState = ContractState.deserialize(Uint8Array.from(Buffer.from(hex, 'hex')));
const l = ledger(contractState.data);
const out = {
  initialized: l.initialized,
  totalBudget: l.totalBudget.toString(),
  totalClaimed: l.totalClaimed.toString(),
  claimsMade: typeof l.usedNullifiers.size === 'function' ? l.usedNullifiers.size() : l.usedNullifiers.size,
  reconciled: l.initialized && l.totalClaimed === l.totalBudget,
};
for (const [k, v] of Object.entries(out)) {
  console.log(`${k}: ${v}`);
}

#!/usr/bin/env node
// Vendors the compiled payroll contract's JS/TS bindings from
// ../contracts/managed into this app's src/generated so the dashboard can
// decode public ledger state (deposited/claimed/reconciled).
//
// The dashboard is read-only (no wallet, no proving), so unlike a
// transaction-submitting frontend it does NOT need the zkir/keys assets --
// only the `ledger()` decoder function and its types.
//
// The frontend is deployed as a static build (Vercel doesn't have the
// Compact compiler), so these bindings are committed rather than
// regenerated at deploy time. Re-run this after `npm run compile` at the
// repo root whenever the contract changes.
import { existsSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');
const source = join(repoRoot, 'contracts', 'managed', 'payroll');

if (!existsSync(source)) {
  console.error(`\n❌ ${source} does not exist. Run \`npm run compile\` at the repo root first.\n`);
  process.exit(1);
}

const genTarget = join(__dirname, '..', 'src', 'generated', 'payroll');
rmSync(genTarget, { recursive: true, force: true });
mkdirSync(genTarget, { recursive: true });
for (const file of ['index.js', 'index.d.ts', 'index.js.map']) {
  cpSync(join(source, 'contract', file), join(genTarget, file));
}

console.log(`✅ Synced payroll contract bindings into:\n   ${genTarget}`);

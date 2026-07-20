#!/usr/bin/env node
// Vendors the compiled payroll contract's assets from ../contracts/managed
// into this app:
//   - JS/TS bindings -> src/generated (bundled by Vite/Rollup) so the
//     read-only dashboard can decode public ledger state.
//   - zkir + keys + contract-info -> public/managed/payroll (served as
//     static files) so the browser's FetchZkConfigProvider and the
//     wallet-connected claim flow's proof-server can fetch them at proving
//     time (see src/midnight/contractClient.ts).
//
// The frontend is deployed as a static build (Vercel doesn't have the
// Compact compiler), so these assets are committed rather than regenerated
// at deploy time. Re-run this after `npm run compile` at the repo root
// whenever the contract changes.
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

const publicTarget = join(__dirname, '..', 'public', 'managed', 'payroll');
rmSync(publicTarget, { recursive: true, force: true });
mkdirSync(publicTarget, { recursive: true });
cpSync(join(source, 'keys'), join(publicTarget, 'keys'), { recursive: true });
cpSync(join(source, 'zkir'), join(publicTarget, 'zkir'), { recursive: true });
cpSync(join(source, 'compiler', 'contract-info.json'), join(publicTarget, 'contract-info.json'));

console.log(`✅ Synced payroll contract assets into:\n   ${genTarget}\n   ${publicTarget}`);

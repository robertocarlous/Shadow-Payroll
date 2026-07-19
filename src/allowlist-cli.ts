/**
 * Employer-side tool: turn a plain payroll list into a private allowlist.
 *
 * Usage:
 *   npx tsx src/allowlist-cli.ts <input.json> [outputDir]
 *
 * <input.json> is a plain array: [{ "payeeId": "alice", "amount": 100 }, ...]
 *
 * Writes, under outputDir (default .payroll/):
 *   - root.json                 the public Merkle root + total budget
 *                                (these two values are what fundPayroll takes)
 *   - credentials/<payeeId>.json  one private claim credential per payee --
 *                                distribute each file to its payee out of
 *                                band (e.g. encrypted email). Never commit
 *                                these; .gitignore already excludes them.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildAllowlist, verifyCredential, type AllowlistEntry } from './allowlist.js';

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function main() {
  const [, , inputPath, outputDirArg] = process.argv;
  if (!inputPath) {
    console.error('Usage: npx tsx src/allowlist-cli.ts <input.json> [outputDir]');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  if (!Array.isArray(raw) || raw.length === 0) {
    console.error('Input must be a non-empty JSON array of { payeeId, amount }');
    process.exit(1);
  }

  const entries: AllowlistEntry[] = raw.map((r: { payeeId: string; amount: number | string }) => ({
    payeeId: String(r.payeeId),
    amount: BigInt(r.amount),
  }));

  console.log(`\nBuilding allowlist for ${entries.length} payee(s)...\n`);
  const { root, totalBudget, credentials } = buildAllowlist(entries);

  const outputDir = path.resolve(outputDirArg ?? '.payroll');
  const credentialsDir = path.join(outputDir, 'credentials');
  fs.mkdirSync(credentialsDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, 'root.json'),
    `${JSON.stringify({ allowlistRoot: toHex(root), totalBudget: totalBudget.toString() }, null, 2)}\n`,
  );

  for (const cred of credentials) {
    const ok = verifyCredential(root, cred);
    if (!ok) throw new Error(`Internal error: credential for ${cred.payeeId} does not verify`);
    fs.writeFileSync(
      path.join(credentialsDir, `${cred.payeeId}.json`),
      `${JSON.stringify(
        {
          payeeId: cred.payeeId,
          secret: toHex(cred.secret),
          amount: cred.amount.toString(),
          siblings: cred.siblings.map(toHex),
          directions: cred.directions,
        },
        null,
        2,
      )}\n`,
    );
  }

  console.log(`Allowlist root:  ${toHex(root)}`);
  console.log(`Total budget:    ${totalBudget.toString()}`);
  console.log(`\nWrote ${credentials.length} credential file(s) to ${credentialsDir}`);
  console.log(`Wrote root.json to ${outputDir}`);
  console.log(`\nNext:`);
  console.log(`  1. npm run setup        # deploys the contract`);
  console.log(`  2. npm run cli          # choose "fund payroll", paste root.json values`);
  console.log(`  3. give each payee their credentials/<payeeId>.json privately`);
  console.log(`  4. each payee runs: npm run cli -- --claim credentials/<payeeId>.json\n`);
}

main();

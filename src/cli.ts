/**
 * Interactive CLI for Shadow Payroll: employer funds the payroll, payees
 * claim their private allocation, and anyone can read the public audit
 * state (deposited / claimed / reconciled).
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';

// Midnight SDK imports
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken, type WalletContext } from './wallet';
import { makeWitnesses } from './witnesses';
import type { PayeeCredential } from './allowlist';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'payroll');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: npm run compile\n');
  process.exit(1);
}

const Payroll = await import(pathToFileURL(contractPath).href);

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function loadCredential(filePath: string): PayeeCredential {
  const raw = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8'));
  return {
    payeeId: raw.payeeId,
    secret: fromHex(raw.secret),
    amount: BigInt(raw.amount),
    siblings: raw.siblings.map(fromHex),
    directions: raw.directions,
  };
}

function makeCompiledContract(credential: PayeeCredential | null) {
  return CompiledContract.make('payroll', Payroll.Contract).pipe(
    CompiledContract.withWitnesses(makeWitnesses(credential) as any),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
}

// ─── Providers ─────────────────────────────────────────────────────────────────

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword = process.env.PRIVATE_STATE_PASSWORD?.trim() || 'Local-Devnet-Development-Placeholder-1';
  const state = await walletCtx.wallet.waitForSyncedState();

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signedRecipe = await walletCtx.wallet.signRecipe(recipe, (payload) =>
        walletCtx.unshieldedKeystore.signData(payload),
      );
      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shadow-payroll-state',
      accountId,
      privateStoragePasswordProvider: () => privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

function printLedger(l: any) {
  const reconciled = l.initialized && l.totalClaimed === l.totalBudget;
  console.log(`\n  📋 Initialized:     ${l.initialized}`);
  console.log(`  📋 Allowlist root:  ${Buffer.from(l.allowlistRoot).toString('hex')}`);
  console.log(`  📋 Total budget:    ${l.totalBudget.toString()}`);
  console.log(`  📋 Total claimed:   ${l.totalClaimed.toString()}`);
  console.log(`  📋 Claims made:     ${l.usedNullifiers.size().toString()}`);
  console.log(`  📋 Reconciled:      ${reconciled ? '✅ fully reconciled' : '❌ not yet'}\n`);
}

// ─── Main CLI ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                   Shadow Payroll CLI                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const rl = createInterface({ input: stdin, output: stdout });

  const deployment = getDeployment(network);
  if (!deployment) {
    console.error(`No deploy on file for network ${network}. Run \`npm run setup -- --network ${network}\` first.`);
    process.exit(1);
  }
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Network: ${network}\n`);

  try {
    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
    const restoredCount = Object.values(walletCtx.restored).filter(Boolean).length;
    if (restoredCount > 0) {
      console.log(`  Restored ${restoredCount}/3 child wallets from .midnight-wallet-state — sync will resume from saved point.`);
    }

    console.log('  Syncing with network...');
    const syncStart = Date.now();
    const syncInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - syncStart) / 1000);
      process.stdout.write(`\r  ⏳ Still syncing... (${elapsed}s elapsed)   `);
    }, 5000);
    const state = await walletCtx.wallet.waitForSyncedState();
    clearInterval(syncInterval);
    process.stdout.write('\r  ✓ Synced with network.                                      \n');

    await persistWalletState(network, walletCtx);
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    if (balance === 0n && network !== 'undeployed' && networkConfig.faucet) {
      const address = walletCtx.unshieldedKeystore.getBech32Address();
      console.log('  ⚠ Wallet has no tNight. Fund it from the faucet to send transactions:');
      console.log(`     ${networkConfig.faucet}`);
      console.log(`     Wallet address: ${address}\n`);
    }

    console.log('  Connecting to contract...');
    const providers = await createProviders(walletCtx);
    let deployed: any = await findDeployedContract(providers, {
      compiledContract: makeCompiledContract(null) as any,
      contractAddress: deployment.address,
    });
    console.log('  ✅ Connected!\n');

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Fund payroll (employer) — needs .payroll/root.json');
      console.log('  2. Claim payout (payee) — needs your credentials/<id>.json');
      console.log('  3. View public audit state (deposited / claimed / reconciled)');
      console.log('  4. Check wallet balance');
      console.log('  5. Exit\n');

      const choice = await rl.question('  Your choice: ');

      switch (choice.trim()) {
        case '1': {
          const rootPath = (await rl.question('  Path to root.json [.payroll/root.json]: ')).trim() || '.payroll/root.json';
          try {
            const { allowlistRoot, totalBudget } = JSON.parse(fs.readFileSync(path.resolve(rootPath), 'utf-8'));
            console.log('\n  Submitting fundPayroll transaction (this may take 30-60 seconds)...');
            const tx = await deployed.callTx.fundPayroll(fromHex(allowlistRoot), BigInt(totalBudget));
            console.log(`\n  ✅ Payroll funded. Budget: ${totalBudget}`);
            console.log(`  Transaction ID: ${tx.public.txId}\n`);
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '2': {
          const credPath = await rl.question('  Path to your credential JSON: ');
          try {
            const credential = loadCredential(credPath.trim());
            console.log(`\n  Reconnecting with credential for "${credential.payeeId}"...`);
            deployed = await findDeployedContract(providers, {
              compiledContract: makeCompiledContract(credential) as any,
              contractAddress: deployment.address,
            });
            console.log('  Submitting claim transaction (this may take 30-60 seconds)...');
            const tx = await deployed.callTx.claim();
            console.log(`\n  ✅ Claim submitted for "${credential.payeeId}"`);
            console.log(`  Transaction ID: ${tx.public.txId}\n`);
            // Reconnect without a credential loaded so subsequent menu
            // actions don't accidentally reuse it.
            deployed = await findDeployedContract(providers, {
              compiledContract: makeCompiledContract(null) as any,
              contractAddress: deployment.address,
            });
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '3': {
          console.log('\n  Reading public payroll state from the chain...');
          try {
            const contractState = await providers.publicDataProvider.queryContractState(deployment.address);
            if (contractState) {
              printLedger(Payroll.ledger(contractState.data));
            } else {
              console.log('\n  📋 No state found (contract state empty)\n');
            }
          } catch (error) {
            console.error('\n  ❌ Failed:', error instanceof Error ? error.message : error);
          }
          break;
        }

        case '4': {
          console.log('\n  Checking balance...');
          const currentState = await walletCtx.wallet.waitForSyncedState();
          const currentBalance = currentState.unshielded.balances[unshieldedToken().raw] ?? 0n;
          const dustBalance = currentState.dust.balance(new Date());
          console.log(`\n  tNight: ${currentBalance.toLocaleString()}`);
          console.log(`  DUST: ${dustBalance.toLocaleString()}\n`);
          break;
        }

        case '5':
          running = false;
          console.log('\n  👋 Goodbye!\n');
          break;

        default:
          console.log('\n  ❌ Invalid choice. Please enter 1-5.\n');
      }
    }

    await persistWalletState(network, walletCtx);
    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);

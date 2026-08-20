import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';
import { makeWitnesses } from './witnesses';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(__dirname, '..', 'contracts', 'managed', 'payroll');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
const Payroll = await import(pathToFileURL(contractPath).href);

const rootHex = process.env.ROOT_HEX ?? '';
const budget = BigInt(process.env.BUDGET ?? '0');
if (!rootHex || budget === 0n) {
  console.error('Usage: ROOT_HEX=<hex> BUDGET=<n> npx tsx src/_fund-one.ts');
  process.exit(1);
}

function makeCompiledContract() {
  return CompiledContract.make('payroll', Payroll.Contract).pipe(
    CompiledContract.withWitnesses(makeWitnesses(null) as any),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const deployment = getDeployment(network);
  if (!deployment) {
    console.error('No deploy on file for ' + network);
    process.exit(1);
  }
  console.log(`Contract: ${deployment.address} (${network})`);

  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  const state = await walletCtx.wallet.waitForSyncedState();
  await persistWalletState(network, walletCtx);
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`Wallet balance: ${balance.toLocaleString()} tNight`);

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
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shadow-payroll-state',
      accountId,
      privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(networkConfig.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  let deployed: any = null;
  for (let attempt = 1; attempt <= 5 && !deployed; attempt++) {
    try {
      deployed = await findDeployedContract(providers, {
        compiledContract: makeCompiledContract() as any,
        contractAddress: deployment.address,
      });
      console.log(`findDeployedContract OK (attempt ${attempt})`);
    } catch (error) {
      console.log(`findDeployedContract attempt ${attempt} failed: ${(error as Error).message}`);
      if (attempt < 5) await sleep(5000);
    }
  }
  if (!deployed) {
    console.error('Could not connect to contract after 5 attempts');
    process.exit(1);
  }

  const root = new Uint8Array(Buffer.from(rootHex, 'hex'));
  const MAX_ATTEMPTS = 5;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log('Submitting fundPayroll (proving + signing)...');
      const tx = await deployed.callTx.fundPayroll(root, budget, 0n, randomBytes(32));
      console.log(`\nFUND OK. txId: ${tx.public.txId}`);
      await persistWalletState(network, walletCtx);
      await walletCtx.wallet.stop();
      process.exit(0);
    } catch (error: any) {
      const msg = String(error?.message ?? error);
      console.log(`FUND attempt ${attempt} failed: ${msg.slice(0, 200)}`);
      if (attempt < MAX_ATTEMPTS) await sleep(6000);
    }
  }
  console.error('FUND FAILED after all attempts');
  await walletCtx.wallet.stop();
  process.exit(1);
}

main().catch((error) => {
  console.error('FATAL:', error);
  process.exit(1);
});

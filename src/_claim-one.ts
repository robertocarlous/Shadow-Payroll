import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { provingProvider } from '@midnight-ntwrk/zkir-v2';
import { createProofProvider } from '@midnight-ntwrk/midnight-js-types';
import { resolveNetwork, getOrCreateSeed, getDeployment } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';
import { makeWitnesses } from './witnesses';
import type { PayeeCredential } from './allowlist';

const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = process.env.ZK_CONFIG_PATH
  ? path.resolve(process.env.ZK_CONFIG_PATH)
  : path.resolve(__dirname, '..', 'contracts', 'managed', 'payroll');
const contractPath = path.join(zkConfigPath, 'contract', 'index.js');
const Payroll = await import(pathToFileURL(contractPath).href);

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

const credential: PayeeCredential = (() => {
  const credPath = process.env.CREDENTIAL_PATH ?? 'docs/try-it-yourself/credentials/judge1.json';
  const raw = JSON.parse(fs.readFileSync(path.resolve(credPath), 'utf-8'));
  return {
    payeeId: raw.payeeId,
    secret: fromHex(raw.secret),
    amount: BigInt(raw.amount),
    siblings: raw.siblings.map(fromHex),
    directions: raw.directions,
  };
})();

function makeCompiledContract(cred: PayeeCredential | null) {
  return CompiledContract.make('payroll', Payroll.Contract).pipe(
    CompiledContract.withWitnesses(makeWitnesses(cred) as never),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );
}

function summarize(v: unknown, depth = 0, seen = new Set<unknown>()): string {
  if (typeof v === 'string') {
    return v.length > 300 ? `<string ${v.length} chars>` : JSON.stringify(v);
  }
  if (typeof v === 'bigint') return v.toString() + 'n';
  if (typeof v === 'number' || typeof v === 'boolean' || v == null) return JSON.stringify(v);
  if (seen.has(v)) return '[circular]';
  seen.add(v);
  if (Array.isArray(v)) {
    if (v.length > 50) return `<array ${v.length} items>`;
    return `[${v.map((x) => summarize(x, depth + 1, seen)).join(', ')}]`;
  }
  if (typeof v === 'object') {
    const toJSON = (v as { toJSON?: () => unknown }).toJSON;
    if (typeof toJSON === 'function') {
      const json = toJSON.call(v);
      if (json !== v) return summarize(json, depth + 1, seen);
    }
    const own = Object.getOwnPropertyNames(v as object)
      .filter((k) => {
        const d = Object.getOwnPropertyDescriptor(v as object, k);
        return d && typeof d.get !== 'function';
      })
      .map((k) => [k, (v as Record<string, unknown>)[k]] as const);
    if (own.length > 60) return `<object ${own.length} fields>`;
    return `{${own.map(([k, x]) => `${k}: ${summarize(x, depth + 1, seen)}`).join(', ')}}`;
  }
  return String(v);
}

function describeChain(e: unknown): string {
  const parts: string[] = [];
  let c: unknown = e;
  const seen = new Set<unknown>();
  while (c != null && !seen.has(c)) {
    seen.add(c);
    parts.push(summarize(c));
    if (c instanceof Error) c = (c as { cause?: unknown }).cause;
    else if (typeof c === 'object') {
      const o = c as Record<string, unknown>;
      c = o.cause ?? o.failure ?? o.error;
    } else c = undefined;
  }
  return parts.join('\n  <- caused by: ');
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

  const DUMP_TX = process.env.DUMP_TX === '1';
  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      if (DUMP_TX) {
        console.log('\nDUMP proven(unbalanced) tx:');
        console.log(tx.toString(true));
      }
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signedRecipe = await walletCtx.wallet.signRecipe(recipe, (payload) =>
        walletCtx.unshieldedKeystore.signData(payload),
      );
      const finalTx = await walletCtx.wallet.finalizeRecipe(signedRecipe);
      if (DUMP_TX) {
        console.log('\nDUMP balanced+final tx:');
        console.log(finalTx.toString(true));
        const hex = Buffer.from(finalTx.serialize()).toString('hex');
        fs.writeFileSync('/tmp/cli-balanced.hex', hex);
        console.log('DUMP hex written to /tmp/cli-balanced.hex len=' + hex.length);
      }
      return finalTx;
    },
    submitTx: (tx: any) => {
      if (DUMP_TX) {
        console.log('\nDUMP would-submit tx (skipping submission):');
        console.log(tx.toString(true));
        process.exit(0);
      }
      return walletCtx.wallet.submitTransaction(tx) as any;
    },
  };
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = walletCtx.unshieldedKeystore.getBech32Address().toString();

  const PROVE_MODE = process.env.PROVE_MODE ?? 'http';
  let proofProvider: any;
  if (PROVE_MODE === 'wasm') {
    const paramsCache = new Map<string, Uint8Array>();
    const keyMaterialProvider = {
      async lookupKey(keyLocation: string) {
        console.log('lookupKey(' + JSON.stringify(keyLocation) + ')');
        const [circuit] = keyLocation.split('/').slice(-1);
        if (circuit === 'zswap' || circuit === 'dust' || keyLocation.includes('zswap') || keyLocation.includes('dust')) {
          const s3 = 'https://midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com';
          const ver = 9;
          const pth =
            {
              'midnight/zswap/spend': `zswap/${ver}/spend`,
              'midnight/zswap/output': `zswap/${ver}/output`,
              'midnight/zswap/sign': `zswap/${ver}/sign`,
              'midnight/dust/spend': `dust/${ver}/spend`,
            }[keyLocation] ?? keyLocation.split('/').slice(-2).join('/');
          const fetchB = async (ext: string) => new Uint8Array(await (await fetch(`${s3}/${pth}${ext}`)).arrayBuffer());
          return { proverKey: await fetchB('.prover'), verifierKey: await fetchB('.verifier'), ir: await fetchB('.bzkir') };
        }
        const base = zkConfigPath;
        const rd = async (sub: string, ext: string) => fs.readFileSync(path.join(base, sub, circuit + ext));
        const material = {
          proverKey: new Uint8Array(await rd('keys', '.prover')),
          verifierKey: new Uint8Array(await rd('keys', '.verifier')),
          ir: new Uint8Array(await rd('zkir', '.bzkir')),
        };
        console.log(`lookupKey(${JSON.stringify(keyLocation)}) -> prover ${material.proverKey.length}B verifier ${material.verifierKey.length}B ir ${material.ir.length}B`);
        return material;
      },
      async getParams(k: number) {
        console.log('getParams(' + k + ')');
        const cacheKey = `params-${k}`;
        if (paramsCache.has(cacheKey)) return paramsCache.get(cacheKey)!;
        const url = `https://midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com/bls_midnight_2p${k}`;
        const data = new Uint8Array(await (await fetch(url)).arrayBuffer());
        paramsCache.set(cacheKey, data);
        return data;
      },
    };
    proofProvider = createProofProvider(provingProvider(keyMaterialProvider) as any);
    console.log('Using in-process WASM proving (Lace-equivalent), key dir: ' + zkConfigPath);
  } else {
    proofProvider = httpClientProofProvider(networkConfig.proofServer, zkConfigProvider);
    console.log('Using HTTP proof server: ' + networkConfig.proofServer);
  }
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shadow-payroll-state',
      accountId,
      privateStoragePasswordProvider: () => 'Local-Devnet-Development-Placeholder-1',
    }),
    publicDataProvider: indexerPublicDataProvider(networkConfig.indexer, networkConfig.indexerWS),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider: walletProvider,
  };

  let deployed: any = null;
  for (let attempt = 1; attempt <= 5 && !deployed; attempt++) {
    try {
      deployed = await findDeployedContract(providers, {
        compiledContract: makeCompiledContract(credential) as any,
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

  console.log('Submitting claim (proving + signing)...');
  try {
    const tx = await deployed.callTx.claim(0n);
    console.log(`\nCLAIM OK. txId: ${tx.public.txId}`);
  } catch (error) {
    console.log('\nCLAIM FAILED. Full error chain:\n');
    console.log(describeChain(error));
  }
  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
}

main().catch((error) => {
  console.error('FATAL:', describeChain(error));
  process.exit(1);
});

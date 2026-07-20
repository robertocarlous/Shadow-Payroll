// Wires together every provider needed to call claim() on the payroll
// contract from the browser, using a connected Lace wallet for
// signing/balancing/submitting instead of a local seed.
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import * as Payroll from '../generated/payroll/index.js';
import { NETWORK_CONFIGS, PROOF_SERVER_URL, type NetworkId } from '../network';
import { makeWalletAndMidnightProvider, makeProofProvider } from './laceProviders';
import { makeWitnesses, type PayeeCredential } from './witnesses';
import { describeError } from './errors';

export type DustRetryCallback = (attempt: number, maxAttempts: number) => void;

// A brand-new (or recently used) wallet's reported DUST balance is a
// time-projection of what its registered NIGHT will eventually generate;
// the tx-builder only spends what the *next block's timestamp* accounts
// for, which can lag wall-clock by roughly a block right after funding or
// registration. That shows up as "Insufficient Funds: could not balance
// dust" even when DUST is genuinely accruing -- the same transient failure
// the root CLI's deploy.ts already retries around.
async function withDustRetry<T>(fn: () => Promise<T>, onRetry?: DustRetryCallback): Promise<T> {
  const MAX_RETRIES = 20;
  const RETRY_DELAY_MS = 5000;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const description = describeError(err);
      const isDustShortage = /insufficient funds|not enough dust|could not balance dust/i.test(description);
      if (!isDustShortage || attempt === MAX_RETRIES) throw err;
      onRetry?.(attempt, MAX_RETRIES);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error('unreachable');
}

const ZK_BASE_URL = `${window.location.origin}/managed/payroll`;

export async function submitClaim(
  api: ConnectedAPI,
  networkId: NetworkId,
  contractAddress: string,
  credential: PayeeCredential,
  onDustRetry?: DustRetryCallback,
): Promise<{ txId: string }> {
  setNetworkId(networkId);

  const config = await api.getConfiguration().catch(() => null);
  const fallback = NETWORK_CONFIGS[networkId];
  const indexer = config?.indexerUri ?? fallback.indexer;
  const indexerWS = config?.indexerWsUri ?? fallback.indexerWS;

  // Explicit native fetch: FetchZkConfigProvider defaults to cross-fetch,
  // whose environment detection can pick its Node (node-fetch) code path
  // instead of the browser one once vite-plugin-node-polyfills is active,
  // silently breaking the zk-asset fetch. Binding the real browser fetch
  // sidesteps that detection entirely.
  const zkConfigProvider = new FetchZkConfigProvider<string>(ZK_BASE_URL, window.fetch.bind(window));
  const { unshieldedAddress } = await api.getUnshieldedAddress();

  const compiledContract = CompiledContract.make('payroll', Payroll.Contract).pipe(
    CompiledContract.withWitnesses(makeWitnesses(credential) as any),
    CompiledContract.withCompiledFileAssets(ZK_BASE_URL),
  );

  const walletAndMidnightProvider = await makeWalletAndMidnightProvider(api, networkId);
  const proofProvider = await makeProofProvider(api, zkConfigProvider, PROOF_SERVER_URL);

  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'shadow-payroll-browser-state',
      accountId: unshieldedAddress,
      // No secret is stored via this provider -- the witness reads directly
      // from the parsed credential (see witnesses.ts). The SDK still
      // requires a password with >=16 chars and 3+ character classes to
      // open the local (IndexedDB) store.
      privateStoragePasswordProvider: () => 'Shadow-Payroll-Browser-Store-9!',
    }),
    // Explicit webSocketImpl: the package defaults to the `ws` package's
    // WebSocket, which doesn't exist in a browser bundle -- the browser's
    // native WebSocket global replaces it.
    publicDataProvider: indexerPublicDataProvider(indexer, indexerWS, WebSocket as any),
    zkConfigProvider,
    proofProvider,
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };

  const deployed: any = await findDeployedContract(providers, {
    compiledContract: compiledContract as any,
    contractAddress,
  });

  const tx = await withDustRetry<any>(() => deployed.callTx.claim(), onDustRetry);
  return { txId: tx.public.txId as string };
}

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

import { persistentHash, CompactTypeVector, Bytes32Descriptor } from '@midnight-ntwrk/compact-runtime';
import * as Payroll from '../generated/payroll/index.js';
import { NETWORK_CONFIGS, PROOF_SERVER_URL, type NetworkId } from '../network';
import { makeWalletAndMidnightProvider, makeProofProvider } from './laceProviders';
import { makeWitnesses, type PayeeCredential } from './witnesses';
import { describeError } from './errors';

export type ClaimRetryKind = 'dust' | 'submission';
export type ClaimRetryInfo = { attempt: number; max: number; kind: ClaimRetryKind };
export type ClaimRetryCallback = (info: ClaimRetryInfo) => void;

export type ClaimResult = { txId: string | null; landed: boolean };

// A brand-new (or recently used) wallet's reported DUST balance is a
// time-projection of what its registered NIGHT will eventually generate;
// the tx-builder only spends what the *next block's timestamp* accounts
// for, which can lag wall-clock by roughly a block right after funding or
// registration. Shows up as "Insufficient Funds: could not balance dust"
// even when DUST is genuinely accruing.
function isDustShortage(description: string): boolean {
  return /insufficient funds|not enough dust|could not balance dust/i.test(description);
}

// Submission through Lace surfaces as "Transaction submission failed /
// Transaction submission error" with an (effect-library) cause that usually
// has no inner message. Two distinct things hide behind that opaque banner:
//
// 1. Preview's RPC node cleanly closing its websocket mid-submission, so the
//    tx may or may not have reached the chain (the loop below re-checks the
//    nullifier to detect the "it actually landed" case).
// 2. The node rejecting the tx because its DUST spend proof went stale
//    between balancing and arrival (Custom error 170) -- in-browser proving
//    of the 19MB claim key takes long enough that this is common. Same-bytes
//    resubmission can never fix this; the tx must be rebuilt so a fresh
//    DUST proof is generated. That is why retrying the whole claim() call
//    (fresh balance + fresh proof) is required, not just resubmitting.
function isRetryableSubmission(description: string): boolean {
  return /transaction submission (error|failed)|submissionerror/i.test(description);
}

const ZK_BASE_URL = `${window.location.origin}/managed/payroll`;

// Recomputes the `payeeNullifier` circuit output off-chain (see
// contracts/payroll.compact: `persistentHash(["shadow-payroll:nullifier:v1",
// secret])`). Used to detect an already-claimed credential before the wallet
// wastes DUST building and signing a proof the node will reject with an
// opaque SubmissionError (empty cause).
const NULLIFIER_DOMAIN = new Uint8Array(32);
new TextEncoder().encodeInto('shadow-payroll:nullifier:v1', NULLIFIER_DOMAIN);
const NULLIFIER_VECTOR_TYPE = new CompactTypeVector(2, Bytes32Descriptor);

function computeNullifier(secret: Uint8Array): Uint8Array {
  return persistentHash(NULLIFIER_VECTOR_TYPE, [NULLIFIER_DOMAIN, secret]);
}

// True when the credential's nullifier is already spent on-chain. The wallet
// connects, so we can read the live contract state directly from the indexer
// instead of guessing from the (cryptic) submission error.
async function isAlreadyClaimed(
  publicDataProvider: { queryContractState(address: string): Promise<unknown> },
  contractAddress: string,
  credential: PayeeCredential,
): Promise<boolean> {
  const contractState = await publicDataProvider.queryContractState(contractAddress);
  if (contractState === null || typeof contractState !== 'object') return false;
  const ledger = Payroll.ledger((contractState as { data: unknown }).data as any);
  const nullifier = computeNullifier(credential.secret);
  return ledger.usedNullifiers.member(nullifier);
}

// True when the credential's payee has been removed by the employer.
async function isRemoved(
  publicDataProvider: { queryContractState(address: string): Promise<unknown> },
  contractAddress: string,
  credential: PayeeCredential,
): Promise<boolean> {
  const contractState = await publicDataProvider.queryContractState(contractAddress);
  if (contractState === null || typeof contractState !== 'object') return false;
  const ledger = Payroll.ledger((contractState as { data: unknown }).data as any);
  const nullifier = computeNullifier(credential.secret);
  return ledger.removedPayees.member(nullifier);
}

export async function submitClaim(
  api: ConnectedAPI,
  networkId: NetworkId,
  contractAddress: string,
  credential: PayeeCredential,
  onRetry?: ClaimRetryCallback,
): Promise<ClaimResult> {
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

  // Fail fast with a clear message when this credential has already been
  // spent -- otherwise the node rejects the duplicate nullifier at submit
  // time with an opaque SubmissionError (empty `cause`), which is what
  // surfaced after a prior attempt's tx actually landed despite the wallet
  // channel dying mid-flight.
  if (await isAlreadyClaimed(providers.publicDataProvider, contractAddress, credential)) {
    throw new Error(
      'This payout credential has already been claimed on-chain (its nullifier is already spent). ' +
        'No further claim is possible for it.',
    );
  }

  // Fail fast when the employer has removed this payee before they could claim.
  if (await isRemoved(providers.publicDataProvider, contractAddress, credential)) {
    throw new Error(
      'This payee has been removed from the payroll by the employer. ' +
        'No claim is possible for this credential.',
    );
  }

  const deployed: any = await findDeployedContract(providers, {
    compiledContract: compiledContract as any,
    contractAddress,
  });

  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 6000;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    // If a previous attempt's tx actually landed despite the wallet reporting
    // a submission error (Preview's node is known to close the socket right
    // as a submission begins), the nullifier is spent by now. Detect that
    // and report success instead of re-prompting the wallet to re-spend it.
    if (await isAlreadyClaimed(providers.publicDataProvider, contractAddress, credential)) {
      return { txId: null, landed: true };
    }
    try {
      const tx = await deployed.callTx.claim(0n);
      return { txId: tx.public.txId as string, landed: false };
    } catch (err) {
      const description = describeError(err);
      const dust = isDustShortage(description);
      const submission = isRetryableSubmission(description);
      if ((!dust && !submission) || attempt === MAX_RETRIES) throw err;
      onRetry?.({ attempt, max: MAX_RETRIES, kind: dust ? 'dust' : 'submission' });
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error('unreachable');
}

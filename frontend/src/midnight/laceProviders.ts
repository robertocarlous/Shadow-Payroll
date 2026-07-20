// Bridges the Midnight DApp Connector API's ConnectedAPI (Lace's public
// surface for webpages) to the ContractProviders shape midnight-js-contracts
// expects (WalletProvider + MidnightProvider + ProofProvider). The two APIs
// don't line up 1:1: the connector API works with hex-encoded, bech32m
// addresses and delegates proving to the wallet, while midnight-js-contracts
// works with typed Transaction objects and a local key-material provider.
import { Buffer } from 'buffer';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { Transaction, type FinalizedTransaction } from '@midnight-ntwrk/ledger-v8';
import { createProofProvider, type ProofProvider } from '@midnight-ntwrk/midnight-js-types';
import type { WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { MidnightProvider } from '@midnight-ntwrk/midnight-js-types';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { MidnightBech32m, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
import { describeError } from './errors';

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

/**
 * Resolves the wallet's shielded coin/encryption public keys (bech32m,
 * as returned by the connector API) into the raw hex form the ledger/proof
 * layer expects.
 */
async function resolveShieldedKeys(api: ConnectedAPI, networkId: string) {
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } = await api.getShieldedAddresses();
  const coinPublicKey = ShieldedCoinPublicKey.codec.decode(networkId, MidnightBech32m.parse(shieldedCoinPublicKey)).toHexString();
  const encryptionPublicKey = ShieldedEncryptionPublicKey.codec
    .decode(networkId, MidnightBech32m.parse(shieldedEncryptionPublicKey))
    .toHexString();
  return { coinPublicKey, encryptionPublicKey };
}

export async function makeWalletAndMidnightProvider(
  api: ConnectedAPI,
  networkId: string,
): Promise<WalletProvider & MidnightProvider> {
  const { coinPublicKey, encryptionPublicKey } = await resolveShieldedKeys(api, networkId);

  return {
    getCoinPublicKey: () => coinPublicKey,
    getEncryptionPublicKey: () => encryptionPublicKey,

    async balanceTx(tx, ttl?: Date) {
      void ttl; // the connector API doesn't take a TTL hint; the wallet applies its own.
      const hex = bytesToHex(tx.serialize());
      const { tx: balancedHex } = await api.balanceUnsealedTransaction(hex);
      const balanced = Transaction.deserialize('signature', 'proof', 'binding', hexToBytes(balancedHex));
      return balanced as unknown as FinalizedTransaction;
    },

    async submitTx(tx) {
      const hex = bytesToHex(tx.serialize());
      // The Preview RPC node has been observed to cleanly close the
      // websocket (`1000: Normal Closure`) right as submission starts
      // watching for inclusion, reproducibly. `tx` here is already fully
      // balanced, proved, and signed (that happened in balanceTx above,
      // which is the one call that triggers a Lace signing prompt) -- so
      // retrying *only* this resubmission of the same bytes is safe and,
      // critically, does not re-prompt the wallet. If a prior attempt
      // actually landed despite the client-side error, the chain rejects
      // the resubmission with a distinct "already submitted"-style error
      // rather than repeating this disconnect, so this can't double-spend.
      const MAX_ATTEMPTS = 6;
      const RETRY_DELAY_MS = 4000;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await api.submitTransaction(hex);
          return tx.identifiers()[0];
        } catch (err) {
          // Lace's submission errors, like the wallet-facade SDK's, come
          // back as effect-library Cause objects that don't stringify
          // usefully via String()/.message -- describeError unwraps them.
          const description = describeError(err);
          const isTransient = /transaction submission (error|failed)|normal closure/i.test(description);
          if (!isTransient || attempt === MAX_ATTEMPTS) throw err;
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        }
      }
      throw new Error('unreachable');
    },
  };
}

/**
 * Builds a ProofProvider for the deployed dApp to prove transactions with.
 *
 * Ideally this would delegate proving to the connected wallet
 * (`getProvingProvider`), so the deployed frontend would need no
 * proof-server of its own. As of writing, Lace's DApp Connector API doesn't
 * implement `getProvingProvider` (confirmed on the Midnight forum), so this
 * prefers wallet-delegated proving if a future Lace version supports it,
 * and otherwise falls back to a proof-server reachable from the browser -
 * by default the same docker-compose proof-server the root CLI uses,
 * running on the user's own machine at http://127.0.0.1:6300.
 */
export async function makeProofProvider(
  api: ConnectedAPI,
  zkConfigProvider: FetchZkConfigProvider<string>,
  fallbackProofServerUrl: string,
): Promise<ProofProvider> {
  if (typeof (api as unknown as { getProvingProvider?: unknown }).getProvingProvider === 'function') {
    try {
      const provingProvider = await api.getProvingProvider({
        getZKIR: (loc) => zkConfigProvider.getZKIR(loc),
        getProverKey: (loc) => zkConfigProvider.getProverKey(loc),
        getVerifierKey: (loc) => zkConfigProvider.getVerifierKey(loc),
      });
      return createProofProvider(provingProvider);
    } catch {
      // Fall through to the local proof-server below.
    }
  }
  return httpClientProofProvider(fallbackProofServerUrl, zkConfigProvider);
}

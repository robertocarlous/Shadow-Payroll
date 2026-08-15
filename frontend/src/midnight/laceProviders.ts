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
import { NODE_RPC_URL } from '../network';

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

// ─── Extrinsic wrapping ────────────────────────────────────────────────────────
//
// A Midnight transaction must NOT be submitted as its raw serialized bytes.
// The node only accepts it wrapped in a substrate extrinsic dispatching the
// `midnight.sendMnTransaction` call (pallet index 5, call index 0). Submitting
// the bare tx as an extrinsic makes the runtime mis-decode it and trap in
// TaggedTransactionQueue_validate_transaction (wasm unreachable). This
// reproduces the exact bytes polkadot-js / the wallet-sdk produce:
//
//   compact(innerLen) + 0x04 (unsigned v4) + 0x05 0x00 (call index) +
//   compact(txLen) + txBytes

function compactLengthHex(n: number): string {
  if (n < 64) return (n << 2).toString(16).padStart(2, '0');
  if (n < 16384) {
    const b0 = (((n & 0x3f) << 2) | 0x01).toString(16).padStart(2, '0');
    const b1 = (n >> 6).toString(16).padStart(2, '0');
    return b0 + b1;
  }
  if (n < 1 << 30) {
    const b0 = (((n & 0x3f) << 2) | 0x02).toString(16).padStart(2, '0');
    const b1 = ((n >> 6) & 0xff).toString(16).padStart(2, '0');
    const b2 = ((n >> 14) & 0xff).toString(16).padStart(2, '0');
    const b3 = ((n >> 22) & 0xff).toString(16).padStart(2, '0');
    return b0 + b1 + b2 + b3;
  }
  throw new Error('transaction too large to submit');
}

function wrapMidnightExtrinsic(txHex: string): string {
  const arg = compactLengthHex(txHex.length / 2) + txHex;
  const inner = '04' + '0500' + arg;
  return compactLengthHex(inner.length / 2) + inner;
}

// ─── Direct node-RPC submission fallback ───────────────────────────────────────
//
// Lace's submitTransaction reports failures as an opaque SubmissionError whose
// cause is empty -- the node's real rejection (e.g. "Custom error: 170" for a
// stale DUST spend proof) is stripped before it reaches the page. When that
// happens we submit the *already-signed* tx straight to the public node RPC,
// which streams back the actual dispatch result via author_submitAndWatchExtrinsic.
// This both gets the tx in when Lace's transport drops it and surfaces a real
// message when the chain genuinely rejects it. The tx must be wrapped in a
// `midnight.sendMnTransaction` extrinsic first (see wrapMidnightExtrinsic),
// otherwise the runtime panics decoding the bare tx bytes.

interface RpcSubmitError extends Error {
  definitive?: boolean;
}

function realError(message: string): RpcSubmitError {
  const e = new Error(message) as RpcSubmitError;
  e.definitive = true;
  return e;
}

const NODE_RPC_TIMEOUT_MS = 90_000;

function rpcSubmitOnce(hex: string, txId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err: RpcSubmitError | null, value?: string) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        /* noop */
      }
      if (err) reject(err);
      else resolve(value as string);
    };
    const ws = new WebSocket(NODE_RPC_URL);
    const timeout = setTimeout(
      () => finish(realError('Timed out waiting for the node to finalize the transaction.')),
      NODE_RPC_TIMEOUT_MS,
    );
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          method: 'author_submitAndWatchExtrinsic',
          params: [`0x${wrapMidnightExtrinsic(hex)}`],
          id: 1,
        }),
      );
    };
    ws.onmessage = (event) => {
      let msg: { id?: number; method?: string; params?: { result?: unknown }; error?: { message?: string } };
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (msg.id === 1) {
        if (msg.error) {
          clearTimeout(timeout);
          finish(realError(`Node RPC rejected the transaction: ${msg.error.message ?? JSON.stringify(msg.error)}`));
        }
        return;
      }
      if (msg.method === 'author_extrinsicUpdate') {
        const statuses = Array.isArray(msg.params?.result) ? msg.params.result : [msg.params?.result];
        for (const raw of statuses) {
          if (!raw || typeof raw !== 'object') continue;
          const st = raw as Record<string, unknown>;
          if ('finalized' in st) {
            clearTimeout(timeout);
            finish(null, txId);
            return;
          }
          if ('invalid' in st) {
            clearTimeout(timeout);
            finish(realError(`Transaction rejected by the node: ${JSON.stringify(st.invalid)}`));
            return;
          }
          if ('dropped' in st) {
            clearTimeout(timeout);
            finish(realError(`Transaction dropped by the network: ${JSON.stringify(st.dropped)}`));
            return;
          }
          if ('usurped' in st) {
            clearTimeout(timeout);
            finish(realError('Transaction was usurped (replaced) before finalization.'));
            return;
          }
        }
      }
    };
    ws.onerror = () => {
      clearTimeout(timeout);
      finish(new Error('Failed to connect to the Midnight node RPC.'));
    };
    ws.onclose = () => {
      clearTimeout(timeout);
      if (!settled) finish(new Error('Node RPC connection closed before the transaction was finalized.'));
    };
  });
}

async function submitViaNodeRpc(hex: string, txId: string): Promise<string> {
  // Retries are only for transport-level failures (socket drop/timeout).
  // A real chain rejection (definitive) must not be retried with the same
  // bytes -- contractClient.ts rebuilds the whole tx in that case.
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 3000;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await rpcSubmitOnce(hex, txId);
    } catch (err) {
      if ((err as RpcSubmitError).definitive || attempt === MAX_ATTEMPTS) throw err;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error('unreachable');
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
      const txId = tx.identifiers()[0];
      // Fast path: let Lace mediate submission through the wallet's node RPC.
      try {
        await api.submitTransaction(hex);
        return txId;
      } catch (err) {
        // Lace strips the node's real rejection (opaque SubmissionError with
        // an empty cause). Submit the already-signed tx directly to the
        // public node RPC: it reports the actual dispatch result, so either
        // the tx lands or the page shows the true rejection reason.
        return await submitViaNodeRpc(hex, txId);
      }
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

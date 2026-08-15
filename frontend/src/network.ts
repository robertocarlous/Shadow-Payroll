// Minimal network config for the read-only dashboard -- mirrors the
// NETWORK_CONFIGS in ../../src/network.ts, duplicated rather than shared
// since the frontend is a separate build target from the Node CLI.
export type NetworkId = 'undeployed' | 'preview' | 'preprod';

export interface NetworkConfig {
  networkId: NetworkId;
  indexer: string;
  indexerWS: string;
  // Public node JSON-RPC endpoint. Lace's submitTransaction strips the
  // node's real rejection (opaque "Transaction submission failed" with an
  // empty cause), so the claim flow falls back to submitting the
  // already-signed tx here directly -- this endpoint reports the actual
  // dispatch error.
  nodeRpc: string;
}

export const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  undeployed: {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
    nodeRpc: 'ws://127.0.0.1:9944',
  },
  preview: {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
    nodeRpc: 'wss://rpc.preview.midnight.network',
  },
  preprod: {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    nodeRpc: 'wss://rpc.preprod.midnight.network',
  },
};

function isNetworkId(v: string | undefined): v is NetworkId {
  return v === 'undeployed' || v === 'preview' || v === 'preprod';
}

const envNetwork = import.meta.env.VITE_NETWORK;
export const ACTIVE_NETWORK: NetworkId = isNetworkId(envNetwork) ? envNetwork : 'preview';
export const ACTIVE_NETWORK_CONFIG = NETWORK_CONFIGS[ACTIVE_NETWORK];
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? '';

// As of writing, Lace does not implement wallet-delegated proving
// (getProvingProvider), so the claim flow (see src/midnight/contractClient.ts)
// runs proving itself against a proof-server on the user's own machine, same
// as the root CLI's docker-compose service -- overridable in case a public
// one becomes available.
export const PROOF_SERVER_URL: string = import.meta.env.VITE_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300';

// Node JSON-RPC used by the submission fallback in laceProviders.ts (Lace's
// own submitTransaction swallows the node's rejection reason).
export const NODE_RPC_URL: string = import.meta.env.VITE_NODE_RPC_URL ?? ACTIVE_NETWORK_CONFIG.nodeRpc;

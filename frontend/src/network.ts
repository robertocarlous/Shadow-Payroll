// Minimal network config for the read-only dashboard -- mirrors the
// NETWORK_CONFIGS in ../../src/network.ts, duplicated rather than shared
// since the frontend is a separate build target from the Node CLI.
export type NetworkId = 'undeployed' | 'preview' | 'preprod';

export interface NetworkConfig {
  networkId: NetworkId;
  indexer: string;
  indexerWS: string;
}

export const NETWORK_CONFIGS: Record<NetworkId, NetworkConfig> = {
  undeployed: {
    networkId: 'undeployed',
    indexer: 'http://127.0.0.1:8088/api/v4/graphql',
    indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  },
  preview: {
    networkId: 'preview',
    indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  },
  preprod: {
    networkId: 'preprod',
    indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  },
};

function isNetworkId(v: string | undefined): v is NetworkId {
  return v === 'undeployed' || v === 'preview' || v === 'preprod';
}

const envNetwork = import.meta.env.VITE_NETWORK;
export const ACTIVE_NETWORK: NetworkId = isNetworkId(envNetwork) ? envNetwork : 'preprod';
export const ACTIVE_NETWORK_CONFIG = NETWORK_CONFIGS[ACTIVE_NETWORK];
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS ?? '';

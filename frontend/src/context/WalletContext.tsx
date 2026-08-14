import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import { listWallets, connectWallet } from '../midnight/wallet';
import { ACTIVE_NETWORK } from '../network';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WalletContextValue {
  status: WalletStatus;
  error: string | null;
  api: ConnectedAPI | null;
  unshieldedAddress: string | null;
  availableWallets: InitialAPI[];
  connect: () => Promise<void>;
  reconnect: () => Promise<ConnectedAPI>;
  disconnect: () => void;
  refreshWallets: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [unshieldedAddress, setUnshieldedAddress] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<InitialAPI[]>(() => listWallets());

  const refreshWallets = useCallback(() => setAvailableWallets(listWallets()), []);

  const establish = useCallback(async () => {
    const wallets = listWallets();
    setAvailableWallets(wallets);
    if (wallets.length === 0) {
      throw new Error('No Midnight wallet found. Install Lace and refresh the page.');
    }
    const connectedApi = await connectWallet(wallets[0], ACTIVE_NETWORK);
    const { unshieldedAddress: address } = await connectedApi.getUnshieldedAddress();
    setApi(connectedApi);
    setUnshieldedAddress(address);
    setStatus('connected');
    return connectedApi;
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setStatus('connecting');
    try {
      await establish();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, [establish]);

  // Lace invalidates a dapp session when the wallet is locked/reopened even
  // though the extension UI says it's open; a previously-connected API then
  // answers every call with "Wallet is locked". Re-running the connect
  // handshake refreshes the session (already-authorized connections don't
  // re-prompt).
  const reconnect = useCallback(async (): Promise<ConnectedAPI> => {
    setError(null);
    setStatus('connecting');
    try {
      return await establish();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
      throw err;
    }
  }, [establish]);

  const disconnect = useCallback(() => {
    setApi(null);
    setUnshieldedAddress(null);
    setStatus('disconnected');
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ status, error, api, unshieldedAddress, availableWallets, connect, reconnect, disconnect, refreshWallets }),
    [status, error, api, unshieldedAddress, availableWallets, connect, reconnect, disconnect, refreshWallets],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}

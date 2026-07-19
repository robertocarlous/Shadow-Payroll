import { useEffect, useRef, useState } from 'react';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { ledger } from './generated/payroll/index.js';
import { ACTIVE_NETWORK, ACTIVE_NETWORK_CONFIG, CONTRACT_ADDRESS } from './network';

export interface PayrollDashboardState {
  initialized: boolean;
  totalBudget: bigint;
  totalClaimed: bigint;
  claimsMade: bigint;
  reconciled: boolean;
}

export type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; state: PayrollDashboardState; lastUpdated: Date };

const POLL_INTERVAL_MS = 6000;

export function usePayrollState(): LoadState {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const providerRef = useRef<ReturnType<typeof indexerPublicDataProvider> | null>(null);

  useEffect(() => {
    setNetworkId(ACTIVE_NETWORK);
    if (!providerRef.current) {
      providerRef.current = indexerPublicDataProvider(
        ACTIVE_NETWORK_CONFIG.indexer,
        ACTIVE_NETWORK_CONFIG.indexerWS,
      );
    }
    const provider = providerRef.current;

    if (!CONTRACT_ADDRESS) {
      setState({ status: 'error', message: 'VITE_CONTRACT_ADDRESS is not set.' });
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const contractState = await provider.queryContractState(CONTRACT_ADDRESS);
        if (cancelled) return;
        if (!contractState) {
          setState({ status: 'error', message: 'No contract found at this address yet.' });
          return;
        }
        const l = ledger(contractState.data);
        setState({
          status: 'ready',
          state: {
            initialized: l.initialized,
            totalBudget: l.totalBudget,
            totalClaimed: l.totalClaimed,
            claimsMade: l.usedNullifiers.size(),
            reconciled: l.initialized && l.totalClaimed === l.totalBudget,
          },
          lastUpdated: new Date(),
        });
      } catch (err) {
        if (cancelled) return;
        setState({ status: 'error', message: err instanceof Error ? err.message : String(err) });
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return state;
}

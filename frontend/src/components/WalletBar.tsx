import { useWallet } from '../context/WalletContext';
import { ACTIVE_NETWORK } from '../network';

const STATUS_LABEL: Record<string, string> = {
  disconnected: 'Wallet not connected',
  connecting: 'Connecting…',
  connected: 'Connected',
  error: 'Connection error',
};

export function WalletBar() {
  const { status, error, unshieldedAddress, connect, disconnect } = useWallet();

  return (
    <div className="wallet-bar">
      <div className="wallet-bar__info">
        <span className={`wallet-dot wallet-dot--${status}`} aria-hidden="true" />
        <div className="wallet-bar__text">
          <span className="wallet-bar__status">{STATUS_LABEL[status]}</span>
          <span className="muted"> · {ACTIVE_NETWORK}</span>
        </div>
        {status === 'connected' && unshieldedAddress && (
          <code className="wallet-bar__address">
            {unshieldedAddress.slice(0, 14)}…{unshieldedAddress.slice(-6)}
          </code>
        )}
      </div>
      <div className="wallet-bar__actions">
        {status === 'connected' ? (
          <button className="btn btn--ghost" onClick={disconnect}>
            Disconnect
          </button>
        ) : (
          <button className="btn btn--primary" onClick={connect} disabled={status === 'connecting'}>
            {status === 'connecting' ? 'Connecting…' : 'Connect Lace'}
          </button>
        )}
      </div>
      {status === 'error' && error && <p className="wallet-bar__error">{error}</p>}
    </div>
  );
}

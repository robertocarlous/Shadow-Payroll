import { useWallet } from '../context/WalletContext';

const STATUS_LABEL: Record<string, string> = {
  disconnected: 'Connect Lace',
  connecting: 'Connecting…',
  connected: 'Connected',
  error: 'Retry connection',
};

/**
 * Compact wallet control that lives in the sticky top nav.
 */
export function WalletBar() {
  const { status, error, unshieldedAddress, connect, disconnect } = useWallet();
  const connected = status === 'connected';

  return (
    <div className={`wallet-chip wallet-chip--${status}`}>
      <span className="wallet-dot" data-state={status} aria-hidden="true" />
      {connected && unshieldedAddress ? (
        <code className="wallet-chip__address" title={unshieldedAddress}>
          {unshieldedAddress.slice(0, 8)}…{unshieldedAddress.slice(-4)}
        </code>
      ) : (
        <span className="wallet-chip__label">{STATUS_LABEL[status]}</span>
      )}
      {connected ? (
        <button className="btn btn--ghost btn--small" onClick={disconnect}>
          Disconnect
        </button>
      ) : (
        <button className="btn btn--primary btn--small" onClick={connect} disabled={status === 'connecting'}>
          {status === 'connecting' ? '…' : STATUS_LABEL[error ? 'error' : status]}
        </button>
      )}
      {status === 'error' && error && <p className="wallet-chip__error">{error}</p>}
    </div>
  );
}

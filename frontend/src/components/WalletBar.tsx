import { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';

const STATUS_LABEL: Record<string, string> = {
  disconnected: 'Connect wallet',
  connecting: 'Connecting…',
  connected: 'Connected',
  error: 'Retry connection',
};

/**
 * Compact wallet control that lives in the sticky top nav.
 * Includes a detail modal with connection status, helpful actions,
 * and a friendly explanation of what the Lace wallet is.
 */
export function WalletBar() {
  const { status, error, unshieldedAddress, connect, disconnect, availableWallets, refreshWallets } = useWallet();
  const [showDetails, setShowDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const connected = status === 'connected';

  useEffect(() => {
    if (status === 'connected') setShowDetails(false);
  }, [status]);

  const copyAddress = async () => {
    if (!unshieldedAddress) return;
    try {
      await navigator.clipboard.writeText(unshieldedAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const handlePrimaryAction = () => {
    if (connected) return;
    refreshWallets();
    setShowDetails(true);
  };

  const handleConnectClick = async () => {
    setDetailsError(null);
    try {
      await connect();
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : String(err));
    }
  };

  const hasWallets = availableWallets.length > 0;

  return (
    <div className={`wallet-chip wallet-chip--${status}`}>
      <span className="wallet-dot" data-state={status} aria-hidden="true" />
      {connected && unshieldedAddress ? (
        <button className="wallet-chip__address-btn" onClick={() => setShowDetails(true)} title="View wallet details">
          <code className="wallet-chip__address">
            {unshieldedAddress.slice(0, 8)}…{unshieldedAddress.slice(-4)}
          </code>
        </button>
      ) : (
        <button className="wallet-chip__label-btn" onClick={handlePrimaryAction} title={error ?? ''}>
          <span className="wallet-chip__label">{STATUS_LABEL[status]}</span>
        </button>
      )}
      {connected ? (
        <button className="btn btn--ghost btn--small" onClick={disconnect}>
          Disconnect
        </button>
      ) : (
        <button className="btn btn--primary btn--small" onClick={handlePrimaryAction}>
          {status === 'connecting' ? '…' : 'Connect'}
        </button>
      )}

      {showDetails && (
        <div className="wallet-modal" role="dialog" aria-modal="true" aria-label="Wallet connection">
          <div className="wallet-modal__backdrop" onClick={() => setShowDetails(false)} />
          <div className="wallet-modal__panel">
            <button className="wallet-modal__close" onClick={() => setShowDetails(false)} aria-label="Close">
              ✕
            </button>
            <h2 className="wallet-modal__title">
              {connected ? 'Wallet connected' : 'Connect your wallet'}
            </h2>

            {connected ? (
<div className="wallet-modal__body">
                  <div className="wallet-modal__status-row">
                    <span className="wallet-dot" data-state="connected" aria-hidden="true" />
                    <span className="wallet-modal__status-label">Connected to Lace</span>
                  </div>
                  <div className="wallet-modal__address-row">
                    <code className="wallet-modal__address">{unshieldedAddress}</code>
                    <button className="btn btn--ghost btn--small" onClick={copyAddress}>
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="muted">
                    Your wallet is ready. Head over to the{' '}
                    <a href="#claim">Claim panel</a> to claim your payout.
                  </p>
                </div>
            ) : (
              <div className="wallet-modal__body">
                {!hasWallets ? (
                  <>
                    <div className="wallet-modal__icon" aria-hidden="true">🦁</div>
                    <p className="wallet-modal__lead">
                      No Midnight wallet detected. Claims are signed by the{' '}
                      <strong>Lace</strong> browser extension — no login, no password.
                    </p>
                    <p className="wallet-modal__steps">
                      <strong>1.</strong> Install <a href="https://www.lace.io/" target="_blank" rel="noreferrer">Lace</a> from
                      lace.io
                      <br />
                      <strong>2.</strong> Set up a wallet and name it
                      <br />
                      <strong>3.</strong> Switch to the Midnight <strong>Preview</strong> network
                      <br />
                      <strong>4.</strong> Refresh this page and connect
                    </p>
                    <a
                      className="btn btn--primary btn--lg"
                      href="https://www.lace.io/"
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => refreshWallets()}
                    >
                      Get Lace wallet
                    </a>
                  </>
                ) : (
                  <>
                    <div className="wallet-modal__icon" aria-hidden="true">🦁</div>
                    <p className="wallet-modal__lead">
                      Found <strong>{availableWallets.length}</strong> wallet
                      {availableWallets.length === 1 ? '' : 's'} on this device. Click to connect —
                      Lace will ask you to authorize this app.
                    </p>
                    {(error || detailsError) && (
                      <div className="banner banner--error">
                        <strong>Connection failed</strong>
                        <p>{detailsError ?? error}</p>
                      </div>
                    )}
                    <button
                      className="btn btn--primary btn--lg"
                      onClick={handleConnectClick}
                      disabled={status === 'connecting'}
                    >
                      {status === 'connecting' ? 'Connecting…' : 'Connect to Lace'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
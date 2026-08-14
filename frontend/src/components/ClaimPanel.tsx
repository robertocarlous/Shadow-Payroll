import { useCallback, useRef, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { submitClaim } from '../midnight/contractClient';
import { parseCredential } from '../midnight/witnesses';
import { describeError } from '../midnight/errors';
import { ACTIVE_NETWORK, CONTRACT_ADDRESS } from '../network';

export function ClaimPanel() {
  const { status: walletStatus, api, reconnect } = useWallet();
  const [credentialText, setCredentialText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dustRetry, setDustRetry] = useState<{ attempt: number; max: number } | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onFileChosen = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCredentialText(String(reader.result ?? ''));
    reader.readAsText(file);
  }, []);

  const isLockedError = useCallback((description: string) => /wallet is locked/i.test(description), []);

  const handleClaim = useCallback(async () => {
    if (!api || !credentialText.trim()) return;
    setSubmitting(true);
    setClaimError(null);
    setTxId(null);
    setDustRetry(null);
    try {
      const credential = parseCredential(credentialText);
      const { txId: id } = await submitClaim(api, ACTIVE_NETWORK, CONTRACT_ADDRESS, credential, (attempt, max) =>
        setDustRetry({ attempt, max }),
      );
      setTxId(id);
      setCredentialText('');
    } catch (err) {
      const description = describeError(err);
      if (isLockedError(description)) {
        // Lace reports a stale "Wallet is locked" on sessions that predate a
        // lock/reopen cycle even when the wallet is open. Refresh the dapp
        // connection and retry once rather than dead-ending here.
        setClaimError(
          'Your wallet connection went stale (Lace reports it locked). Refreshing the connection and retrying…',
        );
        try {
          const freshApi = await reconnect();
          const credential = parseCredential(credentialText);
          const fresh = await submitClaim(freshApi, ACTIVE_NETWORK, CONTRACT_ADDRESS, credential, (attempt, max) =>
            setDustRetry({ attempt, max }),
          );
          setTxId(fresh.txId);
          setCredentialText('');
          setClaimError(null);
        } catch (retryErr) {
          setClaimError(describeError(retryErr));
        }
      } else {
        setClaimError(description);
      }
    } finally {
      setDustRetry(null);
      setSubmitting(false);
    }
  }, [api, credentialText, isLockedError, reconnect]);

  return (
    <section className="card claim-panel" id="claim">
      <div className="section-heading">
        <h2>Claim your payout</h2>
        <span className="muted">Private in. Proof out. Amount never shown.</span>
      </div>

      <ol className="claim-steps">
        <li>Make sure your wallet above says <strong>Connected</strong>.</li>
        <li>Get your credential file (issued to you by the employer for this cohort).</li>
        <li>Drop it below and press <strong>Claim payout</strong>.</li>
      </ol>

      {walletStatus !== 'connected' ? (
        <p className="claim-panel__hint">
          Connect a wallet in the bar above to claim. Stuck? Work through the{' '}
          <a href="#onboarding">checklist</a>.
        </p>
      ) : (
        <>
          <div
            className={`claim-dropzone ${dragging ? 'is-dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onFileChosen(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInput.current?.click()}
          >
            <span className="claim-dropzone__icon" aria-hidden="true">
              ⬆
            </span>
            <span className="claim-dropzone__main">Drop your credential file here</span>
            <span className="claim-dropzone__sub">
              or click to browse · or paste JSON into the box below
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={(e) => onFileChosen(e.target.files?.[0])}
              disabled={submitting}
              hidden
            />
          </div>

          <textarea
            className="claim-panel__textarea"
            placeholder='…or paste credential JSON here, e.g. { "payeeId": "user01", "secret": "…", "amount": "…", … }'
            value={credentialText}
            onChange={(e) => setCredentialText(e.target.value)}
            disabled={submitting}
            rows={5}
          />

          <div className="claim-panel__row">
            <button
              className="btn btn--primary btn--lg"
              onClick={handleClaim}
              disabled={submitting || !credentialText.trim()}
            >
              {submitting
                ? dustRetry
                  ? `Waiting for DUST… (${dustRetry.attempt}/${dustRetry.max})`
                  : 'Proving + submitting…'
                : 'Claim payout'}
            </button>
            <span className="muted">
              Generates a zero-knowledge proof locally, then submits through your wallet.
            </span>
          </div>
        </>
      )}

      {claimError && (
        <div className="banner banner--error">
          <strong>Couldn&apos;t claim</strong>
          <p>{claimError}</p>
        </div>
      )}
      {txId && (
        <div className="banner banner--success">
          <strong>Claimed</strong>
          <span>Your payout was claimed on-chain. Watch the progress bar move.</span>
          <code className="claim-panel__txid">{txId}</code>
        </div>
      )}
    </section>
  );
}

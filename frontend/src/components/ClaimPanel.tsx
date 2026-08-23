import { useCallback, useRef, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { useWallet } from '../context/WalletContext';
import { submitClaim, type ClaimRetryInfo } from '../midnight/contractClient';
import { parseCredential } from '../midnight/witnesses';
import { describeError } from '../midnight/errors';
import { ACTIVE_NETWORK, CONTRACT_ADDRESS } from '../network';

export function ClaimPanel() {
  const { status: walletStatus, api, reconnect } = useWallet();
  const [credentialText, setCredentialText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [retry, setRetry] = useState<ClaimRetryInfo | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const onFileChosen = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCredentialText(String(reader.result ?? ''));
    reader.readAsText(file);
  }, []);

  // A stale Lace connection can surface as "Wallet is locked" or as the whole
  // Remote API channel being shut down -- "RemoteApiShutdownError: Remote API
  // with channel 'midnight-wallet' was shutdown: object can no longer be
  // used." Both mean the current `api` object is dead and will never answer
  // again; the only fix is re-running the connect handshake to open a fresh
  // channel, then retrying the claim.
  const isStaleWalletError = useCallback(
    (description: string) => /wallet is locked|remote api.*shutdown|channel.*was shutdown/i.test(description),
    [],
  );

  const attemptClaim = useCallback(
    async (apiToUse: ConnectedAPI) => {
      const credential = parseCredential(credentialText);
      return submitClaim(apiToUse, ACTIVE_NETWORK, CONTRACT_ADDRESS, credential, (info) => setRetry(info));
    },
    [credentialText],
  );

  const handleClaim = useCallback(async () => {
    if (!api || !credentialText.trim()) return;
    setSubmitting(true);
    setClaimError(null);
    setTxId(null);
    setLanded(false);
    setRetry(null);
    try {
      // Up to a couple of reconnects: a fresh channel is usually enough, but a
      // channel can die again immediately (e.g. the wallet is mid lock/reopen
      // cycle), so allow one more re-establish before giving up.
      const MAX_ATTEMPTS = 3;
      let currentApi = api;
      for (let attempt = 1; ; attempt++) {
        try {
          const result = await attemptClaim(currentApi);
          setCredentialText('');
          setClaimError(null);
          setTxId(result.txId);
          setLanded(result.landed);
          setRetry(null);
          break;
        } catch (err) {
          const description = describeError(err);
          if (attempt < MAX_ATTEMPTS && isStaleWalletError(description)) {
            setClaimError(
              attempt === 1
                ? 'Your wallet connection went stale (Lace closed the session). Refreshing the connection and retrying…'
                : "Still stale (Lace's connection keeps dropping). Reconnecting again…",
            );
            currentApi = await reconnect();
            continue;
          }
          setClaimError(description);
          break;
        }
      }
    } catch (err) {
      setClaimError(describeError(err));
    } finally {
      setRetry(null);
      setSubmitting(false);
    }
  }, [api, attemptClaim, isStaleWalletError, reconnect]);

  return (
    <section className="card claim-panel" id="claim">
      <div className="section-heading">
        <h2>Claim your payout</h2>
        <span className="muted">Private in. Proof out. Amount never shown.</span>
      </div>

      <ol className="claim-steps">
        <li>Make sure the top-right wallet chip says <strong>Connected</strong>.</li>
        <li>Get your credential file (issued to you by the employer for this cohort).</li>
        <li>Drop it below and press <strong>Claim payout</strong>.</li>
      </ol>

      {walletStatus !== 'connected' ? (
        <p className="claim-panel__hint">
          Connect your wallet with the <strong>Connect Lace</strong> button at the top right. Stuck?
          Work through the <a href="#onboarding">checklist</a>.
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
                ? retry
                  ? retry.kind === 'dust'
                    ? `Waiting for DUST… (${retry.attempt}/${retry.max})`
                    : `Retrying submission… (${retry.attempt}/${retry.max})`
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
      {landed && !txId && (
        <div className="banner banner--success">
          <strong>Claimed</strong>
          <span>
            Your payout was submitted and is being confirmed on-chain. Refresh the page shortly to
            see the contract progress update.
          </span>
        </div>
      )}
    </section>
  );
}

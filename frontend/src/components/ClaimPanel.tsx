import { useCallback, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { submitClaim } from '../midnight/contractClient';
import { parseCredential } from '../midnight/witnesses';
import { describeError } from '../midnight/errors';
import { ACTIVE_NETWORK, CONTRACT_ADDRESS } from '../network';

export function ClaimPanel() {
  const { status: walletStatus, api } = useWallet();
  const [credentialText, setCredentialText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dustRetry, setDustRetry] = useState<{ attempt: number; max: number } | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const onFileChosen = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCredentialText(String(reader.result ?? ''));
    reader.readAsText(file);
  }, []);

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
      setClaimError(describeError(err));
    } finally {
      setDustRetry(null);
      setSubmitting(false);
    }
  }, [api, credentialText]);

  return (
    <div className="card claim-panel">
      <h3>Claim a payout</h3>
      <p className="muted">
        Paste (or upload) a payee credential file to submit a real claim -- generates a local zero-knowledge proof
        and submits it through your connected wallet. Nobody, including this app, ever sees your allocated amount
        except you.
      </p>

      {walletStatus !== 'connected' ? (
        <p className="claim-panel__hint">Connect a wallet above to claim.</p>
      ) : (
        <>
          <textarea
            className="claim-panel__textarea"
            placeholder='Paste credential JSON here, e.g. { "payeeId": "judge1", "secret": "...", ... }'
            value={credentialText}
            onChange={(e) => setCredentialText(e.target.value)}
            disabled={submitting}
            rows={6}
          />
          <div className="claim-panel__row">
            <label className="btn btn--ghost btn--small claim-panel__upload">
              Upload file
              <input
                type="file"
                accept="application/json"
                onChange={(e) => onFileChosen(e.target.files?.[0])}
                disabled={submitting}
                hidden
              />
            </label>
            <button className="btn btn--primary" onClick={handleClaim} disabled={submitting || !credentialText.trim()}>
              {submitting
                ? dustRetry
                  ? `Waiting for DUST… (${dustRetry.attempt}/${dustRetry.max})`
                  : 'Proving + submitting…'
                : 'Claim payout'}
            </button>
          </div>
        </>
      )}

      {claimError && (
        <div className="banner banner--error">
          <strong>Couldn't claim</strong>
          <p>{claimError}</p>
        </div>
      )}
      {txId && (
        <div className="banner banner--success">
          <strong>✅ Claimed</strong>
          <code className="claim-panel__txid">{txId}</code>
        </div>
      )}
    </div>
  );
}

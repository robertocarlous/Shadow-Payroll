import type { LoadState } from '../usePayrollState';

function formatAmount(n: bigint): string {
  return n.toLocaleString('en-US');
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export function PayrollStatus({ state }: { state: LoadState }) {

  if (state.status === 'loading') {
    return (
      <section className="card" id="status">
        <h2>Payroll status</h2>
        <p className="muted">Reading the latest state from the {`Preview`} indexer…</p>
      </section>
    );
  }

  if (state.status === 'error') {
    return (
      <section className="card" id="status">
        <h2>Payroll status</h2>
        <div className="error-box">
          <span className="status-badge critical">Not connected</span>
          <p>{state.message}</p>
        </div>
      </section>
    );
  }

  const { totalBudget, totalClaimed, claimsMade, reconciled, initialized } = state.state;
  const pct = totalBudget > 0n ? Math.min(100, Math.round((Number(totalClaimed) / Number(totalBudget)) * 100)) : 0;

  return (
    <section className="card" id="status">
      <div className="section-heading">
        <h2>Payroll status</h2>
        <span className="muted">Last updated {state.lastUpdated.toLocaleTimeString()}</span>
      </div>

      <div className="stat-row">
        <StatTile label="Total deposited" value={formatAmount(totalBudget)} />
        <StatTile label="Total claimed" value={formatAmount(totalClaimed)} />
        <StatTile label="Claims made" value={formatAmount(claimsMade)} />
      </div>

      <div className="progress-block">
        <div className="progress-block__row">
          <span className="progress-block__label">Distribution progress</span>
          <span className="progress-block__pct">{pct}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Distribution progress"
        >
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="reconciled-row">
        {reconciled ? (
          <span className="status-badge good">Fully reconciled</span>
        ) : initialized ? (
          <span className="status-badge pending">Not yet fully claimed</span>
        ) : (
          <span className="status-badge pending">Awaiting employer funding</span>
        )}
        <span className="muted">
          {reconciled
            ? 'Every allocation has been claimed. The running total proves it.'
            : 'Watch the progress bar move as payees claim their private allocations.'}
        </span>
      </div>
    </section>
  );
}

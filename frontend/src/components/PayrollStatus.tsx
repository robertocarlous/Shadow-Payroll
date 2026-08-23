import type { LoadState } from '../usePayrollState';
import { AnimatedNumber } from './AnimatedNumber';
import { Celebration, MoonPhase } from './MoonPhase';

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        <AnimatedNumber value={value} />
      </span>
    </div>
  );
}

function Skeleton() {
  return (
    <section className="card" id="status">
      <div className="section-heading">
        <h2>Payroll status</h2>
      </div>
      <div className="status-grid">
        <div className="skeleton skeleton--moonviz" />
        <div className="status-grid__right">
          <div className="stat-row">
            <div className="skeleton skeleton--tile" />
            <div className="skeleton skeleton--tile" />
            <div className="skeleton skeleton--tile" />
          </div>
          <div className="skeleton skeleton--bar" />
        </div>
      </div>
      <p className="muted">Reading the latest state from the Preview indexer…</p>
    </section>
  );
}

export function PayrollStatus({ state }: { state: LoadState }) {
  if (state.status === 'loading') return <Skeleton />;

  if (state.status === 'error') {
    return (
      <section className="card" id="status">
        <div className="section-heading">
          <h2>Payroll status</h2>
        </div>
        <div className="error-box">
          <span className="status-badge critical">Not connected</span>
          <p>{state.message}</p>
        </div>
      </section>
    );
  }

  const { totalBudget, totalClaimed, claimsMade, reconciled, initialized } = state.state;
  const pct =
    totalBudget > 0n ? Math.min(100, Math.round((Number(totalClaimed) / Number(totalBudget)) * 100)) : 0;

  return (
    <>
      {reconciled && initialized && <Celebration />}
      <section className={`card status-card ${reconciled ? 'is-reconciled' : ''}`} id="status">
        <div className="section-heading">
          <h2>Payroll status</h2>
          <span className="muted last-updated">Live · updated {state.lastUpdated.toLocaleTimeString()}</span>
        </div>

        <div className="status-grid">
          <MoonPhase pct={pct} reconciled={reconciled && initialized} initialized={initialized} />

          <div className="status-grid__right">
            <div className="stat-row">
              <StatTile label="Total deposited" value={Number(totalBudget)} />
              <StatTile label="Total claimed" value={Number(totalClaimed)} />
              <StatTile label="Claims made" value={Number(claimsMade)} />
            </div>

            <div
              className={`progress-track ${reconciled ? 'is-done' : ''}`}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Distribution progress"
            >
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>

            <div className="reconciled-row">
              {reconciled && initialized ? (
                <span className="status-badge good">🌕 Fully reconciled</span>
              ) : initialized ? (
                <span className="status-badge pending">Distributing — watch the moon fill up</span>
              ) : (
                <span className="status-badge pending">Awaiting employer funding</span>
              )}
              <span className="muted">
                {reconciled && initialized
                  ? 'Every allocation has been claimed. The running total proves it.'
                  : 'Each claim is a private ZK proof; only the public total moves.'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


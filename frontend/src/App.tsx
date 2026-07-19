import { usePayrollState } from './usePayrollState';
import { ACTIVE_NETWORK, CONTRACT_ADDRESS } from './network';
import './App.css';

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

export default function App() {
  const state = usePayrollState();

  return (
    <div className="page">
      <header className="header">
        <h1>Shadow Payroll</h1>
        <p className="subtitle">Public audit dashboard — private amounts, public solvency</p>
      </header>

      <main className="card">
        {state.status === 'loading' && <p className="muted">Loading on-chain state…</p>}

        {state.status === 'error' && (
          <div className="error-box">
            <span className="status-badge critical">⚠ Not connected</span>
            <p>{state.message}</p>
          </div>
        )}

        {state.status === 'ready' && (
          <>
            <div className="stat-row">
              <StatTile label="Total deposited" value={formatAmount(state.state.totalBudget)} />
              <StatTile label="Total claimed" value={formatAmount(state.state.totalClaimed)} />
              <StatTile label="Claims made" value={formatAmount(state.state.claimsMade)} />
            </div>

            <div className="reconciled-row">
              {state.state.reconciled ? (
                <span className="status-badge good">✅ Fully reconciled</span>
              ) : state.state.initialized ? (
                <span className="status-badge pending">⏳ Not yet fully claimed</span>
              ) : (
                <span className="status-badge pending">⏳ Awaiting employer funding</span>
              )}
              <span className="muted last-updated">
                Last updated {state.lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>
          Network: <strong>{ACTIVE_NETWORK}</strong>
          {CONTRACT_ADDRESS && (
            <>
              {' · '}Contract: <code>{CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)}</code>
            </>
          )}
        </p>
        <p className="muted">
          Individual payee amounts are never shown here — only they are, by design.
          This view only proves the running total was fully and correctly distributed.
        </p>
      </footer>
    </div>
  );
}

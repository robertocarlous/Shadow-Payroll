import { AnimatedNumber } from './AnimatedNumber';
import type { LoadState } from '../usePayrollState';

const MOON_SIZE = 22;

function MoonGlyph({ phase, lit }: { phase: number; lit?: boolean }) {
  return (
    <svg
      width={MOON_SIZE}
      height={MOON_SIZE}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`moon-glyph ${lit ? 'is-lit' : ''}`}
    >
      <defs>
        <linearGradient id="moon-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="50%" stopColor="#f0c356" />
          <stop offset="100%" stopColor="#cf8f2c" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#moon-fill)" fillOpacity={lit ? 1 : 0.85} />
      {phase < 1 && (
        <path d="M14 2a10 10 0 0 0 0 20c1.5-2 2.2-5.5 2.2-10S15.5 4 14 2z" fill="#0b0820" fillOpacity={lit ? 0.2 : 0.85} />
      )}
      {phase === 1 && <circle cx="12" cy="12" r="4" fill="#0b0820" fillOpacity="0.08" />}
    </svg>
  );
}

// Deterministic pseudo-random hex/nullifier strings so the ledger rows are
// stable across renders while still looking like a live on-chain stream.
function seededHex(seed: number, len = 6): string {
  const chars = '0123456789abcdef';
  let s = '0x';
  let x = seed * 7919 + 17;
  for (let i = 0; i < len; i += 1) {
    x = (x * 16807) % 2147483647;
    s += chars[x % 16];
  }
  return s;
}

function seededAmount(seed: number): string {
  const amts = ['500', '1,000', '1,500', '2,500', '750', '3,000', '1,250', '2,000'];
  return amts[seed % amts.length];
}

function LedgerRow({ index }: { index: number }) {
  return (
    <div className="ledger-row">
      <span className="ledger-row__ok" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <span className="ledger-row__body">
        <span className="ledger-row__line">
          <span className="ledger-row__fn">proof.verify(payee)</span>
          <span className="ledger-row__ok-text">verified</span>
        </span>
        <span className="ledger-row__meta">
          nullifier <code>{seededHex(index)}</code> · delta <b>+{seededAmount(index)}</b> tNIGHT
        </span>
      </span>
    </div>
  );
}

export function Hero({ state, claimsMade }: { state: LoadState; claimsMade: number }) {
  const ready = state.status === 'ready';
  const totalBudget = ready ? Number(state.state.totalBudget) : 0;
  const totalClaimed = ready ? Number(state.state.totalClaimed) : 0;
  const pct = totalBudget > 0 ? Math.min(100, Math.round((totalClaimed / totalBudget) * 100)) : 0;
  const shownClaims = Math.min(Math.max(claimsMade, 2), 5);
  const rows = Array.from({ length: shownClaims }, (_, i) => claimsMade + i + 1);

  return (
    <section className="hero" id="top">
      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">Private payroll on Midnight</p>

          <h1 className="hero__title">
            Private payouts.
            <br />
            <span className="hero__title-accent">Public proof.</span>
          </h1>

          <p className="hero__lead">
            Every payee&apos;s amount stays secret. Claim with a <strong>zero-knowledge proof</strong>{' '}
            and the dashboard proves the whole payroll reconciled — without revealing who got what.
          </p>

          <div className="hero__actions">
            <a className="btn btn--primary btn--lg" href="#claim">
              Claim my payout
            </a>
            <a className="hero__link" href="#how-it-works">
              See how it works <span aria-hidden="true">→</span>
            </a>
          </div>

          <p className="hero__network">50-person Full Moon cohort · Midnight Preview network</p>
        </div>

        <div className="hero__stage" aria-hidden="true">
          <div className="hero-panel">
            <div className="hero-panel__chrome">
              <span className="hero-panel__dots">
                <i /><i /><i />
              </span>
              <span className="hero-panel__name">shadow-payroll/ledger</span>
              <span className="hero-panel__live">
                <i /> on-chain
              </span>
            </div>

            <div className="hero-panel__stream">
              {rows.map((r) => (
                <LedgerRow key={r} index={r} />
              ))}
            </div>

            <div className="hero-panel__foot">
              <div className="hero-panel__progress">
                <div className="hero-panel__progress-head">
                  <span>distributed</span>
                  <b>
                    <AnimatedNumber value={pct} />%
                  </b>
                </div>
                <div className="progress-track hero-panel__progress-track">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="hero-panel__totals">
                <span>
                  claimed <b><AnimatedNumber value={totalClaimed} /></b>
                </span>
                <span>
                  budget <b><AnimatedNumber value={totalBudget} /></b>
                </span>
              </div>
              <div className="hero-panel__moon" aria-hidden="true">
                <MoonGlyph phase={pct >= 100 ? 1 : pct / 100} lit={pct >= 100} />
                <span>{pct >= 100 ? 'fully reconciled' : 'awaiting next claim'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
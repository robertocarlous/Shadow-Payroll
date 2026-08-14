import { ACTIVE_NETWORK } from '../network';

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__moon" aria-hidden="true">
        <span className="hero__moon-dot" />
      </div>
      <div className="hero__body">
        <p className="hero__eyebrow">Level 5 · Full Moon · Preview</p>
        <h1 className="hero__title">
          Shadow Payroll
          <span className="hero__title-sub">private payouts, public proof</span>
        </h1>
        <p className="hero__lead">
          A privacy-preserving payroll where every payee&apos;s amount stays secret —
          and everyone can watch the money add up correctly. You claim your payout
          with a private zero-knowledge proof, and the dashboard proves the whole
          payroll reconciled without ever revealing who got what.
        </p>
        <div className="hero__actions">
          <a className="btn btn--primary btn--lg" href="#claim">
            Claim my payout
          </a>
          <a className="btn btn--ghost btn--lg" href="#how-it-works">
            How it works
          </a>
        </div>
        <p className="hero__network">
          Live on <strong>{ACTIVE_NETWORK}</strong> · {`50 invited Preview users`}
        </p>
      </div>
    </section>
  );
}

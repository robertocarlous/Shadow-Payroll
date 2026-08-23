import { ACTIVE_NETWORK } from '../network';

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__chips" aria-hidden="true">
        <span className="chip">🌙 Level 5 · Full Moon</span>
        <span className="chip chip--violet">Zero-knowledge proofs</span>
        <span className="chip chip--teal">{ACTIVE_NETWORK} testnet</span>
      </div>
      <h1 className="hero__title">
        Shadow Payroll
        <span className="hero__title-sub">private payouts, public proof</span>
      </h1>
      <p className="hero__lead">
        A privacy-preserving payroll where every payee&apos;s amount stays secret — and everyone can
        watch the money add up correctly. Claim with a zero-knowledge proof; the dashboard proves the
        whole payroll reconciled without ever revealing who got what.
      </p>
      <div className="hero__actions">
        <a className="btn btn--primary btn--lg" href="#claim">
          Claim my payout
        </a>
        <a className="btn btn--ghost btn--lg" href="#how-it-works">
          How it works
        </a>
      </div>
      <div className="hero__phase-strip" aria-hidden="true">
        <span>🌑</span>
        <span>🌒</span>
        <span>🌓</span>
        <span>🌔</span>
        <span className="is-lit">🌕</span>
      </div>
      <p className="hero__network">
        Live on <strong>{ACTIVE_NETWORK}</strong> · 50 invited Preview users · watch the moon fill as
        claims land
      </p>
    </section>
  );
}

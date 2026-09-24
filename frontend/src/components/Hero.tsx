function ProofCard({
  label,
  sub,
  className,
}: {
  label: string;
  sub: string;
  className: string;
}) {
  return (
    <div className={`hero__proof-card ${className}`}>
      <span className="hero__proof-card-ok" aria-hidden="true">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <span>
        <b>{label}</b>
        <span className="hero__proof-card-sub">{sub}</span>
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__card">
        <div className="hero__content">
          <p className="hero__eyebrow">Private payroll on Midnight</p>

          <h1 className="hero__title">
            Every payout stays
            <br />
            secret. The<span className="hero__pill-word">proof</span>
            <br />
            doesn&apos;t.
          </h1>

          <p className="hero__lead">
            Claim with a <strong>zero-knowledge proof</strong>. The dashboard proves the whole
            payroll reconciled — without ever revealing who got what.
          </p>

          <div className="hero__actions">
            <a className="btn btn--primary btn--lg" href="#claim">
              Claim my payout
            </a>
            <a className="hero__link" href="#faq">
              See how it works <span aria-hidden="true">→</span>
            </a>
          </div>

          <p className="hero__network">50-person Full Moon cohort · Midnight Preview network</p>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="hero__moonshape" />
          <ProofCard label="Verified" sub="proof.verify(payee)" className="hero__proof-card--1" />
          <ProofCard label="100%" sub="distributed" className="hero__proof-card--2" />
          <ProofCard label="Reconciled" sub="budget met on-chain" className="hero__proof-card--3" />
        </div>
      </div>
    </section>
  );
}

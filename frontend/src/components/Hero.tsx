export function Hero() {
  return (
    <section className="hero" id="top">
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

        <div className="hero__stats" aria-hidden="true">
          <div className="hero__stat">
            <span className="hero__stat-value">100%</span>
            <span className="hero__stat-label">of budget distributed on-chain</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-value">0</span>
            <span className="hero__stat-label">individual amounts ever exposed</span>
          </div>
          <div className="hero__stat">
            <span className="hero__stat-value">ZK</span>
            <span className="hero__stat-label">proof verifies every single claim</span>
          </div>
        </div>

        <p className="hero__network">50-person Full Moon cohort · Midnight Preview network</p>
      </div>
    </section>
  );
}

export function Hero() {
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
            <a className="hero__link" href="#faq">
              See how it works <span aria-hidden="true">→</span>
            </a>
          </div>

          <p className="hero__network">50-person Full Moon cohort · Midnight Preview network</p>
        </div>
      </div>
    </section>
  );
}

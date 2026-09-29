export function ClosingCta() {
  return (
    <section className="closing-cta">
      <div className="closing-cta__text">
        <p className="closing-cta__eyebrow">Try it in five minutes</p>
        <h2>Claim your payout with a proof, not a password.</h2>
      </div>
      <div className="closing-cta__actions">
        <a className="btn btn--primary btn--lg" href="#claim">
          Claim my payout
        </a>
        <a className="btn btn--outline btn--lg" href="https://github.com/robertocarlous/Shadow-Payroll" target="_blank" rel="noreferrer">
          View on GitHub
        </a>
      </div>
    </section>
  );
}

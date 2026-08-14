import { useState } from 'react';

const FAQS = [
  {
    q: 'Is my payout amount private?',
    a: 'Yes. Your allocation is committed inside a Merkle root and your claim proves membership with zero knowledge. Your amount is never revealed to the employer, other payees, or this dashboard. Only you ever see your credential file.',
  },
  {
    q: 'Who can see that a claim happened?',
    a: 'Anyone. Each claim moves a delta on the public running total, so the dashboard shows "Claims made: N" and the progress bar moves. But because the nullifier is derived from your secret, your claim cannot be linked back to you — it is unlinkable.',
  },
  {
    q: 'Why do I need a local proof-server?',
    a: 'Lace does not generate Midnight zero-knowledge proofs in-wallet yet. The browser proves your claim against a small local service. You run it once with: docker compose up -d proof-server. Your credential never leaves your machine except for the parts the proof chooses to reveal.',
  },
  {
    q: 'What do I need to participate?',
    a: 'The Lace wallet on the Preview network with a little DUST from the faucet, plus the local proof-server. The "Your first payout" checklist walks you through every step.',
  },
  {
    q: 'I need help. Where do I ask?',
    a: 'Open a GitHub issue on the repo — the team answers setup questions there, can re-issue a credential if yours is lost, and triages structured feedback weekly.',
  },
  {
    q: 'Is this real money?',
    a: 'No. This is a testnet (Midnight Preview) demo payroll. The credentials are deliberately public disposable test data so you can safely try the full claim flow end to end.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="card" id="faq">
      <div className="section-heading">
        <h2>Frequently asked questions</h2>
        <span className="muted">Quick answers for your first claim</span>
      </div>
      <div className="faq">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div className={`faq-item ${isOpen ? 'is-open' : ''}`} key={item.q}>
              <button type="button" className="faq-item__q" onClick={() => setOpen(isOpen ? null : i)}>
                <span>{item.q}</span>
                <span className="faq-item__chevron" aria-hidden="true">
                  {isOpen ? '–' : '+'}
                </span>
              </button>
              {isOpen && <p className="faq-item__a">{item.a}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

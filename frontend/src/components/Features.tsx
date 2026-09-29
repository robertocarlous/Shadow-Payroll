import { useReveal } from '../useReveal';

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: 'Amounts stay private',
    body: 'Your payout is committed inside a Merkle root. It is never posted on-chain, shown to other payees, or visible on this dashboard — only you ever see it.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <line x1="3" y1="21" x2="21" y2="3" />
      </svg>
    ),
    title: 'Claims are unlinkable',
    body: 'Your nullifier is derived from your secret, not your wallet. Anyone can see a claim happened; nobody can trace it back to you.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4Z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    title: 'Reconciliation is public',
    body: 'The running total is a public ledger value. Anyone can independently verify the whole payroll was distributed correctly, without seeing who got what.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
    title: 'No server holds your proof',
    body: 'The zero-knowledge proof is generated locally in your browser against a proof server you run yourself. Your credential never leaves your machine.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        <circle cx="12" cy="16" r="1.5" />
      </svg>
    ),
    title: 'Double-claims rejected on-chain',
    body: 'The contract itself checks the nullifier before any funds move — not a backend service that could be bypassed or go down.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Fully open source',
    body: 'Contract source, deployment history, and every claim transaction are public and independently verifiable — nothing here asks you to just trust it.',
  },
];

export function Features() {
  const ref = useReveal();

  return (
    <section className="card features reveal" ref={ref} id="features">
      <div className="section-heading">
        <h2>What zero-knowledge actually gets you</h2>
        <span className="muted">Six guarantees, enforced by the protocol — not a promise</span>
      </div>

      <div className="features__grid">
        {FEATURES.map((f) => (
          <div className="features__card" key={f.title}>
            <span className="features__icon" aria-hidden="true">
              {f.icon}
            </span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

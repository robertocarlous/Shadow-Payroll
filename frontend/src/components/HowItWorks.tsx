import { useReveal } from '../useReveal';

const STEP_ICONS = [
  <svg key="1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21V8l5-4 5 4v13" />
    <path d="M13 21v-7h8v7" />
    <path d="M3 21h18" />
  </svg>,
  <svg key="2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.5 2.5L17 4l1 2.5 2.5 1-1 2.5 2.5 2.5-2.5 2.5 1 2.5-2.5 1-1 2.5-2.5-1L12 21l-2.5-2.5L7 20l-1-2.5-2.5-1 1-2.5L2 12l2.5-2.5-1-2.5L7 6l1-2.5 2.5 1z" />
    <path d="M9 12l2 2 4-4" />
  </svg>,
  <svg key="3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12a8 8 0 0114-5" />
    <path d="M20 12a8 8 0 01-14 5" />
    <path d="M12 4v4M12 16v4" />
    <path d="M2 12h2M20 12h2M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
  </svg>,
  <svg key="4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M8.5 12l2.5 2.5 4.5-5" />
  </svg>,
];

const STEPS = [
  {
    n: '1',
    title: 'The employer commits an allowlist',
    body: 'A private list of { payee, amount } is folded into a single Merkle root. Only the root is published on-chain — nobody, not even the network, sees who is on the list or what they get.',
  },
  {
    n: '2',
    title: 'You claim with a zero-knowledge proof',
    body: 'Your claim proves three things without revealing them: you are on the allowlist, you have not claimed before, and the payroll stays solvent. It never reveals which entry is yours or your amount.',
  },
  {
    n: '3',
    title: 'The contract updates a public running total',
    body: 'Your private allocation is added to a single public number. Anyone can see that money moved — but never between whom.',
  },
  {
    n: '4',
    title: 'The dashboard proves it all reconciled',
    body: 'When the running total equals the budget, the payroll is fully and correctly distributed. Complete transparency about the whole, complete privacy about the parts.',
  },
];

export function HowItWorks() {
  const ref = useReveal();

  return (
    <section className="card reveal" ref={ref} id="how-it-works">
      <div className="section-heading">
        <h2><span className="section-heading__num">03</span>How it works</h2>
        <span className="muted">Privacy for individuals, proof for everyone</span>
      </div>
      <ol className="steps">
        {STEPS.map((step, i) => (
          <li className="step" key={step.n}>
            <span className="step__num" aria-hidden="true">
              <span className="step__icon">{STEP_ICONS[i]}</span>
              <span className="step__num-badge">{step.n}</span>
            </span>
            <div className="step__body">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

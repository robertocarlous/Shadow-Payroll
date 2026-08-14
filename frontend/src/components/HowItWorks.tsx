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
  return (
    <section className="card" id="how-it-works">
      <div className="section-heading">
        <h2>How it works</h2>
        <span className="muted">Privacy for individuals, proof for everyone</span>
      </div>
      <ol className="steps">
        {STEPS.map((step) => (
          <li className="step" key={step.n}>
            <span className="step__num" aria-hidden="true">
              {step.n}
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

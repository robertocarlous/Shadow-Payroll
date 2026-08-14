import { useEffect, useState } from 'react';
import { PROOF_SERVER_URL } from '../network';

const STEPS = [
  {
    id: 'lace',
    title: 'Install the Lace wallet',
    body: 'Get Lace for your browser and set it up. You will use it to sign your claim transaction.',
    link: 'https://www.lace.io/',
    linkLabel: 'lace.io',
  },
  {
    id: 'network',
    title: 'Switch Lace to the Preview network',
    body: 'Midnight Preview is the test network this payroll runs on. Choose it in Lace settings so your wallet signs Preview transactions.',
  },
  {
    id: 'dust',
    title: 'Get Preview funds from the faucet',
    body: 'Claims cost a tiny amount of DUST. Grab some free tNight/DUST from the Preview faucet and send it to your wallet.',
    link: 'https://midnight-tmnight-preview.nethermind.dev',
    linkLabel: 'Preview faucet',
  },
  {
    id: 'proof-server',
    title: 'Start the local proof-server',
    body: 'Lace does not generate Midnight proofs in-wallet yet, so proving runs against a local proof-server. One command:',
    code: 'docker compose up -d proof-server',
  },
  {
    id: 'connect',
    title: 'Connect your wallet here',
    body: 'Press "Connect Lace" in the bar above. The dashboard shows your connected address, and the claim panel unlocks.',
  },
  {
    id: 'claim',
    title: 'Claim your payout',
    body: 'In the Claim panel below, paste or upload the credential file the bot gave you, then press "Claim payout". Watch the progress bar move.',
  },
];

function CheckRow({ step, done, onToggle }: { step: (typeof STEPS)[number]; done: boolean; onToggle: () => void }) {
  return (
    <li className="check-row">
      <button
        type="button"
        className={`check-row__toggle ${done ? 'is-done' : ''}`}
        onClick={onToggle}
        aria-pressed={done}
        aria-label={`${done ? 'Mark as not done' : 'Mark as done'}: ${step.title}`}
      >
        {done ? '✓' : ''}
      </button>
      <div className="check-row__body">
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="check-row__meta">
          {step.link && (
            <a href={step.link} target="_blank" rel="noreferrer">
              {step.linkLabel}
            </a>
          )}
          {step.code && <code>{step.code}</code>}
          {step.code && <span className="muted"> · runs at {PROOF_SERVER_URL}</span>}
        </div>
      </div>
    </li>
  );
}

const STORAGE_KEY = 'shadow-payroll-onboarding-v1';

export function OnboardingChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, [done]);

  const completed = STEPS.filter((s) => done[s.id]).length;

  return (
    <section className="card" id="onboarding">
      <div className="section-heading">
        <h2>Your first payout, step by step</h2>
        <span className="muted">
          {completed}/{STEPS.length} done
        </span>
      </div>
      <p className="muted">
        New here? Work through the steps and tick each one off — your progress is saved on this
        device. Everything you need to go from zero to a claimed payout.
      </p>
      <ol className="check-list">
        {STEPS.map((step) => (
          <CheckRow
            key={step.id}
            step={step}
            done={Boolean(done[step.id])}
            onToggle={() => setDone((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
          />
        ))}
      </ol>
      {completed === STEPS.length && (
        <p className="status-badge good check-list__complete">All steps done — go claim your payout!</p>
      )}
    </section>
  );
}

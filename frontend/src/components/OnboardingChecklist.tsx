import { useEffect, useState } from 'react';
import { PROOF_SERVER_URL } from '../network';
import { useReveal } from '../useReveal';

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
    body: 'Open Lace, go to Settings, and pick "Preview" as the network. That just tells your wallet which test environment this payroll lives on.',
  },
  {
    id: 'dust',
    title: 'Get free test funds',
    body: 'Claiming costs a tiny, free test fee. Grab some from the faucet below and drop it into your wallet — takes a few seconds.',
    link: 'https://midnight-tmnight-preview.nethermind.dev',
    linkLabel: 'Open the faucet',
  },
  {
    id: 'proof-server',
    title: 'Turn on your privacy engine',
    body: "Sounds technical, but it's one copy-pasted command. Your wallet can't yet prove your claim by itself, so this runs that proof privately on your own computer — nothing about your claim ever leaves it. Paste the command below into a terminal.",
    link: 'https://www.docker.com/products/docker-desktop/',
    linkLabel: "Don't have Docker? Get it free",
    code: 'docker compose up -d proof-server',
    help: "Stuck here? That's normal on a first try — open a GitHub issue and we'll walk you through it.",
  },
  {
    id: 'connect',
    title: 'Connect your wallet here',
    body: 'Press "Connect wallet" at the top right of the page. The dashboard shows your connected address, and the claim panel unlocks.',
  },
  {
    id: 'claim',
    title: 'Claim your payout',
    body: 'In the Claim panel below, paste or upload the credential file the bot gave you, then press "Claim payout". Watch the progress bar move.',
  },
];

function CheckRow({ step, done, onToggle }: { step: (typeof STEPS)[number]; done: boolean; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!step.code) return;
    try {
      await navigator.clipboard.writeText(step.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the command is still selectable by hand
    }
  };

  return (
    <li className="check-row">
      <button
        type="button"
        className={`check-row__toggle ${done ? 'is-done' : ''}`}
        onClick={onToggle}
        aria-pressed={done}
        aria-label={`${done ? 'Mark as not done' : 'Mark as done'}: ${step.title}`}
      >
        {done && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </button>
      <div className="check-row__body">
        <h3>{step.title}</h3>
        <p>{step.body}</p>

        {step.code && (
          <div className="check-row__code">
            <code>{step.code}</code>
            <button type="button" className="check-row__copy" onClick={copyCode}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        <div className="check-row__meta">
          {step.link && (
            <a href={step.link} target="_blank" rel="noreferrer">
              {step.linkLabel}
            </a>
          )}
          {step.code && <span className="muted">runs at {PROOF_SERVER_URL}</span>}
        </div>

        {step.help && <p className="check-row__help">{step.help}</p>}
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
  const ref = useReveal();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      // ignore write failures (e.g. private browsing)
    }
  }, [done]);

  const completed = STEPS.filter((s) => done[s.id]).length;

  return (
    <section className="card reveal" ref={ref} id="onboarding">
      <div className="section-heading">
        <h2><span className="section-heading__num">01</span>Your first payout, step by step</h2>
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

import { ACTIVE_NETWORK } from '../network';
import { Logo } from './Logo';

const MOON_SIZE = 22;

function MoonGlyph({ phase, lit }: { phase: number; lit?: boolean }) {
  return (
    <svg
      width={MOON_SIZE}
      height={MOON_SIZE}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`moon-glyph ${lit ? 'is-lit' : ''}`}
    >
      <defs>
        <linearGradient id={`moon-fill-${phase}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="50%" stopColor="#f0c356" />
          <stop offset="100%" stopColor="#cf8f2c" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#moon-fill-${phase})`} fillOpacity={lit ? 1 : 0.85} />
      {phase < 1 && (
        <path d="M14 2a10 10 0 0 0 0 20c1.5-2 2.2-5.5 2.2-10S15.5 4 14 2z" fill="#0b0820" fillOpacity={lit ? 0.2 : 0.85} />
      )}
      {phase < 0.5 && phase >= 0.25 && <circle cx="12" cy="12" r="10" fill="none" stroke="#0b0820" strokeOpacity="0.2" strokeWidth="0.5" />}
      {phase === 1 && <circle cx="12" cy="12" r="4" fill="#0b0820" fillOpacity="0.08" />}
    </svg>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__emblem" aria-hidden="true">
        <Logo size={100} />
      </div>
      <div className="hero__chips" aria-hidden="true">
        <span className="chip">
          <span className="chip__dot" /> Proof-of-privacy payroll
        </span>
        <span className="chip chip--violet">
          <span className="chip__dot" /> Zero-knowledge claims
        </span>
        <span className="chip chip--teal">
          <span className="chip__dot" /> Live · {ACTIVE_NETWORK}
        </span>
      </div>
      <h1 className="hero__title">
        Private payouts.
        <br />
        <span className="hero__title-accent">Public proof.</span>
      </h1>
      <p className="hero__lead">
        A privacy-preserving payroll where every payee&apos;s amount stays secret — and everyone can
        watch the money add up correctly. Claim with a{' '}
        <strong>zero-knowledge proof</strong>; the dashboard proves the whole payroll reconciled
        without ever revealing who got what.
      </p>
      <div className="hero__actions">
        <a className="btn btn--primary btn--lg" href="#claim">
          Claim my payout
        </a>
        <a className="btn btn--ghost btn--lg" href="#how-it-works">
          See how it works
        </a>
      </div>
      <div className="hero__moon-strip" aria-hidden="true">
        <MoonGlyph phase={0} />
        <MoonGlyph phase={0.25} />
        <MoonGlyph phase={0.5} />
        <MoonGlyph phase={0.75} />
        <MoonGlyph phase={1} lit />
        <span className="hero__moon-strip__label">watch the moon fill as claims land</span>
      </div>
      <p className="hero__network">
        20 new Preview users onboarding · claim with a zero-knowledge proof, watch the payroll
        reconcile on-chain
      </p>
    </section>
  );
}
import { COHORT } from '../config';
import { AnimatedNumber } from './AnimatedNumber';
import { useReveal } from '../useReveal';

/**
 * Fifty anonymous slots — one per payee on the allowlist. Lit dots count
 * claims; the dashboard never learns (nor shows) which payee is which.
 */
export function CommunityStats({ claimsMade }: { claimsMade: number }) {
  const claimedPct = COHORT.size > 0 ? Math.round((claimsMade / COHORT.size) * 100) : 0;
  const ref = useReveal();

  return (
    <section className="card reveal" ref={ref} id="community">
      <div className="section-heading">
        <h2><span className="section-heading__num">02</span>The cohort, at a glance</h2>
        <span className="muted">{COHORT.name}</span>
      </div>

      <div
        className="cohort-dots"
        role="img"
        aria-label={`${claimsMade} of ${COHORT.size} payouts claimed`}
      >
        {Array.from({ length: COHORT.size }, (_, i) => (
          <span
            key={i}
            className={`cohort-dot ${i < claimsMade ? 'is-lit' : ''}`}
            style={i < claimsMade ? { animationDelay: `${(i % 10) * 60}ms` } : undefined}
          />
        ))}
      </div>

      <div className="cohort-legend">
        <span>
          <i className="legend-dot legend-dot--lit" /> claimed (anonymous)
        </span>
        <span>
          <i className="legend-dot" /> still waiting
        </span>
      </div>

      <div className="community-stats">
        <div className="community-stat">
          <span className="community-stat__value">
            <AnimatedNumber value={COHORT.size} />
          </span>
          <span className="community-stat__label">payees on the allowlist</span>
        </div>
        <div className="community-stat">
          <span className="community-stat__value">
            <AnimatedNumber value={claimsMade} />
          </span>
          <span className="community-stat__label">payouts claimed on-chain</span>
        </div>
        <div className="community-stat">
          <span className="community-stat__value">
            <AnimatedNumber value={claimedPct} />%
          </span>
          <span className="community-stat__label">of the cohort has claimed</span>
        </div>
      </div>

      <p className="muted community-note">
        Each payee claims with a private zero-knowledge proof, so this panel can count payouts
        without ever seeing who received them.
      </p>
    </section>
  );
}

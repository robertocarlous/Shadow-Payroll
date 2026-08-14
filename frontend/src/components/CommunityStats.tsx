import { COHORT } from '../config';

export function CommunityStats({ claimsMade }: { claimsMade: number }) {
  const claimedPct = COHORT.size > 0 ? Math.round((claimsMade / COHORT.size) * 100) : 0;

  return (
    <section className="card" id="community">
      <div className="section-heading">
        <h2>This payroll, in numbers</h2>
        <span className="muted">{COHORT.name}</span>
      </div>
      <div className="community-stats">
        <div className="community-stat">
          <span className="community-stat__value">{COHORT.size}</span>
          <span className="community-stat__label">payees on the allowlist</span>
        </div>
        <div className="community-stat">
          <span className="community-stat__value">{claimsMade}</span>
          <span className="community-stat__label">payouts claimed on-chain</span>
        </div>
        <div className="community-stat">
          <span className="community-stat__value">{claimedPct}%</span>
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

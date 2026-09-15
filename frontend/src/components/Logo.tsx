interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Shadow Payroll mark: a single gold crescent — the private "shadow" side of
 * the payroll — set on a deep navy-violet badge. One shape, two gradients,
 * legible from a 16px favicon up to a hero-sized lockup.
 */
export function Logo({ size = 28, className = '', animated = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Shadow Payroll logo"
    >
      <defs>
        <linearGradient id="sp-bg" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#241a5e" />
          <stop offset="55%" stopColor="#140f38" />
          <stop offset="100%" stopColor="#0a0720" />
        </linearGradient>
        <linearGradient id="sp-gold" x1="14" y1="16" x2="46" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffedb8" />
          <stop offset="45%" stopColor="#f0c356" />
          <stop offset="100%" stopColor="#cf8f2c" />
        </linearGradient>
        <mask id="sp-crescent">
          <rect width="64" height="64" fill="white" />
          <circle cx="36" cy="26.5" r="14" fill="black" />
        </mask>
      </defs>

      <rect x="3" y="3" width="58" height="58" rx="17" fill="url(#sp-bg)" />
      <rect
        x="3.6"
        y="3.6"
        width="56.8"
        height="56.8"
        rx="16.4"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1.2"
      />

      <circle cx="29" cy="32" r="16.5" fill="url(#sp-gold)" mask="url(#sp-crescent)" />

      {animated && (
        <>
          <style>{`
            @keyframes sp-glow-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
            .sp-glow-anim { animation: sp-glow-pulse 4s ease-in-out infinite; transform-origin: 50% 50%; }
          `}</style>
          <circle className="sp-glow-anim" cx="29" cy="32" r="16.5" fill="none" mask="url(#sp-crescent)" opacity="0.4">
            <animate attributeName="r" values="16.5;17.3;16.5" dur="4s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  );
}

/**
 * Full brand lockup: the mark + a two-tone logotype.
 * "SHADOW" reads in moon-silver, "PAYROLL" in violet, with a hairline
 * divider — the "shadow" over the "proof" of the payroll.
 */
export function BrandLockup({ size = 24, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <span className="brand-lockup">
      <Logo size={size} animated={animated} />
      <span className="brand-lockup__wordmark">
        <span className="brand-lockup__name">
          <span className="brand-lockup__shadow">Shadow</span>
          <span className="brand-lockup__divider" aria-hidden="true" />
          <span className="brand-lockup__payroll">Payroll</span>
        </span>
        <span className="brand-lockup__tag">Private payouts · public proof</span>
      </span>
    </span>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Shadow Payroll mark: a deep-space badge where a golden crescent moon
 * (the private "shadow") is locked with a violet proof-shield and teal check
 * (the public proof) inside a gradient ring.
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
        <radialGradient id="sp-bg" cx="0.38" cy="0.28" r="1.15" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#201758" />
          <stop offset="45%" stopColor="#110d2e" />
          <stop offset="100%" stopColor="#07051a" />
        </radialGradient>
        <linearGradient id="sp-ring" x1="8" y1="4" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="35%" stopColor="#d4a84a" />
          <stop offset="65%" stopColor="#9a7ad6" />
          <stop offset="100%" stopColor="#7c6cf0" />
        </linearGradient>
        <linearGradient id="sp-gold" x1="16" y1="12" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="28%" stopColor="#f5d06b" />
          <stop offset="62%" stopColor="#e8a830" />
          <stop offset="100%" stopColor="#c48520" />
        </linearGradient>
        <linearGradient id="sp-shield" x1="30" y1="20" x2="42" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#b9a9ff" />
          <stop offset="55%" stopColor="#8b78e8" />
          <stop offset="100%" stopColor="#5545c9" />
        </linearGradient>
        <linearGradient id="sp-check" x1="33" y1="25" x2="39" y2="31" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a0f5e8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <filter id="sp-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="sp-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1" />
        </filter>
        <clipPath id="sp-clip">
          <circle cx="32" cy="32" r="29.5" />
        </clipPath>
        <mask id="sp-crescent">
          <rect width="64" height="64" fill="white" />
          <circle cx="37.5" cy="25" r="16.5" fill="black" />
        </mask>
      </defs>

      {/* Badge background */}
      <g clipPath="url(#sp-clip)">
        <circle cx="32" cy="32" r="30" fill="url(#sp-bg)" />
        <ellipse cx="32" cy="7" rx="22" ry="10.5" fill="#ffffff" opacity="0.045" />
        <circle cx="32" cy="44" r="23" fill="url(#sp-gold)" opacity="0.07" filter="url(#sp-soft)" />
      </g>

      {/* Golden crescent moon */}
      <g filter="url(#sp-glow)">
        <circle
          cx="30.5"
          cy="32"
          r="19.5"
          fill="url(#sp-gold)"
          mask="url(#sp-crescent)"
        />
      </g>

      {/* Violet proof-shield */}
      <path
        d="M36.5 21.5 l5.5 3.2 v5.8 c0 3.8 -2.6 6.5 -5.5 8 -2.9 -1.5 -5.5 -4.2 -5.5 -8 v-5.8 z"
        fill="url(#sp-shield)"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.7"
      />

      {/* Teal check */}
      <path
        d="M34 25.6 l1.8 1.8 3.2 -3.8"
        stroke="url(#sp-check)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Sparkle */}
      <g opacity="0.9">
        <path d="M47.2 13.4 v3 M45.7 14.9 h3" stroke="#ffe9a8" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="47.2" cy="14.9" r="0.6" fill="#ffe9a8" opacity="0.6" />
      </g>

      {/* Rings */}
      <circle cx="32" cy="32" r="29.8" stroke="url(#sp-ring)" strokeWidth="1.8" />
      <circle cx="32" cy="32" r="27.5" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />

      {animated && (
        <>
          <style>{`
            @keyframes sp-ring-pulse {
              0%, 100% { opacity: 0.2; r: 31.2; }
              50% { opacity: 0.55; r: 32; }
            }
            .sp-ring-anim {
              transform-origin: 50% 50%;
              animation: sp-ring-pulse 4s ease-in-out infinite;
            }
          `}</style>
          <circle
            className="sp-ring-anim"
            cx="32"
            cy="32"
            r="31.2"
            stroke="url(#sp-gold)"
            strokeWidth="0.9"
            fill="none"
            opacity="0.35"
          />
        </>
      )}
    </svg>
  );
}

/**
 * Full brand lockup: the mark + a distinctive two-tone logotype.
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
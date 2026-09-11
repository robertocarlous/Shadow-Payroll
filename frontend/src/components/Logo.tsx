interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * Shadow Payroll mark: a dark badge where a gold crescent moon and a
 * violet proof-shield lock together inside a gradient ring. The moon is the
 * private "shadow"; the stamped check mark is the public proof. Reads cleanly
 * at 16px in the favicon up to a lockup in the hero.
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
        <radialGradient id="sp-badge" cx="0.36" cy="0.3" r="1.1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#191440" />
          <stop offset="52%" stopColor="#0d0b24" />
          <stop offset="100%" stopColor="#070514" />
        </radialGradient>
        <linearGradient id="sp-ring" x1="12" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="48%" stopColor="#c49a52" />
          <stop offset="100%" stopColor="#7c6cf0" />
        </linearGradient>
        <linearGradient id="sp-gold" x1="20" y1="18" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff0c2" />
          <stop offset="48%" stopColor="#f0c356" />
          <stop offset="100%" stopColor="#cf8f2c" />
        </linearGradient>
        <linearGradient id="sp-shield" x1="32" y1="24" x2="40.5" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a89bff" />
          <stop offset="100%" stopColor="#5b4bd6" />
        </linearGradient>
        <linearGradient id="sp-check" x1="34" y1="26" x2="38" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8cf2e2" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <filter id="sp-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <clipPath id="sp-clip">
          <circle cx="32" cy="32" r="29.4" />
        </clipPath>
        <mask id="sp-crescent">
          <rect width="64" height="64" fill="white" />
          <circle cx="37" cy="27.5" r="15" fill="black" />
        </mask>
      </defs>

      <g clipPath="url(#sp-clip)">
        <circle cx="32" cy="32" r="30" fill="url(#sp-badge)" />
        <ellipse cx="30" cy="10" rx="21" ry="11" fill="#ffffff" opacity="0.05" />
        <circle cx="32" cy="38" r="26" fill="url(#sp-gold)" opacity="0.07" filter="url(#sp-soft)" />
      </g>

      <circle
        cx="30.5"
        cy="32"
        r="19.5"
        fill="url(#sp-gold)"
        mask="url(#sp-crescent)"
        filter="url(#sp-soft)"
      />
      <circle
        cx="30.5"
        cy="32"
        r="19.5"
        fill="url(#sp-gold)"
        mask="url(#sp-crescent)"
      />

      <path
        d="M36 23.2 l4.6 2.7 v4.5 c0 3.2 -2.2 5.6 -4.6 6.9 -2.4 -1.3 -4.6 -3.7 -4.6 -6.9 v-4.5 z"
        fill="url(#sp-shield)"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="0.8"
      />
      <path
        d="M33.9 26.9 l1.6 1.6 2.9 -3.3"
        stroke="url(#sp-check)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      <path d="M46.4 14.6 v3 M45.2 15.8 h3" stroke="#ffe9a8" strokeWidth="1.4" strokeLinecap="round" />

      <circle cx="32" cy="32" r="29.5" stroke="url(#sp-ring)" strokeWidth="1.7" />
      <circle cx="32" cy="32" r="27.2" stroke="rgba(255,255,255,0.05)" strokeWidth="0.9" />
      {animated && (
        <>
          <style>{`
            @keyframes sp-logo-pulse { 0%,100% { opacity: 0.25; } 50% { opacity: 0.7; } }
            .logo-ring {
              transform-origin: 50% 50%;
              animation: sp-logo-pulse 4.5s ease-in-out infinite;
            }
          `}</style>
          <circle
            className="logo-ring"
            cx="32"
            cy="32"
            r="31.4"
            stroke="url(#sp-gold)"
            strokeWidth="1.1"
            opacity="0.5"
          />
        </>
      )}
    </svg>
  );
}
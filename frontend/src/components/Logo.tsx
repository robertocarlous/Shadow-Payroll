interface LogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function Logo({ size = 28, className, animated = true }: LogoProps) {
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
        <linearGradient id="moonGrad" x1="10" y1="10" x2="54" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="40%" stopColor="#f2c94c" />
          <stop offset="100%" stopColor="#e8a13a" />
        </linearGradient>
        <linearGradient id="shieldGrad" x1="22" y1="14" x2="42" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c6cff" />
          <stop offset="100%" stopColor="#35e0c4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {animated && (
        <style>{`
          @keyframes logo-pulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
          .logo-ring { animation: logo-pulse 4s ease-in-out infinite; }
        `}</style>
      )}
      <circle cx="32" cy="32" r="30" stroke="url(#moonGrad)" strokeWidth="1.5" fill="none" opacity="0.3" className="logo-ring" />
      <circle cx="28" cy="30" r="18" fill="url(#moonGrad)" filter="url(#glow)" />
      <circle cx="34" cy="28" r="14" fill="#0b0820" />
      <path
        d="M32 20 L36 28 L32 26 L28 28 Z"
        fill="url(#shieldGrad)"
        opacity="0.9"
      />
      <path
        d="M32 26 L36 28 L34 34 L32 36 L30 34 L28 28 Z"
        fill="url(#shieldGrad)"
        opacity="0.6"
      />
    </svg>
  );
}

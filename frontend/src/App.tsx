import { useState, useCallback, useEffect } from 'react';
import { usePayrollState } from './usePayrollState';
import { ACTIVE_NETWORK, CONTRACT_ADDRESS } from './network';
import { WalletProvider } from './context/WalletContext';
import { WalletBar } from './components/WalletBar';
import { Hero } from './components/Hero';
import { PayrollStatus } from './components/PayrollStatus';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { ClaimPanel } from './components/ClaimPanel';
import { Faq } from './components/Faq';
import { Logo, BrandLockup } from './components/Logo';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

const NAV_LINKS = [
  ['#status', 'Status'],
  ['#onboarding', 'Get started'],
  ['#claim', 'Claim'],
  ['#faq', 'FAQ'],
] as const;

export default function App() {
  const state = usePayrollState();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Pause decorative CSS animations while the user is actively scrolling so
  // the compositor can dedicate its frames to scrolling; they resume ~160ms
  // after scrolling stops.
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      document.body.classList.add('is-scrolling');
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => document.body.classList.remove('is-scrolling'), 160);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileNavOpen]);

  return (
    <ErrorBoundary>
      <WalletProvider>
        <div className="page">
        <header className="header">
          <a className="header__brand" href="#top">
            <Logo size={24} className="header__logo-svg" />
            <span className="header__name">
              <span className="header__name-shadow">Shadow</span>
              <span className="header__name-divider" aria-hidden="true" />
              <span className="header__name-payroll">Payroll</span>
            </span>
          </a>
          <nav className="header__nav" aria-label="Page sections">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} className="header__link">
                {label}
              </a>
            ))}
          </nav>
          <div className="header__right">
            <span className="header__badge">Live · {ACTIVE_NETWORK}</span>
            <WalletBar />
            <button
              className="header__hamburger"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
            >
              <span className={`header__hamburger-line ${mobileNavOpen ? 'is-open' : ''}`} />
              <span className={`header__hamburger-line ${mobileNavOpen ? 'is-open' : ''}`} />
              <span className={`header__hamburger-line ${mobileNavOpen ? 'is-open' : ''}`} />
            </button>
          </div>
        </header>

        {mobileNavOpen && (
          <div className="mobile-nav" role="dialog" aria-label="Navigation menu">
            <div className="mobile-nav__backdrop" onClick={closeMobileNav} />
            <nav className="mobile-nav__panel">
              {NAV_LINKS.map(([href, label]) => (
                <a key={href} href={href} className="mobile-nav__link" onClick={closeMobileNav}>
                  {label}
                </a>
              ))}
            </nav>
          </div>
        )}

        <main className="layout" id="top">
          <Hero />

          <PayrollStatus state={state} />

          <OnboardingChecklist />

          <ClaimPanel />

          <Faq />
        </main>

        <footer className="footer">
          <div className="footer__top">
<div className="footer__brand">
            <BrandLockup size={20} animated={false} />
          </div>
            <div className="footer__links">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="footer__link" aria-label="GitHub">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer__link" aria-label="X / Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
          <div className="footer__meta-row">
            <span className="footer__meta-item">
              Network: <strong>{ACTIVE_NETWORK}</strong>
            </span>
            {CONTRACT_ADDRESS && (
              <span className="footer__meta-item">
                Contract: <code>{CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)}</code>
              </span>
            )}
          </div>
          <p className="footer__note">
            Individual payee amounts are never shown here — only they are, by design.
            This view only proves the running total was fully and correctly distributed.
          </p>
        </footer>
        </div>
      </WalletProvider>
    </ErrorBoundary>
  );
}

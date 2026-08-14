import { usePayrollState } from './usePayrollState';
import { ACTIVE_NETWORK, CONTRACT_ADDRESS } from './network';
import { WalletProvider } from './context/WalletContext';
import { WalletBar } from './components/WalletBar';
import { Hero } from './components/Hero';
import { PayrollStatus } from './components/PayrollStatus';
import { CommunityStats } from './components/CommunityStats';
import { HowItWorks } from './components/HowItWorks';
import { OnboardingChecklist } from './components/OnboardingChecklist';
import { ClaimPanel } from './components/ClaimPanel';
import { Faq } from './components/Faq';
import { FeedbackPanel } from './components/FeedbackPanel';
import './App.css';

export default function App() {
  const state = usePayrollState();
  const claimsMade = state.status === 'ready' ? Number(state.state.claimsMade) : 0;

  return (
    <WalletProvider>
      <div className="page">
        <header className="header">
          <div className="header__brand">
            <span className="header__logo" aria-hidden="true">
              🌕
            </span>
            <span className="header__name">Shadow Payroll</span>
          </div>
          <span className="header__badge">{ACTIVE_NETWORK}</span>
        </header>

        <main className="layout">
          <Hero />

          <WalletBar />

          <PayrollStatus state={state} />
          <CommunityStats claimsMade={claimsMade} />

          <HowItWorks />

          <OnboardingChecklist />

          <ClaimPanel />

          <Faq />

          <FeedbackPanel />
        </main>

        <footer className="footer">
          <p>
            Network: <strong>{ACTIVE_NETWORK}</strong>
            {CONTRACT_ADDRESS && (
              <>
                {' · '}Contract:{' '}
                <code>
                  {CONTRACT_ADDRESS.slice(0, 10)}…{CONTRACT_ADDRESS.slice(-6)}
                </code>
              </>
            )}
          </p>
          <p className="muted">
            Individual payee amounts are never shown here — only they are, by design.
            This view only proves the running total was fully and correctly distributed.
          </p>
        </footer>
      </div>
    </WalletProvider>
  );
}

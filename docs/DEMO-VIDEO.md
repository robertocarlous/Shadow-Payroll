# 📹 Shadow Payroll — Demo Video Checklist (Level 6)

Record one continuous take covering the full MVP flow. Keep each shot on
screen long enough to read; no cuts that hide how a step works.

## Before recording

- [ ] Resolution ≥ 1280×720, screen recording with **system audio off**
- [ ] Lace wallet unlocked, on **Preview**, with DUST balance
- [ ] Docker proof-server running: `docker compose up -d proof-server`
- [ ] Two unused credentials ready (one to claim, one to show double-claim)
- [ ] Browser zoom at 100%, dark theme, clean desktop

## The recording

1. **Contract address on screen (mandatory).**
   Show the README **Contract Address** table, or `frontend/.env`
   (`VITE_NETWORK=preview`, `VITE_CONTRACT_ADDRESS=…`), long enough to read.

2. **What this is (15s voiceover).**
   "Private payroll on Midnight: one Merkle root commits the payee list; each
   payee claims with a zero-knowledge proof; nobody learns who earns what."

3. **Dashboard overview.**
   Open https://shadow-payroll.vercel.app — show status tiles, progress /
   community stats, onboarding checklist, FAQ.

4. **Connect Lace.**
   Press **Connect Lace**, approve in the wallet, show the address chip.

5. **Full product flow — claim end to end.**
   - Scroll to **Claim your payout**
   - Drag/paste your first credential
   - **Show the credential preview** (payee + amount) — the Level 6
     improvement
   - Press **Claim payout** (30–60s), show the "Proving + submitting…" state
   - Show the green **Claimed** banner with the tx id
   - Show the on-chain result: "Claims made" + progress bar move within a few
     seconds

6. **Privacy model end to end (mandatory).**
   - Show that **no payee list, no per-person amounts** exist on the
     dashboard — only a running total
   - Attempt a **second claim with the same credential** → show the
     double-claim rejection (nullifier guard) — this is the proof that the
     privacy model works, on-chain
   - (Optional) CLI: `npm run cli` → *3. View public audit state* → show
     `totalClaimed`/`totalBudget` reconciled, `usedNullifiers` count

7. **Close.**
   "Same payroll, same audit — salaries private, totals provable." Link the
   repo + live dashboard on screen.

## After recording

- [ ] Link the recording in [docs/LEVEL6.md](LEVEL6.md) `## Demo video`
- [ ] Note the timestamp of the double-claim rejection in the description
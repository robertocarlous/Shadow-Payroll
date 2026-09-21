# Updates in this Wave — Shadow Payroll (Midnight)

*(AKINDO Wave 1 submission copy — update the "build period" phrasing before submitting.)*

> **Frozen snapshot:** the contract address below is the Wave 1 deployment,
> not the current one. The contract has since been redeployed; see the
> "Public Network Deployment Status" section in the root
> [README.md](../README.md) for the current address and date.

## 1. The core MVP: built, deployed, and live on Midnight Preview

During this wave I built the core Shadow Payroll MVP from the ground up in this repository: a privacy-preserving payroll / revenue-split dApp where an employer can pay a team on-chain without ever revealing individual salaries.

**How it works (the Midnight privacy design):**
- The employer commits a **private `{payee, amount}` allowlist** as a single public Merkle root (depth-8, up to 256 payees) and declares a total budget.
- Each payee computes a **local zero-knowledge proof** showing three facts at once: (1) they are on the allowlist — **without revealing which leaf is theirs**; (2) they have not claimed before — a nullifier derived only from their secret, so double-claims are rejected on-chain; and (3) the payroll stays solvent (`totalClaimed + amount <= totalBudget`).
- What reaches the chain is only the root, each claim's secret-derived nullifier, and a public running total — so anyone can audit that the payroll was fully and correctly distributed while individual amounts and ownership stay private (unlinkability via nullifiers).

**Smart contract** (`contracts/payroll.compact`, Compact / language 0.23):
- `fundPayroll(root, budget, deadline, empSecret)` — one-time employer setup
- `claim(timeOverride)` — the ZK membership + nullifier + solvency circuit
- `removePayee(payeeSecret, empSecret)` — employer-only payee revocation, authorized via an employer nullifier
- `isReconciled()` — `true` once `totalClaimed == totalBudget`

**Wave 1 contract extensions also verified in this wave:**
- **Claim expiration:** claims are rejected after `claimDeadline` (Unix seconds), with a `timeOverride` hook for testing
- **Payee removal:** the employer can revoke a payee before they claim

**Off-chain stack built alongside the contract:**
- Employer allowlist builder (`src/allowlist.ts`) that produces the root and one private bearer-credential per payee (secret, amount, Merkle path)
- Interactive employer/payee CLI (fund, claim, audit) with Lace-based wallet integration and node-RPC fallback
- React + Vite public audit dashboard (`frontend/`) — read-only stats polled from the indexer, plus a wallet-connected "Claim a payout" flow proving against a local proof-server
- Docker local devnet (node + indexer + proof-server) and GitHub Actions CI
- 24 passing tests (contract simulator + on-chain helpers)

**Live on Midnight Preview:**
- Live dashboard: <https://shadow-payroll.vercel.app>
- GitHub: <https://github.com/robertocarlous/Shadow-Payroll>
- Demo video: <https://www.loom.com/share/eb48ddadfac6462393968868a784c57f>
- Live contract: `8273828c7cc7fe141847c769b8e4ca09c5ba4d44916d13e2f1b8ca60207ab6f0`

**Two real deployments were executed on-chain during this wave:**
- A live payroll (budget 350 tNight) that has been fully claimed and reconciled with real ZK proofs on Preview
- A judge-testable instance funded with four small unclaimed allocations (10/20/30/40) so any visitor can connect a wallet and watch "Total claimed" update live on the dashboard
- A 50-user cohort (50 payee credentials + `USERS.md` wallet list, allowlist root `884c9d18ae415cc36a46805c88e2ebff25c14dab03a5ef181418b2bb08c35682`, budget 6,375 tNight) — every credential verifies against the committed root, and amounts cross-check the cohort ledger 1:1

## 2. Wave 1 engineering, QA, and submission hardening

- **CI fixed and made reliable:** diagnosed and resolved a Compact toolchain regression (a newly released compiler moved its language version past 0.23 and rejected the contract's pragma), pinned `compact update 0.31.1`, and restored both CI jobs (compile + tests, frontend build) to green on every push
- **Typechecking is now a real gate:** removed the `|| true` escape hatch from `npm run build` and fixed all strict-mode type errors in the witness-wiring code, so the repo typechecks clean and CI fails on regressions
- **Apache-2.0 licensed** the project (LICENSE, package.json, README) per the Buildathon's open-source requirements
- Added the required `midnightntwrk` label and Midnight topic tags to the repo
- **Hardened credential handling:** gitignored the real-credential output directories so bearer secrets can never be accidentally committed, and documented which data is public demo material vs. private secrets
- Committed the operational tooling that produced the live on-chain claims (one-shot claim/fund scripts, indexer fetch-retry wrapper, RPC patch), making the `deploy → fund → claim → reconcile` flow fully reproducible
- Rewrote the README to submission standard: what it does, privacy model (hidden vs. visible), architecture, contract logic, live deployment status, try-it-yourself walkthrough, setup, usage, testing, and CI/CD

## How to verify the deliverable

- Contract compiles: `compact compile contracts/payroll.compact contracts/managed/payroll`
- Tests: `npm test` (24/24 pass)
- Claim live on the dashboard: open <https://shadow-payroll.vercel.app>, connect Lace on Preview, and use one of the public test credential files under `docs/try-it-yourself/credentials/` (`judge1.json` – `judge4.json`)
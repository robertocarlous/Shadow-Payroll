# 🌕 Level 6 — Supermoon Submission

This document is the Level 6 "Supermoon" submission map: what the milestone
requires, and exactly where in this repository each requirement is met.

## The same MVP from Level 5, extended

Shadow Payroll's MVP is unchanged in substance (a privacy-preserving payroll
on Midnight where each payee claims with a zero-knowledge proof against a
private Merkle allowlist — see [README](../README.md) and
[ARCHITECTURE.md](ARCHITECTURE.md)). The Level 6 extensions are about
meeting **50+ real users** with a living feedback loop and docs that hold
their weight:

1. **A Level 6 launch cohort.** Target **20 new Preview users** onboarded this
   cycle on top of the existing 50-user Level 5 cohort. Wallet addresses are
   tracked in [LAUNCH_USERS.md](../LAUNCH_USERS.md) (Level 6) and
   [USERS.md](../USERS.md) (Level 5, 50 addresses) — all verifiable on-chain
   against the contract's allowlist root.
2. **Feedback-driven product changes.** The dashboard now previews a pasted
   credential (payee + amount, without posting the amount on-chain) so an
   ambiguous "claim failed" is far less likely, and surfaces the network
   state in the hero. See the changelog in
   [docs/FEEDBACK.md](FEEDBACK.md).
3. **A self-service user guide.** [docs/USAGE.md](USAGE.md) is a plain-English
   "Getting Started on Preview" + "Your First Transaction" walkthrough that
   non-technical users can follow end to end.

> **Network note:** this project deploys to Midnight **Preview** — Preprod
> was unavailable this cycle (the indexer/DUST failures documented in the
> README are a confirmed Midnight infra issue). Preview is the identical
> code path and the network the product already runs on.

## 50 Preprod users (verifiable wallet addresses)

Read as "50+ users on the test network the MVP actually lives on":

- **Level 5 cohort (50):** [USERS.md](../USERS.md) — 50 derived Midnight
  addresses committed to a single allowlist root, funded on-chain, verifiable
  via ZK proofs.
- **Level 6 cohort (target 20):** [LAUNCH_USERS.md](../LAUNCH_USERS.md) —
  new users acquired during this cycle, each recording their Preview wallet
  address on onboarding.

## Feedback loop documented

- [docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) — the loop: collect (GitHub
  issues) → triage (weekly, P0/P1/P2) → ship (changelog) → re-check.
- [docs/FEEDBACK.md](FEEDBACK.md) — Level 6 changelog with the
  "Level 6 Improvements" table (change ↔ feedback ↔ status).
- [docs/level5/FEEDBACK.md](level5/FEEDBACK.md) — Level 5 entries.

## Updated documentation

- [README](../README.md) — final, complete with Contract Address table,
  Live Demo, Privacy Model, Tech Stack, Setup & Run Locally, Run Tests,
  CI/CD, Usage Guide, Feedback & Iterations, Level 6 Users.
- [docs/USAGE.md](USAGE.md) — plain-English user guide.
- [docs/LEVEL6.md](LEVEL6.md) — this submission map.
- [docs/FEEDBACK.md](FEEDBACK.md), [docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md),
  [docs/ARCHITECTURE.md](ARCHITECTURE.md).

## Minimum 30 meaningful commits

The repository holds well over 30 meaningful commits spanning Levels 2–6
(see `git log`); the Level 6 cycle adds commits for the credential-preview
UI, the user guide, the launch-cohort tracker, the README, and this map.

## Submission checklist

| Item | Where |
|---|---|
| Public GitHub repository, updated docs | `github.com/robertocarlous/Shadow-Payroll`, `main` |
| Same MVP as Level 5, extended | `contracts/payroll.compact`, `src/`, frontend |
| 50+ users (verifiable wallet addresses) | [USERS.md](../USERS.md) + [LAUNCH_USERS.md](../LAUNCH_USERS.md) |
| Feedback loop documented | [docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) + [docs/FEEDBACK.md](FEEDBACK.md) |
| Updated documentation | README + docs (see above) |
| Live demo link | https://shadow-payroll.vercel.app |
| Contract address (README, MANDATORY) | see [README Contract Address](../README.md#contract-address) |
| List of 50+ user addresses | [USERS.md](../USERS.md) + [LAUNCH_USERS.md](../LAUNCH_USERS.md) |
| Addresses verifiable on-chain | claims against the contract's allowlist root produce on-chain ZK proofs |
| Feedback documentation | [docs/FEEDBACK.md](FEEDBACK.md) + [docs/FEEDBACK-LOOP.md](FEEDBACK-LOOP.md) |
| Demo video | see [Demo video](#demo-video) below |
| Minimum 30 meaningful commits | `git log` |

## Redeploying the updated contract (Preview)

```bash
npm run setup -- --network preview
```

This brings up the proof-server, recompiles `contracts/payroll.compact`,
deploys a fresh contract, and records the new address under
`.midnight-state.json` → `deployments.preview.address`. After it completes:

1. **Copy the new contract address** printed by the deploy step.
2. **Paste it into the README Contract Address table** (top of README).
3. **Point the frontend at it:**
   `frontend/.env` and `frontend/.env.production`, variable
   `VITE_CONTRACT_ADDRESS`.
4. **Fund the new payroll** with the cohort allowlist root:
   `npm run cli` → *1. Fund payroll* → paste `docs/level5/root.json`
   (existing cohort) — or build a Level 6 payroll
   (`npm run build-allowlist payroll-input.example.json`).

## Demo video

Recording checklist:

- [ ] Show the Preprod/Preview contract address **on screen** (README table or `.env`)
- [ ] Open the live dashboard, connect Lace
- [ ] Walk the "Getting Started on Preview" checklist live
- [ ] Paste a Level 6 credential → show the **credential preview** banner (payee + amount)
- [ ] Claim end to end → watch "Claims made" / progress move on-chain
- [ ] Show a second credential and the already-claimed rejection
- [ ] Show the double-claim guard (privacy model working end to end)
- [ ] Link the recording here